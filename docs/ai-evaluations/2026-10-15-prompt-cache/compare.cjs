// node <this file> [--run]. Default: capture/hash checks only; no inference.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
process.env.TS_NODE_PROJECT = path.join(root, 'packages/backend/tsconfig.json');
require(path.join(root, 'node_modules/ts-node')).register({
  project: process.env.TS_NODE_PROJECT,
  transpileOnly: true,
});
const { evaluateCase } = require(path.join(root, 'packages/backend/src/ai/evaluate-decisive-match'));
const { runCodex } = require(path.join(root, 'packages/backend/src/ai/codex'));
const fixture = require(path.join(root, 'packages/backend/src/ai/fixtures/decisive-match.json'));
const hash = (text) => createHash('sha256').update(text).digest('hex');
const report = {
  repetitions: 1,
  maxGenerationCalls: 16,
  generationCalls: 0,
  measurements: [],
  results: [],
  errors: [],
};
const save = () => fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(report, null, 2) + '\n');

async function main() {
  for (const entry of fixture.cases) {
    let captured;
    try {
      await evaluateCase(entry.id, 'after', async (prompt, schema, _signal, settings, instructions) => {
        assert.ok(instructions && prompt.startsWith(instructions));
        const gameStart = prompt.indexOf('\nGAME INPUT:\n');
        assert.ok(gameStart >= instructions.length);
        assert.equal(
          prompt.slice(gameStart),
          '\nGAME INPUT:\n' + JSON.stringify(JSON.parse(prompt.slice(gameStart + '\nGAME INPUT:\n'.length))),
        );
        captured = {
          id: entry.id,
          promptHash: hash(prompt),
          instructionHash: hash(instructions),
          schemaHash: hash(JSON.stringify(schema)),
          settings,
        };
        throw new Error('capture only');
      });
    } catch (error) {
      if (!captured) throw error;
    }
    report.measurements.push(captured);
  }
  if (!process.argv.includes('--run')) {
    console.log(JSON.stringify(report.measurements, null, 2));
    return;
  }
  save();
  const jobs = [];
  for (let repetition = 1; repetition <= report.repetitions; repetition++) {
    for (const [index, entry] of fixture.cases.entries()) {
      for (const variant of (index + repetition) % 2 ? ['before', 'after'] : ['after', 'before'])
        jobs.push({ repetition, entry, variant });
    }
  }
  for (let offset = 0; offset < jobs.length; offset += 2) {
    await Promise.all(
      jobs.slice(offset, offset + 2).map(async ({ repetition, entry, variant }) => {
        const calls = [];
        try {
          const result = await evaluateCase(
            entry.id,
            'after',
            async (prompt, schema, signal, settings, instructions) => {
              assert.ok(prompt.startsWith(instructions));
              if (report.generationCalls >= report.maxGenerationCalls)
                throw new Error('Generation-call budget reached');
              report.generationCalls++;
              const result = await runCodex(
                prompt,
                schema,
                signal,
                settings,
                variant === 'after' ? instructions : undefined,
              );
              calls.push({
                promptHash: hash(prompt),
                instructionHash: hash(instructions),
                usage: result.usage,
                text: result.text,
              });
              return result;
            },
          );
          assert.equal(calls[0].promptHash, report.measurements.find((x) => x.id === entry.id).promptHash);
          report.results.push({ ...result, variant, repetition, calls });
          console.log(
            `${repetition} ${variant} ${entry.id}: ${result.passed ? 'target' : 'different'}, cached=${result.usages.reduce((n, u) => n + (u.cached_input_tokens || 0), 0)}`,
          );
        } catch (error) {
          report.errors.push({ id: entry.id, variant, repetition, message: error.message, calls });
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
