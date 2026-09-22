import { Room } from '@/room';
import type { GameOptions, Server, TRoomState, PublicUserProfile } from '@avalon/types';
import type { TGameMethodsParams } from '@/core/game-manager';
import { AiPause, type Decide, type BotRequest, type BotReply } from './client';

export const BOT_PROFILES: PublicUserProfile[] = ['Alice', 'Ben', 'Clara', 'Daniel', 'Emma', 'Felix', 'Grace'].map(
  (name, i) => ({ id: `avalon-ai-${i + 1}`, name: `${name} · AI`, avatar: 'servant' }),
);
const styles = [
  'cautiously check facts',
  'speak directly',
  'ask precise questions',
  'look for contradictions',
  'defend your position calmly',
  'suggest alternatives',
  'speak briefly',
];
export const botOptions: GameOptions = {
  roles: { merlin: 1, percival: 1, mordred: 1, morgana: 1 },
  addons: { ladyOfLake: true },
  features: { wtfMode: false, displayIndex: true },
};

type Choice = { text: string; actions: TGameMethodsParams[] };
function combinations(ids: string[], count: number): string[][] {
  if (count === 0) return [[]];
  return ids.flatMap((id, i) => combinations(ids.slice(i + 1), count - 1).map((tail) => [id, ...tail]));
}

export class BotRoom extends Room {
  private cancelled = false;
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
  ) {
    super(
      id,
      owner,
      BOT_PROFILES.map((p) => p.id),
      io,
      structuredClone(botOptions),
    );
    this.maxCapacity = 7;
    this.data = { stage: 'locked' };
    this.ai = {
      status: 'ready',
      costRub: 0,
      fallbacks: 0,
      message: 'Seven AI players · English discussion · unranked',
    };
  }
  override joinGame(userID: string): void {
    void userID;
    throw Error('AI room has fixed seats');
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
    this.abort.abort();
    this.ai!.status = 'stopped';
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
    privateDiscussion = false,
  ): Promise<BotReply | null> {
    if (this.cancelled) return null;
    if (!speak && choices.length === 1) return { choice: 0, speech: '' };
    if (++this.calls > 350) throw new AiPause('The request limit for this match has been reached.');
    const index = BOT_PROFILES.findIndex((p) => p.id === id);
    const state = this.stateFor(id);
    const request: BotRequest = {
      playerID: id,
      name: this.label(id),
      style: styles[index],
      task,
      speak,
      state,
      choices: choices.map((c) => c.text),
      privateCheck,
      privateDiscussion,
      rolesKnownBeforeReveal: state.stage === 'end' ? this.rolesKnownBeforeReveal.get(id) : undefined,
      // The room archives every public clue; all Evil revisit it before assassination.
      // Bound transcript size under the existing request and spending limits.
      evilEvidence:
        state.stage === 'assassinate'
          ? this.chat.history
              .filter(
                (m) => BOT_PROFILES.some((p) => p.id === m.userID) && !/^I vote (approve|reject)\.$/.test(m.message),
              )
              .slice(0, 350)
              .map((m) => ({ id: m.id, name: this.label(m.userID), text: m.message }))
          : undefined,
      evilCouncil: state.stage === 'assassinate' ? structuredClone(this.evilCouncil) : undefined,
      chat: this.chat.history
        .filter((m) => BOT_PROFILES.some((p) => p.id === m.userID))
        .filter((m) => !m.message.startsWith('Post-game:') && !m.message.startsWith('Evil council (revealed):'))
        .slice(0)
        .map((m) => ({ id: m.id, name: this.label(m.userID), text: m.message })),
    };
    if (state.stage !== 'end') {
      this.rolesKnownBeforeReveal.set(
        id,
        state.players.map((p) => [p.index, p.role]),
      );
    }
    this.ai!.message = `${BOT_PROFILES[index].name}: ${task}`;
    this.updateRoomState(true);
    let answer: BotReply;
    try {
      answer = await this.decide(request, this.abort.signal);
      if (
        !Number.isInteger(answer.choice) ||
        !choices[answer.choice] ||
        typeof answer.speech !== 'string' ||
        answer.speech.length > 500
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
    }
    if (this.cancelled || this.manager.game.stage !== state.stage) return null;
    if (privateDiscussion) {
      this.evilCouncil.push({
        seat: this.label(id),
        target: choices[answer.choice].text,
        reason: answer.speech.trim(),
      });
      return answer;
    }
    if (speak && (answer.speech.trim() || choices.map((c) => c.text).join(',') === 'approve,reject')) {
      let speech = answer.speech.trim().replace(/\bplayers?\s*#?([1-7])\b/gi, '$1');
      if (choices.map((c) => c.text).join(',') === 'approve,reject') {
        // Preserve evidence about earlier votes; discard conflicting current declarations sentence by sentence.
        const selectedVote = choices[answer.choice].text;
        speech = speech
          .split(/(?<=[.!?])\s+/)
          .filter((sentence) => {
            const declaration = sentence.match(
              /\b(?:I|we)\s+(?:(?:will|would|must|should)\s+)?(?:vote\s+)?(approve|reject)\b/i,
            );
            return !declaration || declaration[1].toLowerCase() === selectedVote;
          })
          .map((sentence) =>
            sentence.replace(/^I\s+(?:vote\s+)?(?:approve|reject)(?:\s+this team)?[.!]\s*$/i, '').trim(),
          )
          .filter(Boolean)
          .join(' ');
        speech = `I vote ${choices[answer.choice].text}. ${speech}`.trim();
      } else if (task === 'Propose a team and explain your choice') {
        speech = `I propose ${choices[answer.choice].text}. ${speech}`;
      }
      await this.publish(id, `${state.stage === 'end' ? 'Post-game: ' : ''}${speech}`);
    } else {
      await this.checkpoint(this.calculateRoomState());
    }
    return this.cancelled ? null : answer;
  }
  private async publish(id: string, text: string) {
    if (this.cancelled) return;
    this.addMessage(id, text);
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

  private async discussTeam() {
    const id = this.manager.game.leader.userID;
    const choices = this.teams(id);
    const proposal = await this.ask(id, 'Propose a team and explain your choice', choices, true);
    if (!proposal) return;
    this.apply(id, choices[proposal.choice]);
    const seats = this.players;
    const offset = seats.indexOf(id);
    const order = [...seats.slice(offset + 1), ...seats.slice(0, offset)];
    if (this.manager.game.turn === 4) {
      this.manager.callGameMethods(id, { method: 'sentSelectedPlayers' });
      return;
    }
    // One request per voter returns both public argument and the binding vote.
    // Earlier speakers do not revise their vote in this economical single-circle format.
    const votes = new Map<string, 'approve' | 'reject'>();
    const choicesForVote = ['approve', 'reject'].map((text) => ({ text, actions: [] }));
    for (const player of [...order, id]) {
      const answer = await this.ask(
        player,
        player === id
          ? 'Give your final vote on your unchanged proposal after the discussion; explain it briefly'
          : 'Discuss this exact proposed team and cast your binding vote in the SAME answer; choose approve or reject. Give a brief reason without repeating vote words.',
        choicesForVote,
        true,
      );
      if (!answer) return;
      votes.set(player, answer.choice === 0 ? 'approve' : 'reject');
    }
    this.manager.callGameMethods(id, { method: 'sentSelectedPlayers' });
    for (const [player, option] of votes) {
      if (this.cancelled || this.manager.game.stage !== 'votingForTeam') break;
      this.manager.callGameMethods(player, { method: 'voteForMission', option });
    }
  }

  private async act() {
    const game = this.manager.game;
    if (game.stage === 'selectTeam') return this.discussTeam();
    const actor = game.players.find((p) => p.features.waitForAction);
    if (!actor) throw new AiPause('No player is available for the next action.');
    const id = actor.userID;
    const state = this.stateFor(id);
    const own = state.players.find((p) => p.id === id)!;
    let choices: Choice[];
    let task: string;
    let privateCheck: string | undefined;
    const speak = false;
    switch (state.stage) {
      case 'votingForTeam':
        task = 'Vote on the proposed team';
        choices = ['approve', 'reject'].map((option) => ({
          text: option,
          actions: [{ method: 'voteForMission', option: option as 'approve' | 'reject' }],
        }));
        break;
      case 'onMission':
        task = 'Secretly choose your mission action';
        choices = (own.validMissionsResult || []).map((result) => ({
          text: result,
          actions: [{ method: 'actionOnMission', result }],
        }));
        break;
      case 'checkLoyalty':
        task = 'Choose whom to inspect with the Lady of the Lake';
        choices = state.players
          .filter((p) => p.id !== id && !p.features.ladyOfLake)
          .map((p) => ({
            text: this.label(p.id),
            actions: [...this.select([p.id]), { method: 'checkLoyalty' }],
          }));
        break;
      case 'announceLoyalty':
        task = ['mordred', 'morgana', 'minion'].includes(own.role)
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
          .filter((p) => !['evil', 'mordred', 'morgana', 'minion'].includes(p.role))
          .map((p) => ({
            text: this.label(p.id),
            actions: [...this.select([p.id]), { method: 'assassinate', type: 'merlin' }],
          }));
        for (const ally of state.players.filter((p) => ['evil', 'mordred', 'morgana', 'minion'].includes(p.role))) {
          const suggestion = await this.ask(
            ally.id,
            'Private Evil council: suggest whom to assassinate, cite the strongest clue and compare an alternative. Respond to earlier teammates. This is advice, not the final shot.',
            choices.map((c) => ({ text: c.text, actions: [] })),
            true,
            undefined,
            true,
          );
          if (!suggestion) return;
        }
        break;
      default:
        throw new AiPause('Unsupported game stage.');
    }
    if (!choices.length) throw new AiPause('No legal actions available.');
    const result = await this.ask(id, task, choices, speak, privateCheck);
    if (result) {
      const inspected = state.players.find((p) => p.features.isSelected);
      this.apply(id, choices[result.choice]);
      if (state.stage === 'announceLoyalty' && inspected) {
        await this.publish(
          id,
          `I inspected ${this.label(inspected.id)} and announce: ${result.choice === 0 ? 'Good' : 'Evil'}.`,
        );
      }
    }
  }

  async run() {
    if (this.ai!.status !== 'ready') return;
    this.ai!.status = 'running';
    super.startGame();
    try {
      while (!this.cancelled && this.manager.game.stage !== 'end') {
        await this.act();
        await this.checkpoint(this.calculateRoomState());
      }
      if (!this.cancelled) {
        for (const entry of this.evilCouncil) {
          const player = this.manager.game.players.find((p) => `${p.index}` === entry.seat)!;
          await this.publish(player.userID, `Evil council (revealed): Target ${entry.target}. ${entry.reason}`);
        }
        for (const id of this.players) {
          if (this.cancelled) break;
          await this.ask(
            id,
            'Post-game conclusion: explain why YOUR side won or lost using specific mission/vote events, your own mistake or contribution, and one lesson. All roles are now public. Do not invent events.',
            [{ text: 'Write your conclusion', actions: [] }],
            true,
          );
        }
      }
      if (!this.cancelled) {
        this.ai!.status = 'finished';
        this.ai!.message = 'Match complete. Roles revealed and discussion saved.';
      }
    } catch (error) {
      this.ai!.status = 'paused';
      this.ai!.message =
        error instanceof AiPause ? error.message : 'Match paused due to an error. No further requests will be made.';
    } finally {
      this.updateRoomState(true);
      await this.checkpoint(this.calculateRoomState());
    }
  }
}
