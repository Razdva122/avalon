// What would the speaker say on logged turns? Replays each logged spoken decision through the pipeline with the
// decision call answered from the log (no model call) and every later call (speech and any rewrite) sent through the
// local Codex CLI, then prints the logged line next to the new one. Cheap: only the short calls run.
// Usage: speak-probe.ts [--limit=N] [--stage=discussion] [--role=merlin] [--shard=k/n] [--out=file.json] <game.json>
import type { BotRequest } from '../client';
import { buildCodexPrompt, codexSchema, runCodex } from '../codex';
import { callEffort } from '../codex-models';
import { decisionPipeline } from '../pipeline';
import { readFileSync, writeFileSync } from 'fs';
import { labParse } from './parse';

type Entry = {
  request?: BotRequest;
  stage?: string;
  choice?: string;
  speech?: string;
  privateReason?: string;
  role?: string;
};
const arg = (name: string) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const limit = Number(arg('limit') || 20);
const stage = arg('stage');
const role = arg('role');
// --shard=k/n runs every n-th sampled turn, for parallel processes; --out saves {file, trace, logged, now} as JSON.
const [shard, shards] = (arg('shard') || '0/1').split('/').map(Number);
const out = arg('out');
const reasoning = arg('reasoning') || 'medium';
process.env.AI_SPEAKER = 'on';

(async () => {
  const entries: { file: string; entry: Entry; trace: number }[] = [];
  const saved: { file: string; trace: number; logged?: string; now: string }[] = [];
  for (const file of process.argv.slice(2).filter((value) => !value.startsWith('--'))) {
    const log = JSON.parse(readFileSync(file, 'utf8')) as { trace: Entry[] };
    log.trace.forEach((entry, trace) => {
      if (
        entry.request?.speak &&
        entry.speech?.trim() &&
        entry.choice !== undefined &&
        (!stage || entry.stage === stage) &&
        (!role || entry.role === role)
      )
        entries.push({ file: file.split('/').pop()!, entry, trace });
    });
  }
  // Spread the sample over games and turns.
  const step = Math.max(1, Math.floor(entries.length / limit));
  const sample = entries.filter((_, index) => index % step === 0).slice(0, limit);
  for (const { file, entry, trace } of sample.filter((_, index) => index % shards === shard)) {
    const request = { ...entry.request!, humanMemory: undefined };
    const logged = Math.max(0, request.choices.indexOf(entry.choice!));
    let raw = '';
    const reply = await decisionPipeline(async (call, options, signal) => {
      if (options.phase === 'memory') return { choice: 0, speech: '', evidence: [] };
      if (['decision', 'decision-guard', 'decision-repair'].includes(options.phase || ''))
        return { choice: logged, speech: entry.privateReason || '', publicReason: entry.speech, evidence: [] };
      const built = buildCodexPrompt(options.instructions, options.context, options.cacheInstructions);
      const result = await runCodex(
        built.prompt,
        codexSchema(call.choices, Boolean(options.decisionDetails), false, call),
        signal,
        { model: 'gpt-6-luna', reasoning: callEffort(reasoning, options.weight, ['minimal', 'low', 'medium', 'high']) },
        built.instructions,
      );
      const parsed = labParse(result.text, call, Boolean(options.decisionDetails));
      if (options.phase === 'speech') raw = parsed.publicReason ?? '';
      else raw += ` [${options.phase}]`;
      return parsed;
    })(request).catch((error: Error) => ({ choice: -1, speech: `ERROR ${error.message}` }));
    const last = request.chat.slice(-3).map((m) => `${m.name}: ${m.text}`);
    console.log(`\n== ${file} ${entry.role} ${entry.stage}`);
    for (const line of last) console.log(`   | ${line.slice(0, 160)}`);
    console.log(`   logged: ${entry.speech}`);
    console.log(`   now:    ${reply.speech || '(passes)'}`);
    if (raw.trim() !== (reply.speech || '').trim()) console.log(`   speaker said: ${raw || '(nothing)'}`);
    saved.push({ file, trace, logged: entry.speech, now: reply.speech || '' });
    if (out) writeFileSync(out, JSON.stringify(saved, null, 1));
  }
})();
