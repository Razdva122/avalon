import '@/init';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import CookieParser from 'cookie-parser';
import cors from 'cors';

import { backendPort, frontendURL } from '@/const';

import { connectDB, DBManager } from '@/db';

import { Manager } from '@/main';
import { ratingScheduler } from '@/scripts/scheduler';

const app = express();
const server = createServer(app);
const corsOpts = {
  cors: {
    origin: frontendURL,
    credentials: true,
  },
};
const io = new Server(server, corsOpts);

app.use(CookieParser());
app.use(cors(corsOpts.cors));

connectDB().then(async (mongoose) => {
  const dbManager = new DBManager(mongoose);
  new Manager(io, dbManager);

  // Start the rating scheduler (will initialize ratings if needed)
  await ratingScheduler.start();
  console.log('Rating system initialized and scheduler started');
});

server.listen(backendPort, () => {
  console.log(`server running at http://localhost:${backendPort}`);
});
