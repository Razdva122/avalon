/** Private operator report: run inside the backend with its existing environment. */
import mongoose from 'mongoose';
import { config } from '@/config';
import { SESSION_EXPERIMENT_VERSION } from '@/ai/repository';
import { sessionExperimentReport } from '@/ai/session-experiment-report';

async function main() {
  await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME, authSource: 'admin' });
  try {
    const collection = mongoose.connection.db!.collection('ai_session_experiments');
    const docs = await collection
      .find({ version: SESSION_EXPERIMENT_VERSION })
      .sort({ startedAt: 1 })
      .limit(10001)
      .toArray();
    if (docs.length > 10000) throw Error('Report exceeds 10000 games; restrict the date range before analysis.');
    console.log(
      JSON.stringify(
        sessionExperimentReport(docs as unknown as Parameters<typeof sessionExperimentReport>[0]),
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}
void main().catch(() => {
  console.error('Bot experiment report unavailable.');
  process.exitCode = 1;
});
