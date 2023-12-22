import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import crypto from 'crypto';
import CookieParser from 'cookie-parser';
import cors from 'cors';

import { Manager } from '@/main';
import { User } from '@/user';

const app = express();
const server = createServer(app);
const corsOpts = {
  cors: {
    origin: '*',
  },
};
const io = new Server(server, corsOpts);
const dirPath = join(__dirname, '../..', 'ui/dist/');

const manager = new Manager(io);

app.use(CookieParser());
app.use(cors(corsOpts.cors));
app.use(express.static(dirPath));

app.get('/', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

app.get('/room/*', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

app.get('/api/create_room', function (req, res) {
  const uuid = crypto.randomUUID();
  manager.createRoom(uuid, new User(req.cookies['user_id'], req.cookies['user_name']));
  res.send(uuid);
});

app.get('/api/check_room/:uuid', function (req, res) {
  res.send(manager.isRoomExist(req.params.uuid));
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
