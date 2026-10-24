import { readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { opportunityCases, additionalOpportunityCases } from './fixtures/winning-opportunity';
import { buildCodexPrompt, runCodex, codexSchema } from './codex';
import { decisionInstructions } from './pipeline';
import type { BotRequest } from './client';

const settings = { model: 'gpt-6.1-sol', reasoning: 'medium' } as const;
const assessment =
  '\nFor this offline behavioral test, return the schema JSON. Classify every seat once into good, evil or unresolved using your private knowledge and deductions you will actually act on. Resolve Merlin/Morgana only if justified; otherwise use null. Then choose the Lady target. Give a short private reason. These assessment fields are private and are not published to players.';
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

async function main() {
  const snapshot = arg('snapshot')!;
  const output = arg('output')!;
  if (!snapshot || !output) throw new Error('Required: --snapshot=<prompt-file> --output=<report-file>');
  const suite = arg('suite') ?? 'original';
  if (!['original', 'additional'].includes(suite)) throw new Error('Use --suite=original|additional.');
  const cases = (suite === 'additional' ? additionalOpportunityCases() : opportunityCases()).filter(
    (c) => !arg('case') || c.id === arg('case'),
  );
  if (!cases.length) throw new Error('Unknown evaluation case.');
  const request = {
    state: { stage: 'checkLoyalty', players: [{ id: '2', role: 'percival' }] },
    playerID: '2',
    language: 'ru',
    speak: true,
  } as unknown as BotRequest;
  const current = decisionInstructions(request);
  if (process.argv.includes('--save-baseline')) await writeFile(snapshot, current);
  const variant = arg('variant') ?? 'after';
  const instructions = variant === 'before' ? await readFile(snapshot, 'utf8') : current;
  const results: { passed: boolean; [key: string]: unknown }[] = [];
  const report = () => ({
    variant,
    suite,
    model: settings,
    instructions,
    promptHash: createHash('sha256').update(instructions).digest('hex'),
    expectedCases: cases.length,
    completed: results.length,
    passed: results.filter((r) => r.passed).length,
    limitation:
      'One sample per position; explicit private assessment probes deductions. Separate real-position replay checks the normal production output schema.',
    results,
  });
  if (!process.argv.includes('--run')) {
    console.log(
      JSON.stringify({ dryRun: true, cases: cases.map((c) => ({ id: c.id, expected: c.expected })), model: settings }),
    );
    return;
  }
  for (const entry of cases) {
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        choice: { type: 'string', enum: entry.context.choices },
        good: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 7 } },
        evil: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 7 } },
        unresolved: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 7 } },
        merlin: { type: ['integer', 'null'] },
        morgana: { type: ['integer', 'null'] },
        speech: { type: 'string', maxLength: 1400 },
      },
      required: ['choice', 'good', 'evil', 'unresolved', 'merlin', 'morgana', 'speech'],
    };
    const prompt = buildCodexPrompt(instructions + assessment, entry.context);
    const started = Date.now();
    const response = await runCodex(
      prompt.prompt,
      schema as ReturnType<typeof codexSchema>,
      undefined,
      settings,
      prompt.instructions,
    );
    const actual = JSON.parse(response.text);
    const mismatches = Object.entries(entry.expected)
      .filter(([key, want]) => {
        const got = actual[key];
        return Array.isArray(want)
          ? !Array.isArray(got) || JSON.stringify([...got].sort()) !== JSON.stringify([...want].sort())
          : got !== want;
      })
      .map(([key]) => key);
    results.push({
      id: entry.id,
      context: entry.context,
      passed: !mismatches.length,
      mismatches,
      expected: entry.expected,
      actual,
      usage: response.usage,
      elapsedMs: Date.now() - started,
    });
    await writeFile(output, JSON.stringify(report(), null, 2) + '\n');
    console.log(`${variant} ${entry.id}: ${mismatches.length ? 'FAIL ' + mismatches.join(', ') : 'PASS'}`);
  }
  process.exitCode = variant === 'after' && results.some((r) => !r.passed) ? 1 : 0;
}
if (require.main === module)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
