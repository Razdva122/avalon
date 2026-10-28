// Plays one human seat of human-play.ts from a shell. `wait` prints the current turn; `answer` submits a JSON answer
// (argument or stdin) and prints the next turn. Both wait at most 100 seconds, under a shell tool's usual timeout.
// Usage: node --no-warnings src/ai/lab/seat.ts <mailbox>/<human-id> wait
//        node --no-warnings src/ai/lab/seat.ts <mailbox>/<human-id> answer <turn> '{"vote":"approve"}'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';

type Turn = { n: number; kind?: string; text: string; done?: boolean };

const [dir, command, number, inline] = process.argv.slice(2);
const read = (): Turn | undefined => {
  try {
    return JSON.parse(readFileSync(join(dir, 'turn.json'), 'utf8')) as Turn;
  } catch {
    return undefined;
  }
};
const answered = () => (existsSync(join(dir, 'answered')) ? Number(readFileSync(join(dir, 'answered'), 'utf8')) : 0);

async function next(after: number) {
  const until = Date.now() + 100000;
  while (Date.now() < until) {
    const turn = read();
    if (turn && (turn.n > after || turn.done)) {
      console.log(turn.done ? turn.text : `TURN ${turn.n} (${turn.kind})\n${turn.text}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log('No new turn yet: other players are still deciding. Run the wait command again.');
}

async function main() {
  if (!dir || !['wait', 'answer'].includes(command))
    throw Error('usage: seat.ts <seat-dir> wait | answer <turn> <json>');
  if (command === 'wait') return next(answered());
  const n = Number(number);
  const current = read();
  if (!current || current.n !== n || current.done) {
    console.log(`Turn ${n} is not the current turn. Showing the current one instead.`);
    return next(answered());
  }
  const text = inline ?? readFileSync(0, 'utf8');
  try {
    JSON.parse(text);
  } catch {
    console.log('That answer is not valid JSON; nothing was sent. Fix it and answer the same turn again.');
    return;
  }
  const file = join(dir, `answer-${n}.json`);
  writeFileSync(`${file}.tmp`, text);
  renameSync(`${file}.tmp`, file);
  writeFileSync(join(dir, 'answered'), String(n));
  return next(n);
}

main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
