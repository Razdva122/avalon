import { randomUUID } from 'crypto';
import shuffle from 'lodash/shuffle';
import { aiHumanRoles, type AiHumanRole } from '@avalon/types';
import { Room } from '@/room';
import { AI_PROFILE_RATING_SEASON } from './rating-season';
import type { AiLanguage, AiPlayerCount, GameOptions, Server, TRoomState, AiSpectatorDecision } from '@avalon/types';
import type { TGameMethodsParams } from '@/core/game-manager';
import { AiPause, AiTechnicalPause, type Decide, type BotRequest, type BotReply } from './client';
import { aiText, isAfterGameSpeech, isVoteOnly } from './language';

import { BOT_AGENTS, selectBotAgents, getBotProfile } from './agents';
export { BOT_PROFILES } from './agents';
export const botOptions: GameOptions = {
  roles: { merlin: 1, percival: 1, mordred: 1, morgana: 1, oberon: 1 },
  addons: { ladyOfLake: true },
  features: { wtfMode: false, displayIndex: true },
};

type Choice = { text: string; actions: TGameMethodsParams[] };
type Publication = { id: string; text: string; requestID: string };
const humanTimeoutMessage: Record<AiLanguage, string> = {
  es: 'Partida terminada: se agotaron el tiempo de acción y la reserva compartida.',
  vi: 'Ván chơi đã kết thúc: thời gian hành động và thời gian dự phòng chung đã hết.',
  en: 'Match stopped: the turn time and shared time reserve have run out.',
  ru: 'Партия завершена: время на ход и общий запас исчерпаны.',
  'zh-tw': '對局已結束：行動時間與共用備用時間已用盡。',
};
function combinations(ids: string[], count: number): string[][] {
  if (count === 0) return [[]];
  return ids.flatMap((id, i) => combinations(ids.slice(i + 1), count - 1).map((tail) => [id, ...tail]));
}

export class BotRoom extends Room {
  renewLease?: () => Promise<void>;
  resolvePlayerName?: (id: string) => Promise<string | undefined>;
  readonly spectatorDecisions: AiSpectatorDecision[] = [];
  private selectedHumanRole?: AiHumanRole;
  private decisionSequence = 0;
  private cancelled = false;
  private executing = false;
  private wakeHuman?: () => void;
  private friendActionTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private humanActionTimer?: ReturnType<typeof setTimeout>;
  private discussionMessages?: { since: number; existing: Set<string | undefined> };
  private missionChoices = new Map<string, Choice>();
  private directAction?: { id: string; choice: Choice; applied: boolean; before: Publication[]; after: Publication[] };
  private discussion?: {
    spoken: Set<string>;
    finalTeam?: Choice;
    votes: Map<string, 'approve' | 'reject'>;
    pendingPublication?: { id: string; text: string; requestID: string };
  };
  private councilSpoken = new Set<string>();
  private councilPending?: { id: string; text: string; requestID: string };
  private thinkingPlayers = new Set<string>();
  private abort = new AbortController();
  private failures = 0;
  private calls = 0;
  private evilCouncil: { seat: string; target: string; reason: string }[] = [];
  constructor(
    id: string,
    owner: string,
    io: Server,
    private decide: Decide,
    private checkpoint: (state: TRoomState) => Promise<void> = async () => {},
    private delayMs = 0,
    private language: AiLanguage = 'en',
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
    this.checkpoint = async (state) => {
      try {
        await checkpoint(state);
      } catch (error) {
        if (error instanceof AiPause) throw error;
        throw new AiTechnicalPause('Could not save AI room progress. Retry to continue.');
      }
    };
    this.onChatMessage = (entry) => {
      if (
        entry.kind !== 'sticker' &&
        this.isHuman(entry.userID) &&
        this.ai!.status === 'running' &&
        this.ai!.waitingForDiscussion &&
        entry.userID === (this.ai!.discussionPlayerID ?? this.ai!.humanPlayerID) &&
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
      fallbacks: 0,
      message: aiText(language).ready,
    };
  }
  override joinGame(userID: string): void {
    if (
      !this.ai?.publicBotGame ||
      !this.ai.withFriend ||
      this.ai.status !== 'ready' ||
      this.data.stage !== 'locked' ||
      (this.ai.launchExpiresAt !== undefined && Date.now() >= this.ai.launchExpiresAt)
    )
      throw Error('AI room has fixed seats');
    if (this.isHuman(userID)) return;
    if (this.humanIDs.length >= (this.ai.humanSeats ?? 2)) throw Error('The friend seat is occupied');
    this.players[this.players.length - 1 - this.humanIDs.length] = userID;
    this.ai.humanPlayerIDs = [...this.humanIDs, userID];
    this.updateRoomState(true);
  }

  get humanIDs(): string[] {
    return this.ai?.humanPlayerIDs ?? (this.ai?.humanPlayerID ? [this.ai.humanPlayerID] : []);
  }

  isHuman(userID: string): boolean {
    return this.humanIDs.includes(userID);
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
    if (this.ai!.withFriend) this.ai!.humanPlayerIDs = [userID];
    delete this.ai!.profileRatingSeason;
  }

  setHumanRole(role: AiHumanRole): void {
    if (
      this.ai!.status !== 'ready' ||
      !this.ai!.humanPlayerID ||
      this.ai!.withFriend ||
      !aiHumanRoles(this.players.length as AiPlayerCount).includes(role)
    )
      throw Error('Selected solo role is unavailable');
    this.selectedHumanRole = role;
  }

  setPlayerCount(playerCount: AiPlayerCount): void {
    if (this.ai!.status !== 'ready' || this.data.stage !== 'locked' || ![5, 6, 7, 8].includes(playerCount))
      throw Error('Table size can only be changed before launch');
    if (this.ai!.withFriend && (this.ai!.humanSeats ?? 2) >= playerCount)
      throw Error('At least one bot seat is required');
    if (this.ai!.beginner && playerCount !== 5) throw Error('Beginner tables require five players');
    if (this.selectedHumanRole && !aiHumanRoles(playerCount).includes(this.selectedHumanRole))
      throw Error('Selected solo role is unavailable at this table size');
    if (this.players.length === playerCount) return;
    this.players = selectBotAgents(undefined, playerCount).map((agent) => agent.id);
    this.humanIDs.forEach((id, index) => {
      this.players[this.players.length - 1 - index] = id;
    });
    this.options = structuredClone(botOptions);
    if (playerCount !== 7) delete this.options.roles.oberon;
    if (playerCount < 7) delete this.options.addons.ladyOfLake;
    this.maxCapacity = playerCount;
    this.ai!.playerCount = playerCount;
  }

  setLanguage(language: AiLanguage): void {
    if (
      this.ai!.status !== 'ready' ||
      this.data.stage !== 'locked' ||
      !['en', 'ru', 'zh-tw', 'es', 'vi'].includes(language)
    )
      throw Error('Discussion language can only be changed before launch');
    this.language = language;
    this.ai!.language = language;
    this.ai!.message = aiText(language).ready;
  }

  private checkHumanDeadline(userID: string): void {
    const timer = this.ai!.humanTimers?.[userID];
    if (timer?.humanActionExpiresAt !== undefined && timer.humanActionExpiresAt <= Date.now()) {
      this.stop(humanTimeoutMessage[this.language]);
      throw Error('Human action timed out');
    }
    if (this.ai!.withFriend) return;
    if (this.ai!.humanActionExpiresAt !== undefined && this.ai!.humanActionExpiresAt <= Date.now()) {
      if (this.ai!.waitingForDiscussion) this.completeDiscussion(this.ai!.humanPlayerID!);
      else this.stop(humanTimeoutMessage[this.language]);
      throw Error('Human action timed out');
    }
  }

  private clearFriendActionTimer(userID: string): void {
    clearTimeout(this.friendActionTimers.get(userID));
    this.friendActionTimers.delete(userID);
    const timer = this.ai!.humanTimers?.[userID];
    if (!timer) return;
    if (timer.humanActionBaseExpiresAt !== undefined)
      timer.humanTimeBankMs = Math.max(
        0,
        timer.humanTimeBankMs - Math.max(0, Date.now() - timer.humanActionBaseExpiresAt),
      );
    delete timer.humanActionBaseExpiresAt;
    delete timer.humanActionExpiresAt;
  }

  private clearHumanActionTimer(): void {
    for (const id of this.friendActionTimers.keys()) this.clearFriendActionTimer(id);
    clearTimeout(this.humanActionTimer);
    this.humanActionTimer = undefined;
    const base = this.ai!.humanActionBaseExpiresAt;
    if (base !== undefined)
      this.ai!.humanTimeBankMs = Math.max(0, (this.ai!.humanTimeBankMs || 0) - Math.max(0, Date.now() - base));
    delete this.ai!.humanActionBaseExpiresAt;
    delete this.ai!.humanActionExpiresAt;
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
    if (!this.isHuman(userID) || this.ai!.status !== 'running') throw Error('AI players are controlled by the server');
    this.checkHumanDeadline(userID);
    if (
      (params.method === 'sentSelectedPlayers' && this.ai!.discussionPending) ||
      (params.method === 'assassinate' && !this.councilComplete())
    )
      throw Error('Wait until the public discussion finishes');
    this.manager.callGameMethods(userID, params);
    if (params.method === 'sentSelectedPlayers' && this.manager.game.stage !== 'selectTeam')
      this.discussion = undefined;
    if (this.ai!.withFriend && !this.humanActionPending(userID)) this.clearFriendActionTimer(userID);
    this.wakeHuman?.();
    this.updateRoomState(true);
  }

  finishDiscussion(userID: string): void {
    if (
      !this.isHuman(userID) ||
      this.ai!.status !== 'running' ||
      !this.ai!.waitingForDiscussion ||
      userID !== (this.ai!.discussionPlayerID ?? this.ai!.humanPlayerID)
    )
      throw Error('Not your discussion turn');
    this.checkHumanDeadline(userID);
    this.completeDiscussion(userID);
  }

  private completeDiscussion(userID: string): void {
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

  private humanActionPending(userID: string): boolean {
    const game = this.manager.game;
    return game.stage === 'selectTeam'
      ? game.leader.userID === userID
      : game.stage !== 'end' && Boolean(game.players.find((p) => p.userID === userID)?.features.waitForAction);
  }

  private async waitForHuman(pending: () => boolean, discussion = false, discussionPlayerID?: string) {
    if (this.cancelled || !pending()) return;
    this.ai!.waitingForHuman = true;
    if (discussion) {
      this.discussionMessages = { since: Date.now(), existing: new Set(this.chat.history.map((entry) => entry.id)) };
      this.ai!.waitingForDiscussion = true;
      if (this.ai!.withFriend) this.ai!.discussionPlayerID = discussionPlayerID;
    }
    if (this.ai!.publicBotGame && this.ai!.withFriend) {
      const ids = discussion ? [discussionPlayerID!] : this.humanIDs.filter((id) => this.humanActionPending(id));
      for (const id of ids) {
        const timer = this.ai!.humanTimers![id];
        const duration = 90000 + timer.humanTimeBankMs;
        timer.humanActionBaseExpiresAt = Date.now() + 90000;
        timer.humanActionExpiresAt = Date.now() + duration;
        this.friendActionTimers.set(
          id,
          setTimeout(() => {
            if (!this.cancelled && pending()) this.stop(humanTimeoutMessage[this.language]);
          }, duration),
        );
      }
    } else if (this.ai!.publicBotGame) {
      const base = Date.now() + 90000;
      this.ai!.humanActionBaseExpiresAt = base;
      const duration = 90000 + (this.ai!.humanTimeBankMs || 0);
      this.ai!.humanActionExpiresAt = Date.now() + duration;
      this.humanActionTimer = setTimeout(() => {
        if (!this.cancelled && pending()) {
          if (discussion) this.completeDiscussion(this.ai!.humanPlayerID!);
          else this.stop(humanTimeoutMessage[this.language]);
        }
      }, duration);
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
            this.clearHumanActionTimer();
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
      this.clearHumanActionTimer();
      this.wakeHuman = undefined;
      delete this.ai!.waitingForHuman;
      delete this.ai!.waitingForDiscussion;
      delete this.ai!.discussionPlayerID;
      this.discussionMessages = undefined;
      this.updateRoomState(true);
    }
  }
  override leaveGame(userID: string): void {
    if (!this.ai?.withFriend || !this.isHuman(userID) || userID === this.leaderID || this.ai.status !== 'ready')
      throw Error('AI room has fixed seats');
    this.ai.humanPlayerIDs = this.humanIDs.filter((id) => id !== userID);
    this.players = selectBotAgents(undefined, this.ai.playerCount!).map((agent) => agent.id);
    this.humanIDs.forEach((id, index) => {
      this.players[this.players.length - 1 - index] = id;
    });
    this.updateRoomState(true);
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

  stop(message = 'Match stopped.') {
    this.cancelled = true;
    this.wakeHuman?.();
    this.clearHumanActionTimer();
    delete this.ai!.waitingForHuman;
    delete this.ai!.waitingForDiscussion;
    delete this.ai!.discussionPlayerID;
    delete this.ai!.discussionPending;
    this.thinkingPlayers.clear();
    delete this.ai!.thinkingPlayerID;
    delete this.ai!.thinkingPlayerIDs;
    this.abort.abort();
    this.ai!.status = 'stopped';
    this.ai!.canResumeTechnical = false;
    this.ai!.message = message;
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
    options: { signal?: AbortSignal } = {},
  ): Promise<BotReply | null> {
    const signal = options.signal || this.abort.signal;
    if (this.cancelled || signal.aborted) return null;
    if (!speak && choices.length === 1) return { choice: 0, speech: '' };
    // Eight seats can need 410 calls for five fully discussed forced missions.
    const requestLimit = this.players.length === 8 ? 450 : 400;
    if (++this.calls > requestLimit) throw new AiPause('The request limit for this match has been reached.');
    const agent = BOT_AGENTS.find((p) => p.id === id);
    if (!agent) throw new AiTechnicalPause('Unknown AI agent profile.');
    const state = this.stateFor(id);
    const request: BotRequest = {
      playerNames: await Promise.all(
        state.players.map(async (player) => ({
          seat: player.index,
          name:
            getBotProfile(player.id)?.name ??
            (await this.resolvePlayerName?.(player.id).catch(() => undefined)) ??
            `${player.index}`,
        })),
      ),
      readAllChat: true,
      language: this.language,
      playerID: id,
      humanPlayerID: this.ai!.humanPlayerID,
      humanPlayerIDs: this.ai!.humanPlayerIDs,
      beginner: this.ai!.beginner,
      botDifficulty: this.ai!.botDifficulty,
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
      // The room archives every public clue; all Evil revisit it before assassination.
      // Bound transcript size under the existing request and spending limits.
      evilEvidence:
        state.stage === 'assassinate'
          ? this.chat.history
              .filter((m) => this.players.includes(m.userID) && !isVoteOnly(m.message) && !isAfterGameSpeech(m.message))
              .slice(0, 350)
              .map((m) => ({ id: m.id, name: this.label(m.userID), text: m.message }))
          : undefined,
      evilCouncil: state.stage === 'assassinate' ? structuredClone(this.evilCouncil) : undefined,
      chat: this.chat.history
        .filter((m) => this.players.includes(m.userID))
        .filter((m) => !isAfterGameSpeech(m.message))
        .slice(0)
        .map((m) => ({ id: m.id, name: this.label(m.userID), text: m.message })),
    };
    if (this.cancelled || signal.aborted) return null;
    // Only Evil needs a model call for the secret mission card: never expose its identity.
    const secretMission = state.stage === 'onMission' && Boolean(this.ai!.humanPlayerID);
    if (state.stage !== 'onMission') {
      this.thinkingPlayers.add(id);
      this.updateThinkingPlayers();
    }
    this.ai!.message = this.ai!.humanPlayerID
      ? aiText(this.language).thinking
      : state.stage === 'onMission'
        ? 'Collecting secret mission cards.'
        : `${agent.name}: ${task}`;
    if (!secretMission) this.updateRoomState(true);
    let answer: BotReply;
    try {
      answer = await this.decide(request, signal);
      if (this.cancelled || signal.aborted) return null;
      if (
        !Number.isInteger(answer.choice) ||
        !choices[answer.choice] ||
        typeof answer.speech !== 'string' ||
        answer.speech.length > 500
      )
        throw Error('Invalid decision');
      this.failures = 0;
    } catch (error) {
      if (this.cancelled || signal.aborted) return null;
      if (error instanceof AiPause) throw error;
      this.ai!.fallbacks += 1;
      if (++this.failures >= 3) throw new AiPause('Three consecutive model errors. Match paused.');
      answer = { choice: 0, speech: '' };
      this.ai!.message = 'Model error: a legal fallback action was used.';
    } finally {
      this.thinkingPlayers.delete(id);
      this.updateThinkingPlayers();
      if (!secretMission) this.updateRoomState(true);
    }
    if (this.cancelled || this.manager.game.stage !== state.stage) return null;
    // Retain completed decisions before publication/checkpoints can pause the match.
    if (this.discussion) {
      if (publicDiscussion) this.discussion.spoken.add(id);
      if (state.stage === 'selectTeam' && !publicDiscussion) this.discussion.finalTeam = choices[answer.choice];
      if (state.stage === 'votingForTeam') {
        this.discussion.votes.set(id, answer.choice === 0 ? 'approve' : 'reject');
      }
    }
    if (state.stage === 'onMission') this.missionChoices.set(id, choices[answer.choice]);
    if (!councilDiscussion && ['checkLoyalty', 'announceLoyalty', 'assassinate'].includes(state.stage)) {
      const inspected = state.players.find((player) => player.features.isSelected);
      const after: Publication[] = [];
      if (state.stage === 'announceLoyalty' && inspected) {
        after.push({
          id,
          text: aiText(this.language).inspection(this.label(inspected.id), answer.choice === 0),
          requestID: randomUUID(),
        });
        if (!this.isHuman(inspected.id))
          after.push({
            id: inspected.id,
            text: aiText(this.language).inspectionResponse(this.label(id), answer.choice === 0),
            requestID: randomUUID(),
          });
      }
      this.directAction = { id, choice: choices[answer.choice], applied: false, before: [], after };
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
      if (this.directAction) {
        this.directAction.before.push({ id, text: speech, requestID: randomUUID() });
        await this.publishDirectQueue(this.directAction.before);
      } else await this.publish(id, speech);
    } else {
      await this.checkpoint(this.calculateRoomState());
    }
    return this.cancelled ? null : answer;
  }
  private async publish(id: string, text: string, requestID: string = randomUUID()) {
    if (this.cancelled) return;
    const discussion = this.discussion;
    if (discussion) discussion.pendingPublication = { id, text, requestID };
    if (this.persistChatMessage) {
      try {
        await this.persistChatMessage(id, text, requestID);
      } catch (error) {
        if (error instanceof AiPause) throw error;
        throw new AiTechnicalPause('Could not save AI chat message. Retry to continue.');
      }
    } else this.addMessage(id, text, requestID);
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
  private updateThinkingPlayers() {
    const ids = [...this.thinkingPlayers];
    if (ids.length) {
      this.ai!.thinkingPlayerIDs = ids;
      this.ai!.thinkingPlayerID = ids[0];
    } else {
      delete this.ai!.thinkingPlayerIDs;
      delete this.ai!.thinkingPlayerID;
    }
  }

  private async inPairs(ids: string[], task: (id: string, signal: AbortSignal) => Promise<unknown>) {
    for (let offset = 0; offset < ids.length && !this.cancelled; offset += 2) {
      const controller = new AbortController();
      const cancel = () => controller.abort();
      this.abort.signal.addEventListener('abort', cancel, { once: true });
      try {
        const results = await Promise.allSettled(
          ids.slice(offset, offset + 2).map(async (id) => {
            try {
              return await task(id, controller.signal);
            } catch (error) {
              controller.abort();
              throw error;
            }
          }),
        );
        const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
        if (failed) throw failed.reason;
      } finally {
        this.abort.signal.removeEventListener('abort', cancel);
      }
    }
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
    const firstProposal = this.manager.game.turn === 0;
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
    const speakers = firstProposal ? this.clockwiseSeats() : this.isHuman(id) ? [id] : [];
    for (const player of speakers) {
      if (this.cancelled || this.manager.game.stage !== 'selectTeam') return;
      if (this.discussion.spoken.has(player)) continue;
      if (this.isHuman(player)) {
        // The leader can speak voluntarily while others discuss, then submit the team silently.
        if (player === id) {
          this.discussion.spoken.add(player);
          continue;
        }
        await this.waitForHuman(() => !this.discussion?.spoken.has(player), true, player);
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
    if (this.isHuman(id)) {
      await this.waitForHuman(() => this.manager.game.stage === 'selectTeam');
      this.discussion = undefined;
      return;
    }
    if (!this.discussion.finalTeam) {
      const proposal = await this.ask(
        id,
        firstProposal
          ? 'Choose the final team after hearing the full public circle. You may briefly announce your final roster or remain silent.'
          : 'Choose the final team as the only speaker on this repeat proposal. Address another seat directly and explain why you selected this exact roster, using the earlier discussion and recorded votes. Publish this explanation now; no other player has a reply turn before selection.',
        this.teams(id),
        true,
        undefined,
        false,
        false,
        firstProposal,
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
    const pending = this.clockwiseSeats().filter(
      (player) =>
        !this.isHuman(player) &&
        this.manager.game.players.find((p) => p.userID === player)!.features.waitForAction &&
        !votes.has(player),
    );
    await this.inPairs(pending, (player, signal) =>
      this.ask(
        player,
        'Vote on the proposed team silently; choose approve or reject.',
        choices,
        false,
        undefined,
        false,
        false,
        false,
        { signal },
      ),
    );
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
      if (this.isHuman(ally.userID)) {
        // The assassin's board action needs no separate speaking/pass step.
        if (ally.features.isAssassin) {
          this.councilSpoken.add(ally.userID);
          continue;
        }
        await this.waitForHuman(
          () => game.stage === 'assassinate' && !this.councilSpoken.has(ally.userID),
          true,
          ally.userID,
        );
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

  private async collectMissionCards() {
    const game = this.manager.game;
    const pending = game.players.filter(
      (p) => p.features.waitForAction && !this.isHuman(p.userID) && !this.missionChoices.has(p.userID),
    );
    const generated = new Map<string, Choice[]>();
    for (const player of pending) {
      const id = player.userID;
      const own = this.stateFor(id).players.find((p) => p.id === id)!;
      const choices: Choice[] = (own.validMissionsResult || []).map((result) => ({
        text: result,
        actions: [{ method: 'actionOnMission', result }],
      }));
      if (!choices.length) throw new AiPause('No legal actions available.');
      if (choices.length === 1) this.missionChoices.set(id, choices[0]);
      else generated.set(id, choices);
    }
    await this.inPairs([...generated.keys()], (id, signal) =>
      this.ask(id, 'Secretly choose your mission action', generated.get(id)!, false, undefined, false, false, false, {
        signal,
      }),
    );
    if (this.cancelled || game.stage !== 'onMission') return;
    for (const [id, choice] of this.missionChoices) {
      this.apply(id, choice);
      this.missionChoices.delete(id);
    }
    await this.waitForHuman(() => game.stage === 'onMission');
  }

  private async act() {
    if (this.directAction) return this.completeDirectAction();
    const game = this.manager.game;
    if (game.stage === 'selectTeam') return this.discussTeam();
    if (game.stage === 'votingForTeam') return this.voteForTeam();
    if (game.stage === 'onMission') return this.collectMissionCards();
    if (game.stage === 'assassinate') {
      await this.discussAssassination();
      if (this.cancelled || game.stage !== 'assassinate') return;
    }
    const actor = game.players.find((p) => p.features.waitForAction && !this.isHuman(p.userID));
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
          : 'Good bots must announce privateKnowledge.inspectionResult truthfully, without a protective exception. Lady explains your knowledge without revealing your role.';
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
    if (result) await this.completeDirectAction();
  }

  private async publishDirectQueue(queue: Publication[]) {
    while (queue.length && !this.cancelled) {
      const pending = queue[0];
      await this.publish(pending.id, pending.text, pending.requestID);
      queue.shift();
    }
  }

  private async completeDirectAction() {
    const pending = this.directAction;
    if (!pending || this.cancelled) return;
    await this.publishDirectQueue(pending.before);
    if (this.cancelled) return;
    if (!pending.applied) {
      this.apply(pending.id, pending.choice);
      pending.applied = true;
    }
    await this.publishDirectQueue(pending.after);
    if (!this.cancelled) this.directAction = undefined;
  }

  async run(resumeTechnical = false) {
    if (
      this.executing ||
      (resumeTechnical ? this.ai!.status !== 'paused' || !this.ai!.canResumeTechnical : this.ai!.status !== 'ready')
    )
      return;
    this.executing = true;
    if (this.ai!.publicBotGame && !this.ai!.withFriend && this.ai!.humanTimeBankMs === undefined)
      this.ai!.humanTimeBankMs = 300000;
    if (this.ai!.withFriend) {
      this.ai!.humanTimers ??= {};
      for (const id of this.humanIDs) this.ai!.humanTimers[id] ??= { humanTimeBankMs: 300000 };
    }
    this.ai!.canResumeTechnical = false;
    this.ai!.status = 'running';
    try {
      if (!resumeTechnical) {
        this.players = shuffle(this.players);
        super.startGame(
          this.selectedHumanRole ? { userID: this.ai!.humanPlayerID!, role: this.selectedHumanRole } : undefined,
        );
      }
      while (!this.cancelled && this.manager.game.stage !== 'end') {
        await this.act();
        await this.checkpoint(this.calculateRoomState());
      }
      if (!this.cancelled) {
        this.ai!.status = 'finished';
        this.ai!.message = 'Match complete. Roles revealed and discussion saved.';
      }
    } catch (error) {
      if (this.cancelled) return;
      this.ai!.canResumeTechnical = error instanceof AiTechnicalPause;
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
