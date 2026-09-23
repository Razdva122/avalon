// Explicit paid smoke test: run from packages/backend with ts-node and tsconfig-paths/register.
import '../init';
import { aiModel } from './models';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { AiRepository } from './repository';
import { yandexDecide } from './client';
import type { BotRequest } from './client';
import { decisionPipeline } from './pipeline';
import originalFixtures from './fixtures/control.json';
import postulates from './fixtures/postulates.json';
import lastGame from './fixtures/last-game.json';
import productionFixtures from './fixtures/production-regressions.json';
const productionRegression = process.argv.includes('--production-regressions');
const regression = process.argv.includes('--last-game');
const fixtures = productionRegression
  ? productionFixtures
  : regression
    ? lastGame
    : process.argv.includes('--postulates')
      ? postulates
      : originalFixtures;

async function main() {
  const selectedReasoning = process.argv.find((arg) => arg.startsWith('--reasoning='))?.split('=')[1];
  if (selectedReasoning && !['none', 'default'].includes(selectedReasoning)) throw Error('Invalid reasoning mode');
  const model = aiModel(process.argv.find((arg) => arg.startsWith('--model='))?.slice('--model='.length)).id;
  const budgetArg = process.argv.find((arg) => arg.startsWith('--budget-rub='))?.slice('--budget-rub='.length);
  const budgetRub = budgetArg === undefined ? undefined : Number(budgetArg);
  if (budgetRub !== undefined && (!Number.isFinite(budgetRub) || budgetRub <= 0 || budgetRub > 20))
    throw Error('Evaluation budget must be between 0 and 20 RUB');
  await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME, authSource: 'admin' });
  const caseName = process.argv.find((arg) => arg.startsWith('--case='))?.slice('--case='.length);
  const selectedFixtures = caseName ? fixtures.filter((fixture) => fixture.name === caseName) : fixtures;
  const repo = new AiRepository(
    mongoose.connection.db!,
    700,
    budgetRub ?? (productionRegression ? (caseName ? 5 : 20) : regression ? 8 : 15),
  );
  const id = `control-${randomUUID()}`;
  try {
    if (!selectedFixtures.length) throw Error('Unknown fixture');
    await repo.claim(id);
    for (const reasoning of (selectedReasoning
      ? [selectedReasoning]
      : !productionRegression && (regression || process.argv.includes('--postulates'))
        ? ['default']
        : ['none', 'default']) as ('none' | 'default')[]) {
      for (const fixture of selectedFixtures) {
        const request = fixture.request as unknown as BotRequest;
        const decide = decisionPipeline(
          (r, options, signal) => yandexDecide(id, repo, () => {}, { ...options, model })(r, signal),
          reasoning,
        );
        const started = Date.now();
        const before = await repo.roomCost(id);
        const reply = await decide(request);
        if ('expected' in fixture && request.choices[reply.choice] !== fixture.expected) process.exitCode = 1;
        console.log(
          JSON.stringify({
            roomID: id,
            model,
            fixture: fixture.name,
            reasoning,
            choice: request.choices[reply.choice],
            expected: 'expected' in fixture ? fixture.expected : undefined,
            passed: 'expected' in fixture ? request.choices[reply.choice] === fixture.expected : undefined,
            speech: reply.speech,
            seconds: (Date.now() - started) / 1000,
            rub: (await repo.roomCost(id)) - before,
          }),
        );
      }
    }
  } finally {
    await repo.release(id);
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
