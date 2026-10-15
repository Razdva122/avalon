// Run from any directory: node <this file> [--run]. Default: measurement only.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
process.env.TS_NODE_PROJECT = path.join(root, 'packages/backend/tsconfig.json');
require(path.join(root, 'node_modules/ts-node')).register({
  project: path.join(root, 'packages/backend/tsconfig.json'),
  transpileOnly: true,
});
const { evaluateCase } = require(path.join(root, 'packages/backend/src/ai/evaluate-decisive-match'));
const { decisionInstructions } = require(path.join(root, 'packages/backend/src/ai/pipeline'));
const { claimInstructions } = require(path.join(root, 'packages/backend/src/ai/claims'));
const { runCodex } = require(path.join(root, 'packages/backend/src/ai/codex'));
const fixture = require(path.join(root, 'packages/backend/src/ai/fixtures/decisive-match.json'));
const before = require('./before-prompts.json');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const report = {
  repetitions: 2,
  maxGenerationCalls: 28,
  generationCalls: 0,
  measurements: [],
  results: [],
  errors: [],
};
const save = () => fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(report, null, 2) + '\n');

async function main() {
  const baselines = {};
  for (const entry of fixture.cases) {
    const original = before[entry.id];
    let instructions = original.prompt.slice(
      original.prompt.indexOf('\n') + 1,
      original.prompt.indexOf('\nUse claimMorgana=null'),
    );
    if (instructions.endsWith(claimInstructions)) instructions = instructions.slice(0, -claimInstructions.length);
    baselines[entry.id] = instructions;
    let captured;
    try {
      await evaluateCase(entry.id, 'after', async (prompt, schema, _signal, settings) => {
        captured = { prompt, schema, settings };
        throw new Error('capture only');
      });
    } catch (error) {
      if (!captured) throw error;
    }
    assert.deepEqual(captured.schema, original.schema);
    assert.deepEqual(captured.settings, original.settings);
    assert.equal(captured.prompt.split('GAME INPUT:\n')[1], original.prompt.split('GAME INPUT:\n')[1]);
    assert.equal(captured.prompt.replace(decisionInstructions(entry.request), instructions), original.prompt);
    report.measurements.push({
      id: entry.id,
      beforeChars: original.prompt.length,
      afterChars: captured.prompt.length,
      savedChars: original.prompt.length - captured.prompt.length,
      beforePromptHash: hash(original.prompt),
      afterPromptHash: hash(captured.prompt),
      identicalGameInputAndSchema: true,
    });
  }
  if (!process.argv.includes('--run')) {
    console.log(JSON.stringify(report.measurements, null, 2));
    return;
  }
  save();
  const jobs = [];
  for (let repetition = 1; repetition <= report.repetitions; repetition++) {
    for (const [index, entry] of fixture.cases.entries()) {
      // Alternate order to reduce a systematic warm-cache/order advantage.
      const variants = (index + repetition) % 2 ? ['before', 'after'] : ['after', 'before'];
      for (const variant of variants) jobs.push({ repetition, entry, variant });
    }
  }
  for (let offset = 0; offset < jobs.length; offset += 2) {
    await Promise.all(
      jobs.slice(offset, offset + 2).map(async ({ repetition, entry, variant }) => {
        const outputs = [];
        try {
          const result = await evaluateCase(entry.id, 'after', async (prompt, schema, signal, settings) => {
            if (report.generationCalls >= report.maxGenerationCalls) throw new Error('Generation-call budget reached');
            report.generationCalls++;
            if (variant === 'before') {
              const current = decisionInstructions(entry.request);
              assert.ok(prompt.includes(current), 'Current instructions missing from replay');
              prompt = prompt.replace(current, baselines[entry.id]);
            }
            const output = await runCodex(prompt, schema, signal, settings);
            outputs.push({ promptHash: hash(prompt), text: output.text, usage: output.usage });
            return output;
          });
          report.results.push({ ...result, variant, repetition, outputs });
          console.log(
            `${repetition} ${variant} ${entry.id}: ${result.passed ? 'target' : 'different'} (${result.generationCalls} calls)`,
          );
        } catch (error) {
          report.errors.push({ id: entry.id, variant, repetition, message: error.message, outputs });
          save();
          throw error;
        }
        save();
      }),
    );
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
