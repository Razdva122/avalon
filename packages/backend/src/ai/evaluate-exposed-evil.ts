import { writeFile } from 'fs/promises';
import { decisionPipeline } from './pipeline';
import { buildCodexPrompt, codexSchema, runCodex } from './codex';
import { parseDecisionReply } from './client';
import type { BotRequest } from './client';

const settings = { model: 'gpt-6.1-sol', reasoning: 'medium' } as const;
type Mode = 'direct' | 'reverse';
const mission = (index: number, team: number[], fails: number, threshold = 1) => ({
  type: 'mission',
  index,
  leaderID: String(index + 1),
  settings: { players: team.length, failsRequired: threshold },
  result: fails >= threshold ? 'fail' : 'success',
  fails,
  actions: team.map((n) => ({ playerID: String(n), ...(n === 1 ? { value: 'fail' } : {}) })),
});
const vote = (team: number[], own: string, result: string) => ({
  type: 'vote',
  leaderID: String(team.includes(3) ? 2 : 3),
  team: team.map((n) => ({ id: String(n) })),
  result,
  forced: false,
  votes: Array.from({ length: 7 }, (_, i) => ({
    playerID: String(i + 1),
    value:
      i === 0
        ? own
        : i === 5
          ? own === 'approve'
            ? 'reject'
            : 'approve'
          : result === 'approve' && [2, 4, 5].includes(i + 1)
            ? 'approve'
            : 'reject',
  })),
});

function position(mode: Mode, turn: number, chat: BotRequest['chat']): BotRequest {
  const history: unknown[] = [mission(0, [1, 7], 2)];
  if (turn >= 2) history.push(vote([2, 3, 6], mode === 'direct' ? 'approve' : 'reject', 'reject'));
  if (turn >= 3)
    history.push(vote([2, 4, 6], mode === 'direct' ? 'reject' : 'approve', 'approve'), mission(1, [2, 4, 6], 0));
  if (turn === 4) history.push(mission(2, [2, 3, 6], 1), mission(3, [2, 4, 6, 7], 0, 2));
  const team = turn === 1 ? [2, 3, 6] : turn === 2 ? [2, 4, 6] : turn === 4 ? [1, 3, 4, 6] : [];
  const stage = turn === 4 ? 'onMission' : [1, 2].includes(turn) ? 'votingForTeam' : 'selectTeam';
  return {
    playerID: '1',
    name: '1',
    language: 'ru',
    style: 'Speak naturally, plainly and briefly.',
    humanPlayerIDs: ['6'],
    task:
      stage === 'selectTeam'
        ? 'Discuss the next team before selection; respond to the latest relevant public position.'
        : stage === 'onMission'
          ? 'Secretly choose your mission card.'
          : 'Vote silently on the current roster.',
    speak: stage === 'selectTeam',
    publicDiscussion: stage === 'selectTeam',
    chat,
    choices:
      stage === 'selectTeam'
        ? ['2, 3, 6', '2, 4, 6']
        : stage === 'onMission'
          ? ['success', 'fail']
          : ['approve', 'reject'],
    state: {
      stage,
      mission: turn === 4 ? 4 : turn >= 3 ? 2 : 1,
      vote: turn === 2 ? 1 : 0,
      settings: {
        total: 7,
        players: { good: 4, evil: 3 },
        roles: { good: ['merlin', 'percival', 'servant', 'servant'], evil: ['mordred', 'morgana', 'oberon'] },
        missions: [2, 3, 3, 4, 4].map((players, i) => ({ players, failsRequired: i === 3 ? 2 : 1 })),
      },
      players: Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        name: String(i + 1),
        index: i + 1,
        role: i === 0 ? 'mordred' : i === 2 ? 'evil' : 'unknown',
        features: {
          isLeader: i + 1 === (turn === 3 ? 4 : turn === 2 || turn === 4 ? 3 : 2),
          isSelected: team.includes(i + 1),
          isSent: team.includes(i + 1),
        },
      })),
      history,
    } as unknown as BotRequest['state'],
  };
}

async function main() {
  const output = process.argv.find((a) => a.startsWith('--output='))?.slice(9);
  if (!output) throw Error('Use --output=<report.json>; --run requests inference.');
  if (!process.argv.includes('--run')) {
    console.log(
      'Two synthetic five-turn sequences: admission, two votes, next discussion, immediate winning card. Model gpt-6.1-sol / medium. Add --run.',
    );
    return;
  }
  let calls = 0;
  const selected = process.argv.find((a) => a.startsWith('--mode='))?.slice(7);
  if (selected && !['direct', 'reverse'].includes(selected)) throw Error('Use --mode=direct|reverse.');
  const modes = (['direct', 'reverse'] as const).filter((m) => !selected || m === selected);
  const results: Record<string, unknown>[] = [];
  const errors: { mode: Mode; message: string }[] = [];
  const report = () => ({
    settings,
    modes,
    maxCalls: 14,
    calls,
    results,
    errors,
    limitation:
      'One synthetic sequence per line, normal production schema and pipeline, no extra assessment fields. Supplied continuations are controlled positions, not a simulation of all seven players.',
  });
  for (const mode of modes) {
    const chat: BotRequest['chat'] = [
      { name: '7', text: 'В походе 1/7 две карты провала. Тут наши с 1 стороны уже всем известны.' },
      { name: '2', text: '1 и 7 точно злые по двум картам. В поход 1 больше не берём.' },
      { name: '4', text: 'Отрицать сторону 1 бессмысленно. Обсуждаем составы без него.' },
      {
        name: '6',
        text:
          mode === 'direct'
            ? 'Я считаю 1 злым, но поддержку им игрока 3 не считаю доказательством. Готов рассматривать 2/3/6, если удастся согласовать остальных.'
            : 'Я использую связь с 1: кого он продвигает, тому не доверяю. Если 1 за 4, предпочту 3 вместо 4. Если 1 против 3, для меня это довод взять 3.',
      },
    ];
    let turn = 0;
    const decide = decisionPipeline(async (request, options, signal) => {
      if (++calls > 14) throw Error('Model evaluation call limit reached.');
      const built = buildCodexPrompt(options.instructions, options.context, options.cacheInstructions);
      const response = await runCodex(
        built.prompt,
        codexSchema(request.choices, true, false, request),
        signal,
        settings,
        built.instructions,
      );
      const reply = parseDecisionReply(response.text, request.choices, request);
      results.push({
        mode,
        turn,
        stage: request.state.stage,
        context: options.context,
        rawReply: JSON.parse(response.text),
        choice: request.choices[reply.choice],
        usage: response.usage,
      });
      await writeFile(output, JSON.stringify(report(), null, 2));
      return reply;
    });
    try {
      for (turn = 0; turn < 5; turn++) {
        if (turn === 3)
          chat.push({
            name: '6',
            text:
              mode === 'direct'
                ? '2/4/6 прошли, но это не закрывает вопрос о 3. Я всё ещё готов обсуждать его; поддержку 1 отдельно доказательством не считаю.'
                : '2/4/6 прошли, но до двух провалов этот успех не очищает всех. Правило связей с 1 сохраняю: кого он продвигает, того пока не беру.',
          });
        const reply = await decide(position(mode, turn, structuredClone(chat)));
        const row = results[results.length - 1];
        const context = row.context as {
          exposedEvil?: { plan: { mode: string; promotedSeat: number; desiredSeat: number } };
        };
        const raw = row.rawReply as {
          admitEvil?: boolean;
          exposedStrategy?: { mode: string; promotedSeat: number; desiredSeat: number };
        };
        const plan = turn === 0 ? raw.exposedStrategy : context.exposedEvil?.plan;
        const expected =
          turn === 4
            ? 'fail'
            : turn === 1
              ? mode === 'direct'
                ? 'approve'
                : 'reject'
              : turn === 2
                ? mode === 'direct'
                  ? 'reject'
                  : 'approve'
                : mode === 'direct'
                  ? '2, 3, 6'
                  : '2, 4, 6';
        row.expectedChoice = expected;
        row.publicSpeech = reply.speech;
        row.privateReason = reply.privateReason;
        row.passed =
          row.choice === expected &&
          (turn === 0 ? raw.admitEvil === true : true) &&
          plan?.mode === mode &&
          plan.desiredSeat === 3 &&
          plan.promotedSeat === (mode === 'direct' ? 3 : 4);
        if (reply.speech) chat.push({ name: '1', text: reply.speech });
        console.log(`${mode} turn ${turn}: ${row.choice} ${row.passed ? 'PASS' : 'FAIL'}`);
        await writeFile(output, JSON.stringify(report(), null, 2));
      }
    } catch (error) {
      errors.push({ mode, message: error instanceof Error ? error.message : 'Sequence failed.' });
      await writeFile(output, JSON.stringify(report(), null, 2));
    }
  }
  process.exitCode = errors.length || results.length !== modes.length * 5 || results.some((r) => !r.passed) ? 1 : 0;
}
if (require.main === module)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
