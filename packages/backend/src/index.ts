import '@/init';
import { startVoiceGateway } from '@/voice/runtime';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import CookieParser from 'cookie-parser';
import cors from 'cors';

import { backendPort, frontendOrigin } from '@/const';

import { connectDB, DBManager } from '@/db';

import { Manager } from '@/main';
import { supportRouter } from '@/support/routes';
import { directSupport } from '@/support/direct/service';
import { startSupportWorker } from '@/support/direct/worker';
import { supportOrderModel } from '@/support/repository';
import { ratingScheduler } from '@/scripts/scheduler';
import { userProfileModel } from '@/db/models';
import { mailConfig } from '@/recovery/config';
import { MongoRecoveryRepository } from '@/recovery/repository';
import { RecoveryService } from '@/recovery/service';
import { smtpSender } from '@/recovery/mail';
import { createRecoveryRouter } from '@/recovery/routes';
import { startMailWorker } from '@/recovery/worker';
import { revokeUserSockets } from '@/user/sessions';

const app = express();
// Only explicit proxy IPs/CIDRs; never trust arbitrary client forwarding headers.
if (process.env.TRUSTED_PROXY_CIDRS)
  app.set(
    'trust proxy',
    process.env.TRUSTED_PROXY_CIDRS.split(',').map((s) => s.trim()),
  );
const mailSettings = mailConfig();
const server = createServer(app);
const corsOpts = {
  cors: {
    origin: frontendOrigin,
    credentials: true,
  },
};
const io = new Server(server, corsOpts);

app.use(CookieParser());
app.use(cors(corsOpts.cors));

connectDB().then(async (mongoose) => {
  await supportOrderModel.init();
  startSupportWorker(directSupport);
  app.use('/api/support', supportRouter);
  let recovery: RecoveryService | null = null;
  if (mailSettings && mongoose?.connection.db) {
    const repository = new MongoRecoveryRepository(mongoose.connection.db, userProfileModel.collection.name);
    await repository.init();
    recovery = new RecoveryService(repository, mailSettings, smtpSender(mailSettings));
    startMailWorker(recovery);
  }
  app.use(
    '/api/auth',
    createRecoveryRouter(recovery, (id) => revokeUserSockets(io, id)),
  );
  const dbManager = new DBManager(mongoose);
  const manager = new Manager(io, dbManager);
  startVoiceGateway(manager.voice);

  // Start the rating scheduler (will initialize ratings if needed)
  await ratingScheduler.start();
  console.log('Rating system initialized and scheduler started');
});

server.listen(backendPort, () => {
  console.log(`server running at http://localhost:${backendPort}`);
});
