// Writes an earlier version's pipeline.ts and client.ts to a directory for cross-play.ts, with relative imports
// pointed back at the current shared modules. Only those two runtime files changed since the original AI.
// Usage: make-baseline.ts <commit> <out-dir>
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const [commit, out] = process.argv.slice(2);
if (!commit || !out) throw Error('usage: make-baseline.ts <commit> <out-dir>');
const shared = resolve(__dirname, '..');
mkdirSync(out, { recursive: true });
for (const name of ['pipeline', 'client']) {
  const source = execFileSync('git', ['show', `${commit}:packages/backend/src/ai/${name}.ts`], { encoding: 'utf8' });
  const rewritten = source.replace(/(from ')\.\/([\w-]+)(')/g, (_, from, file, quote) =>
    file === 'client' ? `${from}./client${quote}` : `${from}${join(shared, file)}${quote}`,
  );
  writeFileSync(join(out, `${name}.ts`), rewritten);
}
console.log(`wrote ${out}/pipeline.ts and client.ts from ${commit}`);
