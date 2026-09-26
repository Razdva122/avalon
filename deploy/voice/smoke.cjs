#!/usr/bin/env node
// Real-server contract test. Requires a running backend, a real LiveKit server,
// two seated test accounts in the same voice-enabled room, and local Chromium.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { io } = require('socket.io-client');
const puppeteer = require('puppeteer');
const WebSocket = require('ws');

const roomID = process.env.VOICE_SMOKE_ROOM_ID;
const socketURL = process.env.VOICE_SMOKE_SOCKET_URL || 'http://127.0.0.1:3000';
const sdkPath = require.resolve('livekit-client');
const timeout = 15_000;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function openSocket(token) {
  const socket = io(socketURL, {
    transports: ['websocket'],
    reconnection: false,
    auth: token ? { token } : {},
    autoConnect: false,
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket.IO connection timed out')), timeout);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    socket.connect();
  });
  return socket;
}

async function login(prefix) {
  if (process.env[`${prefix}_TOKEN`]) return process.env[`${prefix}_TOKEN`];
  const loginName = required(`${prefix}_LOGIN`);
  const password = required(`${prefix}_PASSWORD`);
  const socket = await openSocket();
  try {
    const profile = await socket.timeout(timeout).emitWithAck('login', loginName, password);
    assert.equal(typeof profile?.token, 'string', `${prefix} login failed`);
    return profile.token;
  } finally {
    socket.disconnect();
  }
}

async function admittedSocket(token) {
  const socket = await openSocket(token);
  const room = await socket.timeout(timeout).emitWithAck('joinRoom', roomID);
  assert.ok(room && !room.error, `joinRoom failed: ${room?.error || 'empty response'}`);
  return socket;
}

async function admission(socket) {
  const response = await socket.timeout(timeout).emitWithAck('joinVoice', roomID);
  assert.ok(response && !response.error, `joinVoice failed: ${response?.error || 'empty response'}`);
  assert.equal(typeof response.url, 'string');
  assert.equal(typeof response.token, 'string');
  assert.equal(typeof response.sessionID, 'string');
  return response;
}

async function rawReplay(url, token) {
  const target = new URL('/rtc', url);
  target.searchParams.set('access_token', token);
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target);
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error('Replay handshake timed out'));
    }, timeout);
    ws.once('open', () => {
      clearTimeout(timer);
      ws.terminate();
      resolve(true);
    });
    ws.once('unexpected-response', (_request, response) => {
      clearTimeout(timer);
      response.resume();
      resolve(false);
    });
    ws.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function browserPage(browser, pageURL, admissionResult) {
  const page = await browser.newPage();
  await page.goto(pageURL);
  await page.evaluate(async ({ url, token }) => {
    const { Room, RoomEvent } = window.LivekitClient;
    const room = new Room();
    const seen = { audio: 0, video: 0, data: [] };
    room.on(RoomEvent.TrackSubscribed, (_track, publication) => {
      if (publication.kind === 'audio') seen.audio += 1;
      if (publication.kind === 'video') seen.video += 1;
    });
    room.on(RoomEvent.DataReceived, (payload) => seen.data.push(new TextDecoder().decode(payload)));
    window.smoke = { room, seen };
    await room.connect(url, token);
  }, admissionResult);
  return page;
}

async function main() {
  assert.ok(roomID, 'VOICE_SMOKE_ROOM_ID is required');
  const [tokenA, tokenB] = await Promise.all([login('VOICE_SMOKE_PLAYER_A'), login('VOICE_SMOKE_PLAYER_B')]);
  let socketA;
  let socketB;
  let browser;
  let server;
  try {
    socketA = await admittedSocket(tokenA);
    socketB = await admittedSocket(tokenB);
    const [a, b] = await Promise.all([admission(socketA), admission(socketB)]);
    assert.notEqual(a.sessionID, b.sessionID, 'Each account needs its own voice session');

    server = http.createServer((request, response) => {
      if (request.url === '/livekit.js') {
        response.setHeader('content-type', 'text/javascript; charset=utf-8');
        fs.createReadStream(sdkPath).pipe(response);
      } else {
        response.setHeader('content-type', 'text/html; charset=utf-8');
        response.end('<!doctype html><script src="/livekit.js"></script>');
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const pageURL = `http://127.0.0.1:${server.address().port}/`;
    browser = await puppeteer.launch({
      headless: true,
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    });
    const [pageA, pageB] = await Promise.all([browserPage(browser, pageURL, a), browserPage(browser, pageURL, b)]);

    await pageA.evaluate(() => window.smoke.room.localParticipant.setMicrophoneEnabled(true));
    await pageB.waitForFunction(() => window.smoke.seen.audio > 0, { timeout });
    console.log('PASS: two accounts joined; microphone audio reached the other participant');

    await pageA.evaluate(async () => {
      try {
        await window.smoke.room.localParticipant.setCameraEnabled(true);
      } catch (_) {
        /* server may reject */
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    assert.equal(await pageB.evaluate(() => window.smoke.seen.video), 0, 'Camera track reached the other participant');
    console.log('PASS: camera publishing did not reach the other participant');

    const marker = `voice-smoke-${Date.now()}`;
    await pageA.evaluate(async (value) => {
      try {
        await window.smoke.room.localParticipant.publishData(new TextEncoder().encode(value), { reliable: true });
      } catch (_) {
        /* server may reject */
      }
    }, marker);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    assert.equal(
      await pageB.evaluate((value) => window.smoke.seen.data.includes(value), marker),
      false,
      'Data packet reached the other participant',
    );
    console.log('PASS: data publishing did not reach the other participant');

    const left = await socketA.timeout(timeout).emitWithAck('leaveVoice', a.sessionID);
    assert.ok(left === true || (left && !left.error), `leaveVoice failed: ${left?.error}`);
    await pageA.waitForFunction(() => window.smoke.room.state === 'disconnected', { timeout });
    assert.equal(await rawReplay(a.url, a.token), false, 'Revoked LiveKit token was accepted by gateway');
    assert.equal(await pageB.evaluate(() => window.smoke.room.state), 'connected', 'Other participant lost connection');
    console.log('PASS: revocation closed media and blocked replay of the old token');
  } finally {
    if (browser) await browser.close();
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
