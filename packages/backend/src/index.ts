import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import crypto from 'crypto';

const app = express();
const server = createServer(app);
const io = new Server(server);
const dirPath = join(__dirname, '../..', 'ui/dist/');

app.use(express.static(dirPath));

app.get('/', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

app.get('/room/*', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

app.get('/api/create_room', function (req, res) {
  res.send(crypto.randomUUID());
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.handshake.headers.cookie);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
