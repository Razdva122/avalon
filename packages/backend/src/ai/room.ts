import { randomUUID } from 'crypto';
import { Room } from '@/room';
import { AI_PROFILE_RATING_SEASON } from './rating-season';
import type { AiLanguage, AiPlayerCount, GameOptions, Server, TRoomState, AiSpectatorDecision } from '@avalon/types';
import type { TGameMethodsParams } from '@/core/game-manager';
import { AiPause, AiTechnicalPause, AiMatchBudgetPause, type Decide, type BotRequest, type BotReply } from './client';
import { aiText, isAfterGameSpeech, isVoteOnly } from './language';

import { BOT_AGENTS, selectBotAgents } from './agents';
export { BOT_PROFILES } from './agents';
export const botOptions: GameOptions = {
  roles: { merlin: 1, percival: 1, mordred: 1, morgana: 1, oberon: 1 },
  addons: { ladyOfLake: true },
  features: { wtfMode: false, displayIndex: true },
};

type Choice = { text: string; actions: TGameMethodsParams[] };
function combinations(ids: string[], count: number): string[][] {
  if (count === 0) return [[]];
  return ids.flatMap((id, i) => combinations(ids.slice(i + 1), count - 1).map((tail) => [id, ...tail]));
}

export class BotRoom extends Room {
  renewLease?: () => Promise<void>;
  readonly spectatorDecisions: AiSpectatorDecision[] = [];
  private decisionSequence = 0;
  private cancelled = false;
  private executing = false;
  private wakeHuman?: () => void;
  private discussionMessages?: { since: number; existing: Set<string | undefined> };
  private missionChoices = new Map<string, Choice>();
  budgetResumeUnits = 0;
  private discussion?: {
    spoken: Set<string>;
    finalTeam?: Choice;
    votes: Map<string, 'approve' | 'reject'>;
    pendingPublication?: { id: string; text: string; requestID: string };
  };
  private councilSpoken = new Set<string>();
  private councilPending?: { id: string; text: string; requestID: string };
  private reviewedPlayers = new Set<string>();
  private abort = new AbortController();
  private failures = 0;
  private calls = 0;
  private rolesKnownBeforeReveal = new Map<string, [number, string][]>();
  private evilCouncil: { seat: string; target: string; reason: string }[] = [];
  constructor(
    id: string,
    owner: string,
    io: Server,
    private decide: Decide,
    private checkpoint: (state: TRoomState) => Promise<void> = async () => {},
    private delayMs = 0,
    private readonly language: AiLanguage = 'en',
    playerCount: AiPlayerCount = 7,
  ) {
    if (![5, 6, 7, 8].includes(playerCount)) throw Error('Invalid AI player count');
    const agents = selectBotAgents(undefined, playerCount);
    const options = structuredClone(botOptions);
    if (playerCount !== 7) {
      delete options.roles.oberon;
    }
    if (playerCount < 7) delete options.addons.ladyOfLake;
    super(
      id,
      owner,
      agents.map((p) => p.id),
      io,
      options,
    );
    this.onChatMessage = (entry) => {
      if (
        entry.kind !== 'sticker' &&
        entry.userID === this.ai?.humanPlayerID &&
        this.ai.status === 'running' &&
        this.ai.waitingForDiscussion &&
        !(this.manager.game.stage === 'assassinate'
          ? this.councilSpoken.has(entry.userID)
          : this.discussion?.spoken.has(entry.userID)) &&
        this.discussionMessages &&
        entry.timestamp >= this.discussionMessages.since &&
        !this.discussionMessages.existing.has(entry.id)
      )
        this.finishDiscussion(entry.userID);
    };
    this.maxCapacity = playerCount;
    this.data = { stage: 'locked' };
    this.ai = {
      language,
      playerCount,
      status: 'ready',
      profileRatingSeason: AI_PROFILE_RATING_SEASON,
      costRub: 0,
      fallbacks: 0,
      message: aiText(language).ready,
    };
  }
  override joinGame(userID: string): void {
    void userID;
    throw Error('AI room has fixed seats');
  }
  joinAsHuman(userID: string): void {
    if (this.ai!.status !== 'ready' || this.data.stage !== 'locked' || userID !== this.leaderID)
      throw Error('Only the administrator owner can join before launch');
    if (this.ai!.humanPlayerID) {
      if (this.ai!.humanPlayerID === userID) return;
      throw Error('The human seat is occupied');
    }
    this.players[this.players.length - 1] = userID;
    this.ai!.humanPlayerID = userID;
    delete this.ai!.profileRatingSeason;
  }

  private councilComplete(): boolean {
    return (
      !this.councilPending &&
      this.manager.game.players.filter((p) => p.role.loyalty === 'evil').every((p) => this.councilSpoken.has(p.userID))
    );
  }

  override updateRoomState(direct = false, chatOnly = false) {
    if (
      this.ai &&
      this.data.stage === 'started' &&
      this.data.manager.game.stage === 'assassinate' &&
      !this.councilComplete()
    )
      this.ai.discussionPending = true;
    super.updateRoomState(direct, chatOnly);
  }

  humanAction(userID: string, params: TGameMethodsParams): void {
    if (userID !== this.ai!.humanPlayerID || this.ai!.status !== 'running')
      throw Error('AI players are controlled by the server');
    if (
      (params.method === 'sentSelectedPlayers' && this.ai!.discussionPending) ||
      (params.method === 'assassinate' && !this.councilComplete())
    )
      throw Error('Wait until the public discussion finishes');
    this.manager.callGameMethods(userID, params);
    if (params.method === 'sentSelectedPlayers' && this.manager.game.stage !== 'selectTeam')
      this.discussion = undefined;
    this.wakeHuman?.();
  }

  finishDiscussion(userID: string): void {
    if (userID !== this.ai!.humanPlayerID || this.ai!.status !== 'running' || !this.ai!.waitingForDiscussion)
      throw Error('Not your discussion turn');
    if (this.manager.game.stage === 'assassinate') {
      if (
        this.councilSpoken.has(userID) ||
        this.manager.game.players.find((p) => p.userID === userID)?.role.loyalty !== 'evil'
      )
        throw Error('Not your discussion turn');
      this.councilSpoken.add(userID);
    } else {
      if (this.manager.game.stage !== 'selectTeam' || !this.discussion || this.discussion.spoken.has(userID))
        throw Error('Not your discussion turn');
      this.discussion.spoken.add(userID);
    }
    this.wakeHuman?.();
  }

  private async waitForHuman(pending: () => boolean, discussion = false) {
    if (this.cancelled || !pending()) return;
    this.ai!.waitingForHuman = true;
    if (discussion) {
      this.discussionMessages = { since: Date.now(), existing: new Set(this.chat.history.map((entry) => entry.id)) };
      this.ai!.waitingForDiscussion = true;
    }
    this.ai!.message = discussion ? aiText(this.language).waitingForDiscussion : aiText(this.language).waitingForHuman;
    this.updateRoomState(true);
    let leaseTimer: ReturnType<typeof setTimeout> | undefined;
    let waiting = true;
    try {
      await this.checkpoint(this.calculateRoomState());
      await new Promise<void>((resolve, reject) => {
        this.wakeHuman = () => {
          if (this.cancelled || !pending()) {
            waiting = false;
            resolve();
          }
        };
        const renew = async () => {
          try {
            if (!waiting) return;
            await this.renewLease!();
            if (waiting) leaseTimer = setTimeout(renew, 60000);
          } catch {
            if (waiting) reject(new AiTechnicalPause('Could not retain AI room ownership. Retry to continue.'));
          }
        };
        if (this.renewLease) leaseTimer = setTimeout(renew, 60000);
        this.wakeHuman();
      });
    } finally {
      waiting = false;
      clearTimeout(leaseTimer);
      this.wakeHuman = undefined;
      delete this.ai!.waitingForHuman;
      delete this.ai!.waitingForDiscussion;
      this.discussionMessages = undefined;
      this.updateRoomState(true);
    }
  }
  override leaveGame(userID: string): void {
    void userID;
    throw Error('AI room has fixed seats');
  }
  override updateOptions(options: GameOptions): void {
    void options;
    throw Error('AI room has fixed options');
  }
  override toggleLockedState(): void {
    throw Error('AI room is locked');
  }
  override shuffle(): void {
    throw Error('AI room has fixed seats');
  }
  override startVoteFor(): void {
    throw Error('Use AI room controls');
  }
  override startGame(): void {
    throw Error('Use AI room controls');
  }

  stop() {
    this.cancelled = true;
    this.wakeHuman?.();
    delete this.ai!.thinkingPlayerID;
    this.abort.abort();
    this.ai!.status = 'stopped';
    this.ai!.canResumeBudget = false;
    this.ai!.canResumeTechnical = false;
    this.ai!.message = 'Stopped by the administrator.';
    if (this.data.stage === 'started' && this.data.manager.game.stage !== 'end')
      this.data.manager.game.endGame('manualy');
    this.updateRoomState(true);
  }

  private stateFor(id: string) {
    if (this.data.stage !== 'started') throw Error('AI room not started');
    const state = structuredClone(this.data.manager.prepareStateForUser(id));
    state.players = state.players.map((p) => ({ ...p, name: `${p.index}` }));
    return state;
  }
  private label(id: string) {
    return `${this.manager.game.players.find((p) => p.userID === id)!.index}`;
  }
  private get manager() {
    if (this.data.stage !== 'started') throw Error('AI room not started');
    return this.data.manager;
  }
  private select(ids: string[]): TGameMethodsParams[] {
    return ids.map((playerID) => ({ method: 'selectPlayer', playerID }));
  }
  private teams(id: string): Choice[] {
    const state = this.stateFor(id);
    return combinations(
      state.players.map((p) => p.id),
      state.settings.missions[state.mission].players,
    ).map((ids) => ({
      text: ids.map((id) => this.label(id)).join(', '),
      actions: this.select(ids),
    }));
  }

  private async ask(
    id: string,
    task: string,
    choices: Choice[],
    speak: boolean,
    privateCheck?: string,
    councilDiscussion = false,
    publicDiscussion = false,
    optionalSpeech = false,
  ): Promise<BotReply | null> {
    if (this.cancelled) return null;
    if (!speak && choices.length === 1) return { choice: 0, speech: '' };
    // Eight seats can need 418 calls for five fully discussed forced missions and their debrief.
    const requestLimit = this.players.length === 8 ? 450 : 400;
    if (++this.calls > requestLimit) throw new AiPause('The request limit for this match has been reached.');
    const agent = BOT_AGENTS.find((p) => p.id === id);
    if (!agent) throw new AiTechnicalPause('Unknown AI agent profile.');
    const state = this.stateFor(id);
    const request: BotRequest = {
      language: this.language,
      playerID: id,
      name: this.label(id),
      style: agent.style,
      task,
      speak,
      state,
      choices: choices.map((c) => c.text),
      privateCheck,
      councilDiscussion,
      publicDiscussion,
      optionalSpeech,
      rolesKnownBeforeReveal: state.stage === 'end' ? this.rolesKnownBeforeReveal.get(id) : undefined,
      // The room archives every public clue; all Evil revisit it before assassination.
      // Bound transcript size under the existing request and spending limits.
      evilEvidence:
        state.stage === 'assassinate'
          ? this.chat.history
              .filter((m) => this.players.includes(m.userID) && !isVoteOnly(m.message) && !isAfterGameSpeech(m.message))
              .slice(0, 350)
              .map((m) => ({ id: m.id, name: this.label(m.userID), text: m.message }))
          : undefined,
      evilCouncil: ['assassinate', 'end'].includes(state.stage) ? structuredClone(this.evilCouncil) : undefined,
      chat: this.chat.history
        .filter((m) => this.players.includes(m.userID))
        .filter((m) => !isAfterGameSpeech(m.message))
        .slice(0)
        .map((m) => ({ id: m.id, name: this.label(m.userID), text: m.message })),
    };
    if (state.stage !== 'end') {
      this.rolesKnownBeforeReveal.set(
        id,
        state.players.map((p) => [p.index, p.role]),
      );
    }
    // Only Evil needs a model call for the secret mission card: never expose its identity.
    const secretMission = state.stage === 'onMission' && Boolean(this.ai!.humanPlayerID);
    if (state.stage !== 'onMission') this.ai!.thinkingPlayerID = id;
    this.ai!.message = this.ai!.humanPlayerID
      ? aiText(this.language).thinking
      : state.stage === 'onMission'
        ? 'Collecting secret mission cards.'
        : `${agent.name}: ${task}`;
    if (!secretMission) this.updateRoomState(true);
    let answer: BotReply;
    try {
      answer = await this.decide(request, this.abort.signal);
      if (
        !Number.isInteger(answer.choice) ||
        !choices[answer.choice] ||
        typeof answer.speech !== 'string' ||
        answer.speech.length > (state.stage === 'end' ? 800 : 500)
      )
        throw Error('Invalid decision');
      this.failures = 0;
    } catch (error) {
      if (this.cancelled) return null;
      if (error instanceof AiPause) throw error;
      this.ai!.fallbacks += 1;
      if (++this.failures >= 3) throw new AiPause('Three consecutive model errors. Match paused.');
      answer = { choice: 0, speech: '' };
      this.ai!.message = 'Model error: a legal fallback action was used.';
    } finally {
      delete this.ai!.thinkingPlayerID;
      if (!secretMission) this.updateRoomState(true);
    }
    if (this.cancelled || this.manager.game.stage !== state.stage) return null;
    // Retain completed decisions before publication/checkpoints can pause the match.
    if (this.discussion) {
      if (publicDiscussion) this.discussion.spoken.add(id);
      if (optionalSpeech) this.discussion.finalTeam = choices[answer.choice];
      if (state.stage === 'votingForTeam') {
        this.discussion.votes.set(id, answer.choice === 0 ? 'approve' : 'reject');
      }
    }
    if (answer.privateReason?.trim()) {
      const previous = this.spectatorDecisions.findIndex((decision) => decision.playerID === id);
      if (previous >= 0) this.spectatorDecisions.splice(previous, 1);
      this.spectatorDecisions.unshift({
        playerID: id,
        id: ++this.decisionSequence,
        seat: this.label(id),
        mission: (state.mission ?? 0) + 1,
        stage: publicDiscussion ? 'discussion' : state.stage,
        choice: choices[answer.choice].text,
        reason: answer.privateReason.trim().slice(0, 240),
      });
    }
    if (councilDiscussion) {
      this.evilCouncil.push({
        seat: this.label(id),
        target: choices[answer.choice].text,
        reason: answer.speech.trim(),
      });
      this.councilSpoken.add(id);
      this.councilPending = {
        id,
        text: aiText(this.language).council(choices[answer.choice].text, answer.speech.trim()),
        requestID: randomUUID(),
      };
      await this.publishCouncil();
      return answer;
    }
    if (speak && answer.speech.trim()) {
      let speech = answer.speech.trim().replace(/\bplayers?\s*#?([1-8])\b/gi, '$1');
      if (task.startsWith('Choose the final team')) {
        speech = `${aiText(this.language).proposal(choices[answer.choice].text)} ${speech}`;
      }
      await this.publish(id, `${state.stage === 'end' ? aiText(this.language).postGamePrefix : ''}${speech}`);
    } else {
      await this.checkpoint(this.calculateRoomState());
    }
    return this.cancelled ? null : answer;
  }
  private async publish(id: string, text: string, requestID: string = randomUUID()) {
    if (this.cancelled) return;
    const discussion = this.discussion;
    if (discussion) discussion.pendingPublication = { id, text, requestID };
    if (this.persistChatMessage) await this.persistChatMessage(id, text, requestID);
    else this.addMessage(id, text, requestID);
    // Insertion succeeded; a later checkpoint pause must not duplicate this message.
    if (discussion) delete discussion.pendingPublication;
    await this.checkpoint(this.calculateRoomState());
    if (!this.delayMs || this.cancelled) return;
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.abort.signal.removeEventListener('abort', done);
        resolve();
      };
      const timer = setTimeout(done, this.delayMs);
      this.abort.signal.addEventListener('abort', done, { once: true });
    });
  }
  private apply(id: string, choice: Choice) {
    if (this.cancelled) return;
    for (const action of choice.actions) this.manager.callGameMethods(id, action);
  }

  private clockwiseSeats() {
    const seats = [...this.manager.game.players].sort((a, b) => a.index - b.index).map((player) => player.userID);
    const offset = seats.indexOf(this.manager.game.leader.userID);
    return [...seats.slice(offset), ...seats.slice(0, offset)];
  }

  private async discussTeam() {
    const id = this.manager.game.leader.userID;
    this.discussion ??= { spoken: new Set(), votes: new Map() };
    if (this.ai!.humanPlayerID) {
      this.ai!.discussionPending = true;
      this.updateRoomState(true);
    }
    const pending = this.discussion.pendingPublication;
    if (pending) {
      await this.publish(pending.id, pending.text, pending.requestID);
      if (this.cancelled) return;
    }
    for (const player of this.clockwiseSeats()) {
      if (this.cancelled || this.manager.game.stage !== 'selectTeam') return;
      if (this.discussion.spoken.has(player)) continue;
      if (player === this.ai!.humanPlayerID) {
        await this.waitForHuman(() => !this.discussion?.spoken.has(player), true);
        if (this.cancelled) return;
        continue;
      }
      const answer = await this.ask(
        player,
        'Discuss the next team before the leader chooses: recommend a legal roster, assess trust and known history, or ask a question. This is advice; do not cast or announce a binding vote.',
        this.teams(player),
        true,
        undefined,
        false,
        true,
      );
      if (!answer) return;
    }
    delete this.ai!.discussionPending;
    this.updateRoomState(true);
    if (id === this.ai!.humanPlayerID) {
      await this.waitForHuman(() => this.manager.game.stage === 'selectTeam');
      this.discussion = undefined;
      return;
    }
    if (!this.discussion.finalTeam) {
      const proposal = await this.ask(
        id,
        'Choose the final team after hearing the full public circle. You may briefly announce your final roster or remain silent.',
        this.teams(id),
        true,
        undefined,
        false,
        false,
        true,
      );
      if (!proposal) return;
    }
    this.apply(id, this.discussion.finalTeam!);
    this.manager.callGameMethods(id, { method: 'sentSelectedPlayers' });
    if (this.manager.game.stage !== 'votingForTeam') this.discussion = undefined;
  }

  private async voteForTeam() {
    this.discussion ??= { spoken: new Set(), votes: new Map() };
    const votes = this.discussion.votes;
    const choices = ['approve', 'reject'].map((text) => ({ text, actions: [] }));
    for (const player of this.clockwiseSeats()) {
      if (player === this.ai!.humanPlayerID) continue;
      if (!this.manager.game.players.find((p) => p.userID === player)!.features.waitForAction) continue;
      if (votes.has(player)) continue;
      const answer = await this.ask(
        player,
        'Vote on the proposed team silently; choose approve or reject.',
        choices,
        false,
      );
      if (!answer) return;
    }
    // Keep every decision private until all bots have seen the same voting state.
    for (const [player, option] of votes) {
      if (this.cancelled || this.manager.game.stage !== 'votingForTeam') return;
      if (!this.manager.game.players.find((p) => p.userID === player)!.features.waitForAction) continue;
      this.manager.callGameMethods(player, { method: 'voteForMission', option });
    }
    this.discussion = undefined;
    await this.waitForHuman(() => this.manager.game.stage === 'votingForTeam');
  }

  private async publishCouncil() {
    const pending = this.councilPending;
    if (!pending || this.cancelled) return;
    await this.publish(pending.id, pending.text, pending.requestID);
    if (!this.cancelled) this.councilPending = undefined;
  }

  private async discussAssassination() {
    const game = this.manager.game;
    this.ai!.discussionPending = true;
    this.updateRoomState(true);
    await this.publishCouncil();
    for (const ally of game.players.filter((p) => p.role.loyalty === 'evil')) {
      if (this.cancelled || game.stage !== 'assassinate') return;
      if (this.councilSpoken.has(ally.userID)) continue;
      if (ally.userID === this.ai!.humanPlayerID) {
        await this.waitForHuman(() => game.stage === 'assassinate' && !this.councilSpoken.has(ally.userID), true);
        continue;
      }
      const state = this.stateFor(ally.userID);
      const choices = state.players
        .filter((p) => !['evil', 'mordred', 'morgana', 'minion', 'oberon'].includes(p.role))
        .map((p) => ({ text: this.label(p.id), actions: [] }));
      const suggestion = await this.ask(
        ally.userID,
        'Evil council: discuss whom to assassinate in the public room chat, cite the strongest clue and compare an alternative. Respond to earlier teammates, including the human. This is advice, not the final shot.',
        choices,
        true,
        undefined,
        true,
      );
      if (!suggestion) return;
    }
    delete this.ai!.discussionPending;
    this.updateRoomState(true);
  }

  private async act() {
    const game = this.manager.game;
    if (game.stage === 'selectTeam') return this.discussTeam();
    if (game.stage === 'votingForTeam') return this.voteForTeam();
    if (game.stage === 'assassinate') {
      await this.discussAssassination();
      if (this.cancelled || game.stage !== 'assassinate') return;
    }
    const batchMission = game.stage === 'onMission' && Boolean(this.ai!.humanPlayerID);
    const actor = game.players.find(
      (p) =>
        p.features.waitForAction &&
        p.userID !== this.ai!.humanPlayerID &&
        !(batchMission && this.missionChoices.has(p.userID)),
    );
    if (!actor && batchMission && this.missionChoices.size) {
      // Submit together so immediate Good cards and generated Evil cards have no visible timing difference.
      const choices = this.missionChoices;
      this.missionChoices = new Map();
      for (const [id, choice] of choices) this.apply(id, choice);
      return;
    }
    if (!actor && this.ai!.humanPlayerID) {
      const stage = game.stage;
      return this.waitForHuman(() => game.stage === stage && game.players.some((p) => p.features.waitForAction));
    }
    if (!actor) throw new AiPause('No player is available for the next action.');
    const id = actor.userID;
    const state = this.stateFor(id);
    const own = state.players.find((p) => p.id === id)!;
    let choices: Choice[];
    let task: string;
    let privateCheck: string | undefined;
    let speak = false;
    switch (state.stage) {
      case 'onMission':
        task = 'Secretly choose your mission action';
        choices = (own.validMissionsResult || []).map((result) => ({
          text: result,
          actions: [{ method: 'actionOnMission', result }],
        }));
        break;
      case 'checkLoyalty':
        speak = true;
        task =
          'Choose whom to inspect with the Lady of the Lake and explain publicly what question this check will resolve. Do not announce a result before inspecting.';
        choices = state.players
          .filter((p) => p.id !== id && !p.features.ladyOfLake)
          .map((p) => ({
            text: this.label(p.id),
            actions: [...this.select([p.id]), { method: 'checkLoyalty' }],
          }));
        break;
      case 'announceLoyalty':
        task = ['mordred', 'morgana', 'minion', 'oberon'].includes(own.role)
          ? 'Announce the Lady result; choose truth or a strategic lie for Evil'
          : 'Announce privateKnowledge.inspectionResult truthfully by default. Lady explains your knowledge without revealing your role. Do not reverse the result merely to hide Merlin.';
        privateCheck = this.manager.getGameData(id, { method: 'getLoyalty' });
        // Chat is generated from this same choice after applying the announcement.
        choices = ['good', 'evil'].map((loyalty) => ({
          text: loyalty,
          actions: [{ method: 'announceLoyalty', loyalty: loyalty as 'good' | 'evil' }],
        }));
        break;
      case 'assassinate':
        task =
          'Choose the player you believe is Merlin after reviewing ALL teammates in evilCouncil and the early public clues in evilEvidence';
        choices = state.players
          .filter((p) => !['evil', 'mordred', 'morgana', 'minion', 'oberon'].includes(p.role))
          .map((p) => ({
            text: this.label(p.id),
            actions: [...this.select([p.id]), { method: 'assassinate', type: 'merlin' }],
          }));
        break;
      default:
        throw new AiPause('Unsupported game stage.');
    }
    if (!choices.length) throw new AiPause('No legal actions available.');
    const result = await this.ask(id, task, choices, speak, privateCheck);
    if (result) {
      if (batchMission) {
        this.missionChoices.set(id, choices[result.choice]);
        return;
      }
      const inspected = state.players.find((p) => p.features.isSelected);
      this.apply(id, choices[result.choice]);
      if (state.stage === 'announceLoyalty' && inspected) {
        await this.publish(id, aiText(this.language).inspection(this.label(inspected.id), result.choice === 0));
        // Public Good-persona stance for either side; never changes private alignment knowledge.
        if (inspected.id !== this.ai!.humanPlayerID)
          await this.publish(
            inspected.id,
            aiText(this.language).inspectionResponse(this.label(id), result.choice === 0),
          );
      }
    }
  }

  async run(resumeBudget = false, resumeTechnical = false) {
    if (
      this.executing ||
      (resumeBudget || resumeTechnical
        ? this.ai!.status !== 'paused' || !(resumeBudget ? this.ai!.canResumeBudget : this.ai!.canResumeTechnical)
        : this.ai!.status !== 'ready')
    )
      return;
    this.executing = true;
    this.ai!.canResumeBudget = false;
    this.ai!.canResumeTechnical = false;
    this.budgetResumeUnits = 0;
    this.ai!.status = 'running';
    try {
      if (!resumeBudget && !resumeTechnical) super.startGame();
      while (!this.cancelled && this.manager.game.stage !== 'end') {
        await this.act();
        await this.checkpoint(this.calculateRoomState());
      }
      if (!this.cancelled) {
        for (const id of this.players) {
          if (id === this.ai!.humanPlayerID) continue;
          if (this.cancelled) break;
          if (this.reviewedPlayers.has(id)) continue;
          await this.ask(
            id,
            'Post-game conclusion: explain why YOUR side won or lost using specific mission/vote events, your own mistake or contribution, and one lesson. All roles are now public. Do not invent events.',
            [{ text: 'Write your conclusion', actions: [] }],
            true,
          );
          this.reviewedPlayers.add(id);
        }
      }
      if (!this.cancelled) {
        this.ai!.status = 'finished';
        this.ai!.message = 'Match complete. Roles revealed and discussion saved.';
      }
    } catch (error) {
      if (this.cancelled) return;
      this.ai!.canResumeBudget = error instanceof AiMatchBudgetPause;
      this.ai!.canResumeTechnical = error instanceof AiTechnicalPause;
      this.budgetResumeUnits = error instanceof AiMatchBudgetPause ? error.reserveUnits : 0;
      this.ai!.status = 'paused';
      this.ai!.message =
        error instanceof AiPause ? error.message : 'Match paused due to an error. No further requests will be made.';
    } finally {
      this.updateRoomState(true);
      try {
        await this.checkpoint(this.calculateRoomState());
      } finally {
        this.executing = false;
      }
    }
  }
}
