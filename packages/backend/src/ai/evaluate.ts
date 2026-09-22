// Explicit paid smoke test: run from packages/backend with ts-node and tsconfig-paths/register.
import '../init';
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
const regression = process.argv.includes('--last-game');
const fixtures = regression ? lastGame : process.argv.includes('--postulates') ? postulates : originalFixtures;

async function main() {
  await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME, authSource: 'admin' });
  const repo = new AiRepository(mongoose.connection.db!, 700, regression ? 8 : 15);
  const id = `control-${randomUUID()}`;
  try {
    await repo.claim(id);
    for (const reasoning of (regression || process.argv.includes('--postulates')
      ? ['default']
      : ['none', 'default']) as ('none' | 'default')[]) {
      for (const fixture of fixtures) {
        const request = fixture.request as unknown as BotRequest;
        const decide = decisionPipeline(
          (r, options, signal) => yandexDecide(id, repo, () => {}, options)(r, signal),
          reasoning,
        );
        const started = Date.now();
        const before = await repo.roomCost(id);
        const reply = await decide(request);
        if ('expected' in fixture && request.choices[reply.choice] !== fixture.expected) process.exitCode = 1;
        console.log(
          JSON.stringify({
            roomID: id,
            fixture: fixture.name,
            reasoning,
            choice: request.choices[reply.choice],
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
