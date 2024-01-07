import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import CookieParser from 'cookie-parser';
import cors from 'cors';

import { backendPort, frontendURL } from '@/const';

import { Manager } from '@/main';

const app = express();
const server = createServer(app);
const corsOpts = {
  cors: {
    origin: frontendURL,
    credentials: true,
  },
};
const io = new Server(server, corsOpts);
const dirPath = join(__dirname, '../..', 'ui/dist/');

new Manager(io);

app.use(CookieParser());
app.use(cors(corsOpts.cors));
app.use(express.static(dirPath));

app.get('/', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

app.get('/room/*', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

server.listen(backendPort, () => {
  console.log(`server running at http://localhost:${backendPort}`);
});
