// Rank of the real Merlin in merlinCandidates at every logged assassination, and what the assassination guard makes
// of each logged shot (no API calls):
// assassin-eval.ts <game.json> [<game.json> ...]
import { readFileSync } from 'fs';
import { buildAnalysis } from '../analysis';
import type { BotRequest } from '../client';
import { guardDecision } from '../guards';

let top = 0;
let games = 0;
let logLoss = 0;
let shots = 0;
let guarded = 0;
for (const file of process.argv.slice(2)) {
  const log = JSON.parse(readFileSync(file, 'utf8')) as {
    trace: { request?: BotRequest; stage?: string; choice?: string }[];
    summary: { roles: [number, string][] };
  };
  const merlin = log.summary.roles.find(([, role]) => role === 'merlin')?.[0];
  const entry = log.trace.find((item) => item.stage === 'assassinate' && item.request && item.choice !== undefined);
  if (!entry || merlin === undefined) continue;
  const candidates = (buildAnalysis(entry.request!)?.merlinCandidates || []) as {
    seat: number;
    merlinChance: number;
  }[];
  const rank = candidates.findIndex((candidate) => candidate.seat === merlin) + 1;
  const chance = candidates.find((candidate) => candidate.seat === merlin)?.merlinChance ?? 0;
  const shot = guardDecision(entry.request!, entry.choice!)?.choice ?? entry.choice!;
  games++;
  if (rank === 1) top++;
  if (Number(entry.choice) === merlin) shots++;
  if (Number(shot) === merlin) guarded++;
  logLoss -= Math.log(Math.max(0.01, chance / 100));
  console.log(
    `${file.split('/').pop()} merlin=${merlin} rank ${rank}/${candidates.length} shot ${entry.choice}` +
      (shot === entry.choice ? '' : ` -> guard ${shot}`),
    candidates.map((candidate) => `${candidate.seat}:${candidate.merlinChance}`).join(' '),
  );
}
console.log(`top-1 ${top}/${games}; mean log loss ${(logLoss / games).toFixed(3)}`);
console.log(`logged shots hit ${shots}/${games}; after the guard ${guarded}/${games}`);
