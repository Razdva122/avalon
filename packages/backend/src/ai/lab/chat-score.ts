// Bot chat scorecard per build label (no API calls): line length, analyst jargon, "I" openers, generated-text
// typography and discussion passes, over every bot line of human-play logs.
// Usage: chat-score.ts <game.json> ...
import { readFileSync } from 'fs';

type Log = {
  summary: { bots?: string; humans: [number, string, string][] };
  chat: string[];
  trace: { stage?: string; speech?: string }[];
};
const JARGON =
  /\b(roster|lineup|baseline|clean (team|result|run|mission)|proven|core|data|information|concrete|track record|coalition|stop cycling|safest|fresh (pair|data|test)|next step)\b/i;
const groups: Record<
  string,
  {
    games: number;
    lines: number;
    chars: number;
    long: number;
    jargon: number;
    iOpen: number;
    typo: number;
    passes: number;
    turns: number;
  }
> = {};
for (const file of process.argv.slice(2)) {
  const log = JSON.parse(readFileSync(file, 'utf8')) as Log;
  const humans = new Set(log.summary.humans.map(([seat]) => String(seat)));
  const lines = log.chat
    .map((line) => [line.slice(0, line.indexOf(':')).split(' ')[0], line.slice(line.indexOf(':') + 1).trim()])
    .filter(
      ([seat, text]) => !humans.has(seat) && text && !/^(Evil council|I inspected|Checked \d with the Lady)/.test(text),
    );
  const discussion = log.trace.filter((entry) => entry.stage === 'discussion');
  const row = (groups[log.summary.bots || '?'] ??= {
    games: 0,
    lines: 0,
    chars: 0,
    long: 0,
    jargon: 0,
    iOpen: 0,
    typo: 0,
    passes: 0,
    turns: 0,
  });
  row.games++;
  row.turns += discussion.length;
  row.passes += discussion.filter((entry) => !entry.speech?.trim()).length;
  for (const [, text] of lines) {
    row.lines++;
    row.chars += text.length;
    if (text.length > 150) row.long++;
    if (JARGON.test(text)) row.jargon++;
    if (/^I\b/.test(text)) row.iOpen++;
    if (/[;—’“”]/.test(text)) row.typo++;
  }
}
const pct = (part: number, whole: number) => `${Math.round((100 * part) / Math.max(1, whole))}%`;
console.log('build    games  lines  avg chars  >150  jargon  starts "I"  typography  passes');
for (const [build, row] of Object.entries(groups).sort())
  console.log(
    [
      build.padEnd(8),
      String(row.games).padStart(5),
      String(row.lines).padStart(6),
      String(Math.round(row.chars / Math.max(1, row.lines))).padStart(10),
      pct(row.long, row.lines).padStart(5),
      pct(row.jargon, row.lines).padStart(7),
      pct(row.iOpen, row.lines).padStart(11),
      pct(row.typo, row.lines).padStart(11),
      pct(row.passes, row.turns).padStart(7),
    ].join(' '),
  );
