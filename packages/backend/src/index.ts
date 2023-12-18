import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';

const app = express();
const server = createServer(app);
const dirPath = join(__dirname, '../..', 'ui/dist/');

app.use(express.static(dirPath));

app.get('/', function (req, res) {
  res.sendFile(dirPath + 'index.html');
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
