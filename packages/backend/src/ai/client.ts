import { Agent } from 'undici';
import { AI_REQUEST_TIMEOUT_MS } from './timing';
import { aiModel } from './models';
import { randomUUID } from 'crypto';
import type { VisualGameState } from '@avalon/types';
import type { AiRepository, AiRequestLog, AiDecisionTrace } from './repository';

// Scope long network timeouts to AI calls; other services keep their normal defaults.
const aiDispatcher = new Agent().compose(
  (dispatch) => (options, handler) =>
    dispatch({ ...options, headersTimeout: AI_REQUEST_TIMEOUT_MS, bodyTimeout: AI_REQUEST_TIMEOUT_MS }, handler),
);

export type BotRequest = {
  playerID: string;
  name: string;
  style: string;
  task: string;
  speak: boolean;
  state: VisualGameState;
  chat: { id?: string; name: string; text: string }[];
  choices: string[];
  privateCheck?: string;
  evilEvidence?: { name: string; text: string }[];
  evilCouncil?: { seat: string; target: string; reason: string }[];
  privateDiscussion?: boolean;
  rolesKnownBeforeReveal?: [number, string][];
};
export type DecisionEvidence = {
  kind: 'fact' | 'deduction' | 'testimony' | 'prediction' | 'bluff';
  key: string;
  fact: string;
  source: string;
  certainty: 'proven' | 'claim' | 'bluff';
};
export type BotReply = {
  choice: number;
  speech: string;
  privateReason?: string;
  publicReason?: string;
  evidence?: DecisionEvidence[];
};
export type Decide = (request: BotRequest, signal?: AbortSignal) => Promise<BotReply>;
export class AiPause extends Error {}
export class AiTechnicalPause extends AiPause {}
export class AiMatchBudgetPause extends AiPause {
  constructor(
    message: string,
    public reserveUnits: number,
  ) {
    super(message);
  }
}
export class AiOutputLimit extends AiPause {
  constructor(limit: number) {
    super(`Модель исчерпала лимит ответа (${limit} токенов), не завершив решение. Партия приостановлена.`);
  }
}

export function systemFor(request: BotRequest): string {
  const format =
    'Speak ENGLISH ONLY with bare seat numbers, never names or Player prefixes. Return only {"choice":"exact entry from choices","speech":"..."}. Copy a legal choice exactly. When speak=false speech=""; otherwise write complete short sentences, at most 240 characters (800 at end). Facts override testimony; do not invent actions.';
  if (request.state.stage === 'end')
    return `${format} Review the finished game honestly. Explain the cause behind one consequential decision for your side, not just the rule that ended the game. Winning does not make every decision correct. Use assassinations and mission cards, not other players' conclusions. Automatic proposals are not voluntary votes. Revealed roles were not necessarily known during play. Admit public role leaks shown in yourStatements. No need to bluff now.`;
  const rules =
    'Good needs 3 mission successes AND Merlin surviving assassination. Evil needs 3 failures OR killing Merlin after 3 successes. Success never proves alignment. Private knowledge is not public evidence: never reveal Merlin, Percival candidates or Evil allies in public speech. Lady announcements are claims, not verified public alignment. Unknown means unknown. Current privateKnowledge and score override old memory and public claims. A player marked evil in your private knowledge remains Evil regardless of helpful behavior. Percival must use the mysteryWizard pair: exactly one is Merlin and one Morgana, not two unknown ordinary players.';
  const ladyTrust =
    'Lady trust for Good: your own actual Good inspection proves that target Good with certainty. If you announced Good truthfully, seek to include that player in EVERY proposed mission alongside yourself, ahead of untested seats, and strongly prefer such rosters when voting. If this trusted player later announces another target Good, extend your trusted core along that directed check chain and favor both in future teams. Preserve the chain and its sources in private memory. Example only: you checked 2 Good; 2 checked 4 and announced Good; favor yourself, 2 and 4 when team size permits. Your direct result is proven; the later link relies on the trusted checker telling the truth. Public Good announcements from untrusted players do not establish this chain. Never treat your own false Good announcement as real knowledge. Fit the legal team size, prioritize directly verified Good when space is limited, and do not approve a dangerous full roster merely because it includes a trusted player. Evil can imitate this public trust but must still act for Evil.';
  const deductionExamples =
    'Mission deduction examples (illustrations, NOT events from this game): (1) Team [you, 1], yourCard=Success, fails=1: 1 played Fail and is Evil. (2) Team [you, 1, 2], yourCard=Success, fails=2: BOTH 1 and 2 played Fail and are Evil. (3) The same three-person team with only one Fail proves at least one of 1 and 2 is Evil, not which one or both. (4) A successful mission does not prove its members Good: Evil may play Success. (5) When two Fails are required, a team with exactly one Evil cannot fail; one known Evil does not establish how many unknown teammates are Evil. Use only your own visible card and recorded fails during play, never hidden cards. A Good voter should not treat rejection of a failed team as evidence of Evil. Keep proven deductions across turns; do not replace them with unsupported trust. Choose for YOUR side: Good normally avoids proven saboteurs; Evil may exploit them while hiding its motive.';
  switch (request.state.stage) {
    case 'onMission':
      return `${format} ${rules} Choose a secret card for YOUR side. Good must play Success. Evil can use Success for cover or Fail for sabotage. Use missionRule: one Fail cannot defeat a mission needing two. Your card does not cancel another card. Compare Success and Fail against the current score: at two Good successes, another success immediately triggers assassination. If two Evil are on a mission requiring two Fails, both need Fail to defeat it. Do not rely on one ally alone. Choose Success for cover only with a concrete benefit that justifies the risk to your side.`;
    case 'checkLoyalty':
    case 'announceLoyalty':
      return `${format} ${rules} ${ladyTrust} Lady checks alignment and passes to the inspected player; past holders cannot be checked. Good announces privateKnowledge.inspectionResult truthfully by default: Lady explains the knowledge without revealing Merlin. A lie requires a concrete protective tactic. Evil may lie for its side. inspectionTarget is NOT a mission team.`;
    case 'assassinate':
      return `${format} ${rules} Find Merlin, not merely an active Good leader. Compare direct role claims with behavior, possible bluffs and privileged knowledge of Evil excluding Mordred. All Evil share this objective. When privateDiscussion=true your speech is PRIVATE: recommend the SAME target as choice, cite evidence, compare an alternative and respond to previous advice. A Lady Good result does NOT exclude Merlin: Merlin is Good, and Lady reveals alignment, not role. Leading the last successful mission is weak evidence: leaders cannot control others' cards. In council, give one piece of evidence for your candidate and one reason an alternative could be Merlin; challenge unsupported earlier advice instead of merely agreeing. The designated assassin chooses after comparing alternatives, not by council popularity. Public testimony is evidence, not proof.`;
    default:
      return `${format} ${rules} ${deductionExamples} ${ladyTrust} Normally include yourself in proposals: Good reduces unknowns, Evil gains trust or sabotage opportunities. Omit yourself only for a concrete tactical reason. Prefer coherent teams over equally safe teams with players opposing each other; conflict is not proof. Majority approves. Reject cancels ONLY the proposal, rotates the leader and leaves the mission number and score unchanged. Fail is a secret mission card, NOT a vote. Example only: score 0-0, team [1,4] rejected means still 0-0 with NO completed mission. Approving an Evil team allows sabotage; rejecting it prevents that attempt. Proposal 5 is automatic, not an Evil win. If the fifth leader is suspicious, seek an acceptable earlier team without blindly accepting a losing roster. Follow missionRule, not intuition about Fail counts. Never claim to join a team without your seat. Normally support your own unchanged proposal. Public voting speech gives only the factual reason; the server announces your current vote. You may describe earlier votes accurately, but do not repeat your current vote. Proposal speech explains the selected roster without repeating it.`;
  }
}

const roleAdvice: Record<string, string> = {
  merlin:
    'Your survival is part of winning, not an optional final step. Never publicly name your role or quote your secret Evil list. Guide Good with public evidence and cautious suspicions. Evaluate the whole roster against failsRequired. With two Fails required, exactly one Evil is SAFE for the mission even if that player always plays Fail; approving it can secure the third success. Reject if a second Evil could be present and a safer roster is available. You see only two Evil in this seven-player setup: Mordred is hidden. Unknown is NOT confirmed Good. Locate the remaining Evil using completed missions; never clear everyone outside your visible Evil list. If a failed mission contained neither visible Evil, hidden Mordred was among its participants. Do not call those suspects likely Good just because you cannot see them. Prefer a roster excluding that suspect group when enough other seats remain, especially alongside one known Evil on a two-Fail mission.',
  percival:
    'Your wizard pair contains Merlin and Morgana; you do NOT know which is which. Treat them as candidates, never label either Morgana as fact without evidence. Track the actual author of Lady claims. Protect likely Merlin without exposing the pair or your certainty. You do not know other alignments.',
  servant:
    'You are ALWAYS Good. Deliberate mission failure or helping Evil NEVER benefits you. Infer from mission rosters and public behavior, not invented private knowledge.',
  mordred:
    'Only YOU are hidden from Merlin. Conceal your allies; fake credible Good arguments. Choose Success for cover or Fail to advance Evil, never announce sabotage.',
  morgana:
    'Percival may mistake you for Merlin; cultivate credible guidance. Merlin DOES see you as Evil. Exploit uncertainty without exposing yourself or allies.',
  minion:
    'Help Evil through votes and mission cards while posing as Good. Look for Merlin among players consistently avoiding you and Morgana. Do not admit sabotage.',
};

export function compactRequest(request: BotRequest) {
  const { state } = request;
  const players = state.players || [];
  const seat = (id?: string) => players.find((p) => p.id === id)?.index;
  const own = players.find((p) => p.id === request.playerID);
  const side = own && (['mordred', 'morgana', 'minion'].includes(own.role) ? 'evil' : 'good');
  const seats = [...players].sort((a, b) => a.index - b.index);
  const leaderPosition = seats.findIndex((p) => p.features.isLeader);
  const proposal =
    leaderPosition >= 0 && Number.isInteger(state.vote) && state.vote >= 0 && state.vote <= 4
      ? {
          number: state.vote + 1,
          fifthLeader: seats[(leaderPosition + 4 - state.vote) % seats.length].index,
          rejectionsUntilForced: 4 - state.vote,
          forced: state.vote === 4,
        }
      : undefined;

  const end = state.stage === 'end';
  const assassination = state.stage === 'assassinate';
  const teamStage = ['selectTeam', 'votingForTeam', 'onMission'].includes(state.stage);
  const voting = ['selectTeam', 'votingForTeam'].includes(state.stage);
  const inspection = ['checkLoyalty', 'announceLoyalty'].includes(state.stage);
  const team = players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index);
  const history = state.history || [];
  const missions = history
    .filter((e) => e.type === 'mission')
    .filter((e) => e.result)
    .map((e) => {
      const action = e.actions.find((a) => a.playerID === request.playerID);
      return {
        n: e.index + 1,
        failsRequired: e.settings?.failsRequired ?? state.settings?.missions[e.index]?.failsRequired,
        leader: seat(e.leaderID),
        team: e.actions.map((a) => seat(a.playerID)),
        result: e.result,
        fails: e.fails,
        participated: Boolean(action),
        cards: end ? e.actions.map((a) => [seat(a.playerID), 'value' in a ? a.value : 'unknown']) : undefined,
        yourCard: action && 'value' in action ? action.value : undefined,
      };
    });
  let missionNumber = 1;
  let attempt = 0;
  const votes = history.flatMap((e) => {
    if (e.type === 'mission' && e.result) {
      missionNumber = e.index + 2;
      attempt = 0;
    }
    if (e.type !== 'vote') return [];
    return [
      {
        mission: missionNumber,
        attempt: ++attempt,
        leader: seat(e.leaderID),
        team: e.team.map((p) => seat(p.id)),
        result: e.result,
        forced: e.forced,
        votes: e.forced
          ? 'automatic: no vote cast'
          : Array.isArray(e.votes)
            ? e.votes.map((v) => [seat(v.playerID), v.value])
            : e.votes,
        yourVote: e.forced
          ? 'automatic: no vote cast'
          : Array.isArray(e.votes)
            ? e.votes.find((v) => v.playerID === request.playerID)?.value
            : undefined,
      },
    ];
  });
  const checks = history.filter((e) => e.type === 'announceLoyalty');
  const failsRequired = state.settings?.missions[state.mission]?.failsRequired;
  return {
    you: own && {
      seat: own.index,
      role: own.role,
      side,
      outcome: state.result && (state.result.winner === side ? 'won' : 'lost'),
    },
    roleAdvice: !end && own ? roleAdvice[own.role] : undefined,
    stage: state.stage,
    task: request.task,
    speak: request.speak,
    objective: end
      ? undefined
      : side === 'good'
        ? 'Win successful missions AND keep Merlin alive.'
        : 'Win three failed missions OR assassinate Merlin after three successes.',
    privateKnowledge: end
      ? undefined
      : {
          rolesVisibleToYou: players.map((p) => [p.index, p.role]),
          checks: checks
            .filter((e) => e.actual !== undefined)
            .map((e) => ({ by: seat(e.announcerID), target: seat(e.targetID), actual: e.actual })),
          inspectionResult: inspection ? request.privateCheck : undefined,
        },
    revealedRoles: end ? players.map((p) => [p.index, p.role]) : undefined,
    rolesKnownBeforeReveal: end ? request.rolesKnownBeforeReveal : undefined,
    score: {
      successes: missions.filter((m) => m.result === 'success').length,
      failures: missions.filter((m) => m.result === 'fail').length,
    },
    proposal: voting ? proposal : undefined,
    mission: teamStage ? state.mission + 1 : undefined,
    teamSize: teamStage ? state.settings?.missions[state.mission]?.players : undefined,
    proposedTeam: voting ? team : undefined,
    missionTeam: state.stage === 'onMission' ? team : undefined,
    youAreOnTeam: teamStage && own ? team.includes(own.index) : undefined,
    // Factual arithmetic only: strategy and deductions about unknown players remain with Qwen.
    actionFacts:
      teamStage && own
        ? {
            yourSeat: own.index,
            yourSide: side,
            team,
            youAreOnTeam: team.includes(own.index),
            knownEvilOnTeam: players
              .filter((p) => team.includes(p.index) && ['evil', 'mordred', 'morgana', 'minion'].includes(p.role))
              .map((p) => p.index),
            unresolvedOnTeam: players
              .filter((p) => team.includes(p.index) && ['unknown', 'mysteryWizard'].includes(p.role))
              .map((p) => p.index),
            failsRequired,
            toleratesFails: failsRequired === undefined ? undefined : failsRequired - 1,
            openingSelfPreference:
              side === 'good' &&
              state.mission === 0 &&
              voting &&
              !team.includes(own.index) &&
              Number.isInteger(state.vote) &&
              state.vote < 3,
          }
        : undefined,
    missionRule:
      teamStage && failsRequired !== undefined
        ? { successWithFails: Array.from({ length: failsRequired }, (_, i) => i), failureAtLeast: failsRequired }
        : undefined,
    inspectionTarget: inspection ? seat(players.find((p) => p.features.isSelected)?.id) : undefined,
    // The first two lists are authoritative event classes, never interchangeable.
    missions,
    alignmentCounts: players.length === 7 ? { good: 4, evil: 3 } : undefined,
    votes: state.stage === 'onMission' ? undefined : votes.slice(-25),
    checks: checks.map((e) => ({
      by: seat(e.announcerID),
      target: seat(e.targetID),
      announced: e.announced,
      actual: end ? e.actual : undefined,
    })),
    assassinations: end
      ? history
          .filter((e) => e.type === 'assassinate')
          .map((e) => ({
            assassin: seat(e.assassinID),
            targets: e.killedIDs.map(seat),
            result: e.result,
            type: e.assassinateType,
          }))
      : undefined,
    yourStatements: end ? request.chat.filter((m) => m.name === String(own?.index)).map((m) => m.text) : undefined,
    privateDiscussion: assassination ? request.privateDiscussion || undefined : undefined,
    evilEvidence: assassination && side === 'evil' ? request.evilEvidence : undefined,
    evilCouncil: assassination && side === 'evil' ? request.evilCouncil : undefined,
    chat:
      end || assassination || state.stage === 'onMission'
        ? undefined
        : request.chat.slice(-7).map((m) => ({ by: m.name, text: m.text.slice(0, 240) })),
    choices: request.choices,
    result: end ? state.result : undefined,
  };
}

export function parseReply(text: string, choices: number | string[], maxSpeech = 500): BotReply {
  const value = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  if (value && typeof value.choice === 'string' && Array.isArray(choices)) value.choice = choices.indexOf(value.choice);
  if (
    !value ||
    !Number.isInteger(value.choice) ||
    value.choice < 0 ||
    value.choice >= (Array.isArray(choices) ? choices.length : choices) ||
    typeof value.speech !== 'string' ||
    value.speech.length > maxSpeech
  )
    throw Error('invalid AI reply');
  return { choice: value.choice, speech: value.speech.trim() };
}

export function parseDecisionReply(text: string, choices: string[]): BotReply {
  const reply = parseReply(text, choices);
  const data = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  const bounded = (value: unknown, max: number) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  if (
    typeof data.publicReason !== 'string' ||
    data.publicReason.length > 240 ||
    !Array.isArray(data.evidence) ||
    data.evidence.length > 6 ||
    data.evidence.some(
      (item: DecisionEvidence) =>
        !item ||
        !bounded(item.key, 60) ||
        !bounded(item.fact, 240) ||
        !bounded(item.source, 160) ||
        !['fact', 'deduction', 'testimony', 'prediction', 'bluff'].includes(item.kind) ||
        !['proven', 'claim', 'bluff'].includes(item.certainty),
    )
  )
    throw new AiTechnicalPause('Model returned invalid decision evidence. Match paused.');
  // A forecast or someone else's claim cannot become proof merely by asking for that certainty.
  const evidence = (data.evidence as DecisionEvidence[]).map((item) => ({
    ...item,
    certainty:
      item.kind === 'bluff' || item.certainty === 'bluff'
        ? ('bluff' as const)
        : ['prediction', 'testimony'].includes(item.kind)
          ? ('claim' as const)
          : item.certainty,
  }));
  return { ...reply, publicReason: data.publicReason.trim(), evidence };
}

export type GenerationOptions = {
  model?: string;
  decisionDetails?: boolean;
  snapshot?: boolean;
  reasoning?: 'none' | 'default';
  maxOutput?: number;
  phase?: string;
  instructions?: string;
  context?: unknown;
};
export function yandexDecide(
  roomID: string,
  repository: AiRepository,
  onCost: (rub: number) => void,
  options: GenerationOptions = {},
): Decide {
  const sessionMode =
    !options.snapshot &&
    (process.env.AI_CONTEXT_MODE === 'sessions' ||
      (process.env.NODE_ENV === 'development' && process.env.AI_CONTEXT_MODE !== 'snapshot'));
  const sessions = new Map<string, { id: string; bytes: number; seen: Set<string>; turns: number; memory: string }>();
  return async (request, signal) => {
    const audit: AiRequestLog = {
      _id: randomUUID(),
      roomID,
      player: request.name,
      stage: request.state.stage,
      mode: options.phase || (sessionMode ? 'sessions' : 'snapshot'),
      startedAt: new Date(),
      status: 'preparing',
    };
    let trace: AiDecisionTrace | undefined;
    const writeTrace = async () => {
      try {
        if (trace && repository.recordDecision) await repository.recordDecision(trace);
      } catch {
        throw new AiPause('Could not save private decision trace. Match paused.');
      }
    };
    const writeAudit = async () => {
      try {
        if (repository.recordRequest) await repository.recordRequest(audit);
      } catch {
        throw new AiPause('Could not save request cost log. Match paused.');
      }
    };
    try {
      signal?.throwIfAborted();
      const key = process.env.YANDEX_API_KEY;
      const folder = process.env.YANDEX_FOLDER_ID;
      if (!key || !folder) throw new AiPause('Не настроен доступ к модели.');
      let selected;
      try {
        selected = aiModel(options.model);
      } catch (error) {
        throw new AiPause((error as Error).message);
      }
      const { id: model, tariff } = selected;
      const saved = sessionMode ? sessions.get(request.playerID) : undefined;
      const reset = Boolean(saved && (saved.turns >= 4 || saved.bytes >= 12000));
      const previous = reset ? undefined : saved;
      audit.contextReset = reset;
      audit.retainedBytes = previous?.bytes || 0;
      const maxOutput = options.maxOutput ?? (sessionMode ? (request.speak ? 384 : 256) : request.speak ? 192 : 32);
      const seen = new Set(saved?.seen);
      const context = compactRequest(request);
      const fresh = <T>(kind: string, values: T[] | undefined): T[] =>
        (values || []).filter((value) => {
          const identity = `${kind}:${JSON.stringify(value)}`;
          if (seen.has(identity)) return false;
          seen.add(identity);
          return true;
        });
      const sessionInput = sessionMode
        ? {
            personalMemory: saved?.memory || '',
            restartFacts: reset
              ? {
                  missions: context.missions,
                  votes: context.votes,
                  checks: context.checks,
                  recentChat: request.chat.slice(-7),
                  council: context.evilCouncil,
                }
              : undefined,
            current: {
              ...context,
              missions: undefined,
              votes: undefined,
              checks: undefined,
              chat: undefined,
              evilEvidence: undefined,
              evilCouncil: undefined,
              yourStatements: undefined,
            },
            newEvents: {
              missions: fresh('mission', context.missions),
              votes: fresh('vote', context.votes),
              checks: fresh('check', context.checks),
              messages: fresh('message', request.chat),
              council: fresh('council', context.evilCouncil),
            },
          }
        : undefined;
      const instructions =
        (options.instructions ?? systemFor(request)) +
        (sessionMode
          ? ' This is your private continuing game session. newEvents are updates; current is authoritative. Also return memory: a PRIVATE English note, preferably 200-400 characters, maximum 600. Use exactly three concise finished lines: Facts: at most two sourced facts or important claims, explicitly marking claims; Suspicions: one uncertain hypothesis with evidence, preserving any Lady trust chain; Decision: one short reason for the actual choice. No monologue, questions, rule recitation, counterfactual rambling or copied score/role lists. Preserve useful earlier evidence; delete old notes contradicted by current facts. Reject is never a mission Fail; an ally listed Evil never becomes Good from behavior. Your note must end in a complete sentence. It is private and survives context resets.'
          : '');
      const messages = [
        { role: 'system', content: instructions },
        { role: 'user', content: JSON.stringify(options.context ?? sessionInput ?? context) },
      ];
      // Count retained input AND output conservatively; provider history is billable too.
      const inputBytes = (previous?.bytes || 0) + Buffer.byteLength(JSON.stringify(messages));
      audit.inputBytes = inputBytes;
      if (inputBytes > 80000) throw new AiPause('Достигнут предел контекста партии.');
      // Reserve UTF-8 bytes (upper bound for byte-tokenized text) plus framing, and all output tokens.
      // Units are 1/10000 RUB, VAT included. Reserve at the uncached rate.
      const reserve = (inputBytes + 4096) * tariff.input + maxOutput * tariff.output;
      audit.reserveUnits = reserve;
      audit.status = 'reserving';
      const budgetPeriod = await repository.reserve(roomID, reserve);
      audit.status = 'reserved';
      await writeAudit();
      if (signal?.aborted) {
        await repository.settle(roomID, reserve, 0, budgetPeriod);
        audit.status = 'cancelled-before-send';
        audit.actualUnits = 0;
        onCost(await repository.roomCost(roomID));
        signal.throwIfAborted();
      }
      let data;
      try {
        const chatPayload = {
          model: `gpt://${folder}/${model}`,
          messages,
          ...(options.reasoning === 'default' ? {} : { reasoning_effort: 'none' }),
          max_tokens: maxOutput,
          temperature: 0.7,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'avalon_turn',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                required: sessionMode
                  ? ['choice', 'speech', 'memory']
                  : options.decisionDetails
                    ? ['evidence', 'speech', 'choice', 'publicReason']
                    : ['choice', 'speech'],
                properties: {
                  ...(options.decisionDetails
                    ? {
                        publicReason: { type: 'string', maxLength: 240 },
                        evidence: {
                          type: 'array',
                          maxItems: 6,
                          items: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['key', 'kind', 'fact', 'source', 'certainty'],
                            properties: {
                              key: { type: 'string', minLength: 1, maxLength: 60 },
                              fact: { type: 'string', minLength: 1, maxLength: 240 },
                              source: { type: 'string', minLength: 1, maxLength: 160 },
                              kind: { type: 'string', enum: ['fact', 'deduction', 'testimony', 'prediction', 'bluff'] },
                              certainty: { type: 'string', enum: ['proven', 'claim', 'bluff'] },
                            },
                          },
                        },
                      }
                    : {}),
                  ...(sessionMode ? { memory: { type: 'string', maxLength: 600 } } : {}),
                  choice: { type: 'string', enum: request.choices },
                  speech: {
                    type: 'string',
                    maxLength: request.speak ? (request.state.stage === 'end' ? 800 : 240) : 0,
                  },
                },
              },
            },
          },
        };
        const payload = sessionMode
          ? {
              model: chatPayload.model,
              store: true,
              previous_response_id: previous?.id,
              instructions,
              input: [messages[1]],
              reasoning: { effort: 'none' },
              max_output_tokens: chatPayload.max_tokens,
              temperature: chatPayload.temperature,
              text: { format: { type: 'json_schema', ...chatPayload.response_format.json_schema } },
            }
          : chatPayload;
        trace = {
          _id: audit._id,
          roomID,
          player: request.name,
          stage: request.state.stage,
          createdAt: audit.startedAt,
          payload,
          memoryBefore: saved?.memory,
        };
        await writeTrace();
        audit.status = 'sent';
        await writeAudit();
        const response = await fetch(
          `https://ai.api.cloud.yandex.net/v1/${sessionMode ? 'responses' : 'chat/completions'}`,
          {
            method: 'POST',
            ...{ dispatcher: aiDispatcher },
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'OpenAI-Project': folder },
            body: JSON.stringify(payload),
            signal: signal
              ? AbortSignal.any([signal, AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS)])
              : AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
          },
        );
        audit.httpStatus = response.status;
        if (!response.ok) {
          if (response.status === 401 || response.status === 403 || response.status === 402)
            throw new AiPause('Проверьте доступ к модели и платёжный аккаунт.');
          if (response.status === 429 || response.status >= 500)
            throw new AiTechnicalPause('Временная ошибка провайдера. Можно повторить запрос.');
          throw new AiPause('AI provider rejected the request. Match paused to preserve context.');
        }
        data = await response.json();
        trace.responseID = typeof data.id === 'string' ? data.id : undefined;
        trace.output = sessionMode ? data.output : data.choices;
        await writeTrace();
      } catch (error) {
        // Do not refund ambiguous failures: the provider may have billed the generation.
        onCost(await repository.roomCost(roomID));
        if (error instanceof Error && error.name === 'TimeoutError')
          throw new AiTechnicalPause('Модель не ответила за 10 минут. Партия приостановлена.');
        throw error instanceof AiPause
          ? error
          : sessionMode
            ? new AiPause('Session request failed. Match paused to avoid losing or duplicating a turn.')
            : Error('AI request failed');
      }
      const usage = sessionMode
        ? {
            prompt_tokens: data.usage?.input_tokens,
            completion_tokens: data.usage?.output_tokens,
            prompt_tokens_details: data.usage?.input_tokens_details,
          }
        : data.usage;
      if (
        !Number.isSafeInteger(usage?.prompt_tokens) ||
        !Number.isSafeInteger(usage?.completion_tokens) ||
        usage.prompt_tokens < 0 ||
        usage.completion_tokens < 0
      )
        throw new AiPause('API не вернул данные расхода.');
      const cached = usage.prompt_tokens_details?.cached_tokens ?? 0;
      if (!Number.isSafeInteger(cached) || cached < 0 || cached > usage.prompt_tokens)
        throw new AiPause('Invalid cached token usage.');
      const actual = Math.ceil(
        (usage.prompt_tokens - cached) * tariff.input +
          cached * tariff.cached +
          usage.completion_tokens * tariff.output,
      );
      audit.inputTokens = usage.prompt_tokens;
      audit.cachedTokens = cached;
      audit.outputTokens = usage.completion_tokens;
      audit.actualUnits = actual;
      await repository.settle(roomID, reserve, actual, budgetPeriod);
      onCost(await repository.roomCost(roomID));
      if (sessionMode) {
        if (data.status !== 'completed' || typeof data.id !== 'string')
          throw new AiPause('Incomplete session response. Match paused.');
        const output = (data.output || [])
          .filter((item: { type: string }) => item.type === 'message')
          .flatMap((item: { content: { type: string; text?: string }[] }) => item.content || [])
          .filter((item: { type: string }) => item.type === 'output_text')
          .map((item: { text: string }) => item.text)
          .join('');
        let reply: BotReply;
        let memory: string;
        try {
          reply = parseReply(output, request.choices, request.state.stage === 'end' ? 800 : 500);
          const parsed = JSON.parse(output.replace(/^```(?:json)?\s*|\s*```$/g, ''));
          if (typeof parsed.memory !== 'string' || parsed.memory.length > 600) throw Error('Invalid memory');
          memory = parsed.memory.trim();
        } catch {
          throw new AiPause('Invalid session action. Match paused to keep game and conversation aligned.');
        }
        Object.assign(trace!, { memoryAfter: memory, choice: request.choices[reply.choice], speech: reply.speech });
        await writeTrace();
        sessions.set(request.playerID, {
          id: data.id,
          bytes: inputBytes + Buffer.byteLength(JSON.stringify(data.output)) + 1024,
          seen,
          turns: (previous?.turns || 0) + 1,
          memory,
        });
        audit.status = 'completed';
        return reply;
      }
      if (data.choices?.[0]?.finish_reason === 'length') throw new AiOutputLimit(maxOutput);
      if (data.choices?.[0]?.finish_reason !== 'stop')
        throw new AiTechnicalPause('Модель не вернула завершённый ответ. Партия приостановлена.');
      const reply = options.decisionDetails
        ? parseDecisionReply(data.choices[0].message.content, request.choices)
        : parseReply(data.choices[0].message.content, request.choices, request.state.stage === 'end' ? 800 : 500);
      Object.assign(trace!, {
        choice: request.choices[reply.choice],
        speech: reply.speech,
        publicReason: reply.publicReason,
        evidence: reply.evidence,
      });
      await writeTrace();
      audit.status = 'completed';
      return reply;
    } catch (error) {
      audit.status =
        audit.status === 'reserving'
          ? 'reservation-rejected'
          : audit.status === 'sent' && audit.actualUnits === undefined
            ? 'unconfirmed-charge'
            : audit.status === 'cancelled-before-send'
              ? audit.status
              : 'error';
      throw error;
    } finally {
      audit.finishedAt = new Date();
      await writeAudit();
    }
  };
}
