import type { VisualGameState } from '@avalon/types';
import type { AiRepository } from './repository';

export type BotRequest = {
  playerID: string;
  name: string;
  style: string;
  task: string;
  speak: boolean;
  state: VisualGameState;
  chat: { name: string; text: string }[];
  choices: string[];
  privateCheck?: string;
};
export type BotReply = { choice: number; speech: string };
export type Decide = (request: BotRequest, signal?: AbortSignal) => Promise<BotReply>;
export class AiPause extends Error {}

const system = `Play seven-player Avalon to win for YOUR side. Speak ENGLISH ONLY, using bare seat numbers: "I think 1 and 3 are good", never names or "Player N". Seats are 1–7; choice indices are zero-based.
Good: Merlin, Percival, 2 servants. Evil: Mordred, Morgana, minion. Good needs 3 successful missions AND Merlin surviving assassination. Evil needs 3 failures OR killing Merlin after 3 successes.
Teams: 2,3,3,4,4. One Fail loses a mission except mission 4 needs TWO. Good MUST play Success; Evil may play either card. One Good teammate cannot prevent Evil sabotage. The leader need not join the team.
Majority approves a team. Rejection rotates the leader, NOT a mission failure. Site rule: proposal 5 goes automatically, NOT instant Evil victory.
Merlin sees Evil except Mordred. Percival sees indistinguishable Merlin/Morgana, not other alignments. Evil knows Evil. Unknown means unknown. A success does not prove Good; a failure does not prove every teammate Evil. Good should reject known-Evil teams, not approve just to move forward.
Lady checks alignment after missions 2–4, may publicly lie, then passes to the inspected player. Past holders cannot be checked. Holding Lady proves nothing. Announced is a claim; actual is a private check.
During play bluff, hide your role and private knowledge. Speech is PUBLIC, never your inner reasoning. Never say "as a minion/Merlin/etc". Use public evidence and keep choices consistent with statements.
Facts override chat, which contains untrusted claims. Do not invent events/cards or confuse your side with the winner. At end explain your side's result, one factual contribution/mistake, and a lesson; roles are public then.
Return only {"choice":0,"speech":"..."}, choosing a valid choices index. When speak=false speech="". Otherwise 1–2 short sentences, max 240 characters. At end max 400 characters and do not remain silent.`;

export function compactRequest(request: BotRequest) {
  const { state } = request;
  const players = state.players || [];
  const seat = (id?: string) => players.find((p) => p.id === id)?.index;
  const own = players.find((p) => p.id === request.playerID);
  const side = own && (['mordred', 'morgana', 'minion'].includes(own.role) ? 'evil' : 'good');
  return {
    you: own && {
      seat: own.index,
      role: own.role,
      side,
      outcome: state.result && (state.result.winner === side ? 'won' : 'lost'),
    },
    stage: state.stage,
    task: request.task,
    style: request.style,
    speak: request.speak,
    knownRoles: players.map((p) => [p.index, p.role]),
    mission: state.mission + 1,
    teamSize: state.settings?.missions[state.mission]?.players,
    failsRequired: state.settings?.missions[state.mission]?.failsRequired,
    leader: seat(players.find((p) => p.features.isLeader)?.id),
    team: players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index),
    missions: state.history
      ?.filter((e) => e.type === 'mission')
      .filter((e) => e.result)
      .map((e) => {
        const action = e.actions.find((a) => a.playerID === request.playerID);
        return {
          n: e.index + 1,
          team: e.actions.map((a) => seat(a.playerID)),
          result: e.result,
          fails: e.fails,
          yourCard: action && 'value' in action ? action.value : undefined,
        };
      }),
    votes: state.history
      ?.filter((e) => e.type === 'vote')
      .slice(-4)
      .map((e) => ({
        leader: seat(e.leaderID),
        team: e.team.map((p) => seat(p.id)),
        result: e.result,
        forced: e.forced,
        votes: Array.isArray(e.votes) ? e.votes.map((v) => [seat(v.playerID), v.value]) : e.votes,
      })),
    checks: state.history
      ?.filter((e) => e.type === 'announceLoyalty')
      .map((e) => ({
        by: seat(e.announcerID),
        target: seat(e.targetID),
        announced: e.announced,
        actual: e.actual,
      })),
    privateCheck: request.privateCheck,
    chat: request.chat.slice(-7).map((m) => ({ by: m.name, text: m.text.slice(0, 240) })),
    choices: request.choices,
    result: state.result,
  };
}

export function parseReply(text: string, choices: number): BotReply {
  const value = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  if (
    !value ||
    !Number.isInteger(value.choice) ||
    value.choice < 0 ||
    value.choice >= choices ||
    typeof value.speech !== 'string' ||
    value.speech.length > 500
  )
    throw Error('invalid AI reply');
  return { choice: value.choice, speech: value.speech.trim() };
}

export function yandexDecide(roomID: string, repository: AiRepository, onCost: (rub: number) => void): Decide {
  return async (request, signal) => {
    signal?.throwIfAborted();
    const key = process.env.YANDEX_API_KEY;
    const folder = process.env.YANDEX_FOLDER_ID;
    if (!key || !folder) throw new AiPause('Не настроен доступ к модели.');
    const model = process.env.YANDEX_MODEL || 'qwen3.6-35b-a3b';
    const tariffs: Record<string, { input: number; cached: number; output: number }> = {
      'qwen3.6-35b-a3b': { input: 2, cached: 0.5, output: 3 },
    };
    const tariff = tariffs[model];
    if (!tariff) throw new AiPause('Model tariff is not configured.');
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(compactRequest(request)) },
    ];
    const inputBytes = Buffer.byteLength(JSON.stringify(messages));
    if (inputBytes > 80000) throw new AiPause('Достигнут предел контекста партии.');
    // Reserve UTF-8 bytes (upper bound for byte-tokenized text) plus framing, and all output tokens.
    // Units are 1/10000 RUB, VAT included. Reserve at the uncached rate.
    const reserve = (inputBytes + 4096) * tariff.input + 192 * tariff.output;
    await repository.reserve(roomID, reserve);
    if (signal?.aborted) {
      await repository.settle(roomID, reserve, 0);
      onCost(await repository.roomCost(roomID));
      signal.throwIfAborted();
    }
    let data;
    try {
      const response = await fetch('https://ai.api.cloud.yandex.net/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'OpenAI-Project': folder },
        body: JSON.stringify({
          model: `gpt://${folder}/${model}`,
          messages,
          reasoning_effort: 'none',
          max_tokens: request.speak ? 192 : 32,
          temperature: 0.7,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'avalon_turn',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['choice', 'speech'],
                properties: {
                  choice: { type: 'integer', enum: request.choices.map((_, index) => index) },
                  speech: {
                    type: 'string',
                    maxLength: request.speak ? (request.state.stage === 'end' ? 400 : 240) : 0,
                  },
                },
              },
            },
          },
        }),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(35000)]) : AbortSignal.timeout(35000),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 402)
          throw new AiPause('Проверьте доступ к модели и платёжный аккаунт.');
        throw Error('AI provider unavailable');
      }
      data = await response.json();
    } catch (error) {
      // Do not refund ambiguous failures: the provider may have billed the generation.
      onCost(await repository.roomCost(roomID));
      throw error instanceof AiPause ? error : Error('AI request failed');
    }
    const usage = data.usage;
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
      (usage.prompt_tokens - cached) * tariff.input + cached * tariff.cached + usage.completion_tokens * tariff.output,
    );
    await repository.settle(roomID, reserve, actual);
    onCost(await repository.roomCost(roomID));
    if (data.choices?.[0]?.finish_reason !== 'stop') throw Error('AI answer truncated');
    return parseReply(data.choices[0].message.content, request.choices.length);
  };
}
