import { writeFile } from 'fs/promises';
import fixture from './fixtures/decisive-match.json';
import { buildCodexPrompt, codexSchema, runCodex } from './codex';
import type { CodexRunner } from './codex';
import { AiTechnicalPause, parseDecisionReply } from './client';
import type { BotRequest } from './client';
import { decisionPipeline } from './pipeline';

type Variant = 'before' | 'after';
const settings = { model: 'gpt-6.1-sol', reasoning: 'medium' } as const;

export async function evaluateCase(id: string, variant: Variant, runner: CodexRunner = runCodex) {
  const entry = fixture.cases.find((item) => item.id === id);
  if (!entry) throw new Error(`Unknown saved position: ${id}`);
  const request = structuredClone(entry.request) as unknown as BotRequest;
  const usages: Awaited<ReturnType<CodexRunner>>['usage'][] = [];
  const decide = decisionPipeline(async (input, options, signal) => {
    const context =
      variant === 'before'
        ? entry.original.context
        : {
            ...(options.context as Record<string, unknown>),
            previousDecisions: entry.original.context.previousDecisions,
            modelHypotheses: entry.original.context.modelHypotheses,
          };
    const instructions =
      variant === 'before'
        ? fixture.baselineInstructions[entry.original.instructions as keyof typeof fixture.baselineInstructions]
        : options.instructions;
    const built = buildCodexPrompt(instructions, context, variant === 'after' ? options.cacheInstructions : undefined);
    const result = await runner(
      built.prompt,
      codexSchema(input.choices, true, false, input),
      signal,
      settings,
      built.instructions,
    );
    usages.push(result.usage);
    return parseDecisionReply(result.text, input.choices, input);
  });
  const started = Date.now();
  const reply = await decide(request);
  const choice = request.choices[reply.choice];
  return {
    id,
    variant,
    seat: Number(request.playerID),
    mission: request.state.mission + 1,
    stage: request.state.stage,
    publicDiscussion: Boolean(request.publicDiscussion),
    strict: entry.strict,
    expectedChoice: entry.expectedChoice,
    choice,
    passed: choice === entry.expectedChoice,
    privateReason: reply.privateReason,
    publicReason: reply.speech,
    originalChoice: entry.original.choice,
    originalPrivateReason: entry.original.privateReason,
    generationCalls: usages.length,
    usages,
    elapsedMs: Date.now() - started,
  };
}

export function evaluationOutcome(
  results: readonly Pick<Awaited<ReturnType<typeof evaluateCase>>, 'variant' | 'strict' | 'passed'>[],
  expectedCases: number,
  errorCount: number,
) {
  const complete = results.length === expectedCases;
  const failedTargets = results.filter(
    (result) => result.variant === 'after' && result.strict && !result.passed,
  ).length;
  return { expectedCases, complete, failedTargets, exitCode: complete && !errorCount && !failedTargets ? 0 : 1 };
}

async function main() {
  const args = process.argv.slice(2);
  const selectedID = args.find((arg) => arg.startsWith('--case='))?.slice('--case='.length);
  const variantArg = args.find((arg) => arg.startsWith('--variant='))?.slice('--variant='.length) ?? 'after';
  if (!['before', 'after', 'both'].includes(variantArg)) throw new Error('Use --variant=before|after|both.');
  const entries = fixture.cases.filter((entry) => !selectedID || entry.id === selectedID);
  if (!entries.length) throw new Error(`Unknown saved position: ${selectedID}`);
  const variants: Variant[] = variantArg === 'both' ? ['before', 'after'] : [variantArg as Variant];
  const expectedCases = entries.length * variants.length;
  if (!args.includes('--run')) {
    process.stdout.write(
      JSON.stringify(
        {
          dryRun: true,
          model: settings,
          maxGenerationCalls: 12,
          expectedCases,
          variants,
          cases: entries.map(({ id, strict, expectedChoice, original }) => ({
            id,
            strict,
            expectedChoice,
            originalChoice: original.choice,
          })),
          invocation: 'Add --run to request inference; optional --case=<id>, --variant=both, --output=<path>.',
        },
        null,
        2,
      ) + '\n',
    );
    return;
  }
  let calls = 0;
  const runner: CodexRunner = async (...params) => {
    if (calls >= 12) throw new AiTechnicalPause('Evaluation generation-call limit reached.');
    calls++;
    return runCodex(...params);
  };
  const results: Awaited<ReturnType<typeof evaluateCase>>[] = [];
  const errors: { id: string; variant: Variant; message: string }[] = [];
  const report = () => ({
    ...evaluationOutcome(results, expectedCases, errors.length),
    model: settings,
    maxGenerationCalls: 12,
    generationCalls: calls,
    summaries: variants.map((variant) => {
      const scored = results.filter((result) => result.variant === variant && result.strict);
      return { variant, passed: scored.filter((result) => result.passed).length, scored: scored.length };
    }),
    results,
    errors,
    limitation:
      'One sample per saved position. Targets evaluate strategic choices, not guaranteed outcomes or overall playing strength. Provider transport retries follow runCodex behavior.',
  });
  const output = args.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);
  for (const variant of variants) {
    for (const entry of entries) {
      try {
        const result = await evaluateCase(entry.id, variant, runner);
        results.push(result);
        process.stderr.write(`${variant} ${entry.id}: ${result.choice} (${result.passed ? 'target' : 'different'})\n`);
      } catch (error) {
        errors.push({ id: entry.id, variant, message: error instanceof Error ? error.message : 'Evaluation failed.' });
      }
      if (output) await writeFile(output, JSON.stringify(report(), null, 2) + '\n');
      if (errors.length || calls >= 12) break;
    }
    if (errors.length || calls >= 12) break;
  }
  process.stdout.write(JSON.stringify(report(), null, 2) + '\n');
  process.exitCode = evaluationOutcome(results, expectedCases, errors.length).exitCode;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write((error instanceof Error ? error.message : 'Evaluation failed.') + '\n');
    process.exitCode = 1;
  });
}
