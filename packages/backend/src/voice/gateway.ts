import { createServer, IncomingMessage } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

interface Admission {
  healthy?(): boolean;
  admit(token: string): Promise<string>;
  attach(id: string, close: () => void): () => void;
  limit(key: string, max?: number): void;
}
const routes = new Set(['/rtc', '/rtc/validate', '/rtc/v1', '/rtc/v1/validate']);
export function createVoiceGateway(internalUrl: string, admission: Admission) {
  const upstream = new URL(internalUrl);
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024, perMessageDeflate: false });
  async function authorize(req: IncomingMessage) {
    const url = new URL(req.url || '/', 'http://gateway');
    if (!routes.has(url.pathname)) throw Error('notFound');
    if (req.method !== 'GET' || url.searchParams.has('publish')) throw Error('forbidden');
    const values = url.searchParams.getAll('access_token');
    const header = req.headers.authorization;
    if (values.length > 1 || (values.length && header)) throw Error('forbidden');
    const token = values[0] || (header?.startsWith('Bearer ') ? header.slice(7) : '');
    const id = await admission.admit(token);
    admission.limit(`gateway-session:${id}`, 120);
    url.searchParams.set('access_token', token);
    return { id, url: new URL(url.pathname + url.search, upstream) };
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    // Private media-VM watchdog endpoint; never expose through public TLS proxy.
    if (req.method === 'GET' && req.url === '/health/voice') {
      res.writeHead(admission.healthy?.() ? 204 : 503).end();
      return;
    }
    try {
      const { id, url } = await authorize(req);
      if (!url.pathname.endsWith('/validate')) {
        res.writeHead(404).end();
        return;
      }
      const abort = new AbortController();
      const detach = admission.attach(id, () => {
        abort.abort();
        res.destroy();
      });
      const timer = setTimeout(() => abort.abort(), 5000);
      try {
        const response = await fetch(url, { signal: abort.signal, redirect: 'error' });
        res.writeHead(response.status, { 'Content-Type': 'text/plain' });
        // Never relay upstream diagnostics or request tokens to clients.
        res.end(response.ok ? 'success' : 'Connection rejected');
      } finally {
        clearTimeout(timer);
        detach();
      }
    } catch (error) {
      if (!res.destroyed) res.writeHead(error instanceof Error && error.message === 'notFound' ? 404 : 403).end();
    }
  });
  server.on('upgrade', (req, socket, head) => {
    let remote: WebSocket | undefined;
    let local: WebSocket | undefined;
    let detach = () => {};
    const close = () => {
      detach();
      socket.destroy();
      if (remote && remote.readyState !== WebSocket.CLOSED) remote.terminate();
      if (local && local.readyState !== WebSocket.CLOSED) local.terminate();
    };
    socket.on('error', close);
    socket.on('close', close);
    void authorize(req)
      .then(({ id, url }) => {
        if (socket.destroyed) return;
        if (url.pathname.endsWith('/validate')) throw Error('forbidden');
        detach = admission.attach(id, close);
        if (socket.destroyed) {
          detach();
          return;
        }
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        remote = new WebSocket(url, {
          handshakeTimeout: 5000,
          maxPayload: 1024 * 1024,
          perMessageDeflate: false,
          followRedirects: false,
        });
        remote.on('error', close);
        remote.on('close', close);
        remote.on('open', () => {
          if (socket.destroyed || remote?.readyState !== WebSocket.OPEN) {
            close();
            return;
          }
          sockets.handleUpgrade(req, socket, head, (client) => {
            local = client;
            client.on('error', close);
            client.on('close', close);
            client.on('message', (data, binary) => {
              if (remote?.readyState !== WebSocket.OPEN || remote.bufferedAmount > 4 * 1024 * 1024) {
                close();
                return;
              }
              remote.send(data, { binary });
            });
          });
        });
        remote.on('message', (data, binary) => {
          if (local?.readyState !== WebSocket.OPEN || local.bufferedAmount > 4 * 1024 * 1024) {
            close();
            return;
          }
          local.send(data, { binary });
        });
      })
      .catch(() => {
        if (!socket.destroyed) socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        close();
      });
  });
  server.on('close', () => {
    sockets.clients.forEach((socket) => socket.terminate());
    sockets.close();
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 10000;
  return server;
}
