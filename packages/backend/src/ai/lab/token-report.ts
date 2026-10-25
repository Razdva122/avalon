// Token usage of logged lab games (human-play.ts output) per build: per game, per bot turn and per call phase.
// Usage: npx ts-node --transpile-only src/ai/lab/token-report.ts /tmp/game-*.json
import { readFileSync } from 'fs';

type Call = {
  phase: string;
  usage?: { input_tokens?: number; output_tokens?: number; reasoning_output_tokens?: number };
};
type Total = { calls: number; input: number; output: number; reasoning: number };
const empty = (): Total => ({ calls: 0, input: 0, output: 0, reasoning: 0 });
const builds = new Map<string, { games: number; turns: number; total: Total; phases: Map<string, Total> }>();
for (const file of process.argv.slice(2)) {
  const { summary } = JSON.parse(readFileSync(file, 'utf8')) as {
    summary: { bots: string; decisions: number; calls?: Call[] };
  };
  const build = builds.get(summary.bots) ?? { games: 0, turns: 0, total: empty(), phases: new Map() };
  builds.set(summary.bots, build);
  build.games++;
  build.turns += summary.decisions;
  for (const call of summary.calls || []) {
    const phase = build.phases.get(call.phase) ?? empty();
    build.phases.set(call.phase, phase);
    for (const total of [phase, build.total]) {
      total.calls++;
      total.input += call.usage?.input_tokens || 0;
      total.output += call.usage?.output_tokens || 0;
      total.reasoning += call.usage?.reasoning_output_tokens || 0;
    }
  }
}
const k = (tokens: number) => `${(tokens / 1000).toFixed(1)}k`;
for (const [name, { games, turns, total, phases }] of builds) {
  const all = total.input + total.output;
  console.log(
    `${name}: ${games} games, ${k(all / games)} tokens per game (${k(total.output / games)} output, ` +
      `${k(total.reasoning / games)} of it reasoning), ${k(all / turns)} per bot turn, ${(total.calls / turns).toFixed(2)} calls per bot turn`,
  );
  for (const [phase, t] of [...phases].sort((a, b) => b[1].input - a[1].input))
    console.log(
      `  ${phase.padEnd(15)} ${String(t.calls).padStart(4)} calls, ${k(t.input / t.calls)} in and ` +
        `${Math.round(t.output / t.calls)} out per call, ${Math.round((100 * (t.input + t.output)) / all)}%`,
    );
}
