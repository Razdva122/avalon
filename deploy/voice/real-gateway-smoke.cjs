#!/usr/bin/env node
// Exercises the actual LiveKit server, SDK, gateway and VoiceService without DB.
// Start LiveKit first, then set LIVEKIT_TEST_INTERNAL_URL/API_KEY/API_SECRET.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const puppeteer = require('puppeteer');
const WebSocket = require('ws');
const { AccessToken, RoomServiceClient, TrackSource } = require('livekit-server-sdk');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node' } });
const { VoiceService } = require('../../packages/backend/src/voice/service.ts');
const { createVoiceGateway } = require('../../packages/backend/src/voice/gateway.ts');
const { VoiceStartup } = require('../../packages/backend/src/voice/startup.ts');

const internalUrl = process.env.LIVEKIT_TEST_INTERNAL_URL || 'http://127.0.0.1:17880';
const apiKey = process.env.LIVEKIT_TEST_API_KEY || 'testkey';
const apiSecret = process.env.LIVEKIT_TEST_API_SECRET || 'testsecret0123456789testsecret0123456789';
const sdkPath = require.resolve('livekit-client');
const roomID = 'voice-fixture-room';
const timeout = 15_000;

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function replay(url, token) {
  const target = new URL('/rtc', url);
  target.searchParams.set('access_token', token);
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target, { handshakeTimeout: timeout });
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error('Gateway replay timed out'));
    }, timeout);
    ws.once('open', () => {
      clearTimeout(timer);
      ws.terminate();
      resolve(true);
    });
    ws.once('unexpected-response', (_req, response) => {
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

async function connectPage(browser, pageURL, admission) {
  const page = await browser.newPage();
  await page.goto(pageURL);
  await page.evaluate(async ({ url, token }) => {
    const { Room, RoomEvent } = window.LivekitClient;
    const room = new Room();
    const seen = { audio: 0, audioEnded: 0, video: 0, data: [] };
    room.on(RoomEvent.TrackSubscribed, (_track, publication) => {
      if (publication.kind === 'audio') seen.audio++;
      if (publication.kind === 'video') seen.video++;
    });
    room.on(RoomEvent.TrackUnsubscribed, (_track, publication) => {
      if (publication.kind === 'audio') seen.audioEnded++;
    });
    room.on(RoomEvent.DataReceived, (bytes) => seen.data.push(new TextDecoder().decode(bytes)));
    window.smoke = { room, seen };
    await room.connect(url, token);
  }, admission);
  return page;
}

async function main() {
  const api = new RoomServiceClient(internalUrl, apiKey, apiSecret);
  const config = { apiKey, apiSecret, internalUrl, publicUrl: '', gatewayHost: '127.0.0.1', gatewayPort: 0 };
  const policy = new Map([
    ['alice', { present: true, seated: true, admin: false, leader: true }],
    ['bob', { present: true, seated: true, admin: false, leader: false }],
    ['spectator', { present: true, seated: false, admin: false, leader: false }],
  ]);
  const service = new VoiceService(config, {
    policy: async (user) => policy.get(user),
    exists: (id) => id === roomID,
    remove: (room, identity) => api.removeParticipant(room, identity),
    deleteRoom: (room) => api.deleteRoom(room),
    stateChanged: () => {},
    revoked: () => {},
  });
  const gateway = createVoiceGateway(internalUrl, service);
  const staticServer = http.createServer((request, response) => {
    if (request.url === '/livekit.js') {
      response.setHeader('content-type', 'text/javascript; charset=utf-8');
      fs.createReadStream(sdkPath).pipe(response);
    } else {
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end('<!doctype html><script src="/livekit.js"></script>');
    }
  });
  let browser;
  let mediaRoom;
  try {
    const gatewayHTTP = await listen(gateway);
    config.publicUrl = gatewayHTTP.replace(/^http/, 'ws') + '/';
    const pageURL = await listen(staticServer);
    await service.setEnabled('alice', 'socket-a', roomID, true);
    await assert.rejects(service.join('spectator', 'socket-s', roomID), /forbidden/);
    const a = await service.join('alice', 'socket-a', roomID);
    const b = await service.join('bob', 'socket-b', roomID);
    mediaRoom = JSON.parse(Buffer.from(a.token.split('.')[1], 'base64url')).video.room;

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--allow-loopback-in-peer-connection',
        '--disable-features=WebRtcHideLocalIpsWithMdns',
      ],
    });
    const [pageA, pageB] = await Promise.all([connectPage(browser, pageURL, a), connectPage(browser, pageURL, b)]);
    await pageA.evaluate(async () => {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const destination = ctx.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      window.smoke.audio = { ctx, oscillator };
      await window.smoke.room.localParticipant.publishTrack(destination.stream.getAudioTracks()[0], {
        source: window.LivekitClient.Track.Source.Microphone,
      });
    });
    await pageB.waitForFunction(() => window.smoke.seen.audio > 0, { timeout });
    console.log('PASS: real LiveKit delivered oscillator microphone audio');

    await pageA.evaluate(async () => {
      try {
        await window.smoke.room.localParticipant.setCameraEnabled(true);
      } catch (_) {
        /* denied */
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    assert.equal(await pageB.evaluate(() => window.smoke.seen.video), 0, 'Camera reached subscriber');
    const marker = `voice-fixture-${Date.now()}`;
    await pageA.evaluate(async (value) => {
      try {
        await window.smoke.room.localParticipant.publishData(new TextEncoder().encode(value), { reliable: true });
      } catch (_) {
        /* denied */
      }
    }, marker);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    assert.equal(
      await pageB.evaluate((value) => window.smoke.seen.data.includes(value), marker),
      false,
      'Data reached subscriber',
    );
    console.log('PASS: camera and data never reached subscriber');

    const sdkToken = await pageA.evaluate(() => window.smoke.room.engine?.token || null);
    const refreshed = new AccessToken(apiKey, apiSecret, { identity: a.sessionID, ttl: 120 });
    refreshed.addGrant({
      room: mediaRoom,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canPublishData: false,
      canUpdateOwnMetadata: false,
    });
    const refreshedJWT = await refreshed.toJwt();
    service.revokeSocket('socket-a');
    await pageA.waitForFunction(() => window.smoke.room.state !== 'connected', { timeout });
    console.log('PASS: revoked publisher left connected state');
    await pageB.waitForFunction(() => window.smoke.seen.audioEnded > 0, { timeout });
    console.log('PASS: subscriber lost revoked audio track');
    assert.equal(await replay(a.url, a.token), false, 'Original JWT replay admitted');
    assert.equal(await replay(a.url, refreshedJWT), false, 'Fresh JWT for revoked identity admitted');
    if (sdkToken && sdkToken !== a.token) {
      assert.equal(await replay(a.url, sdkToken), false, 'SDK-refreshed JWT replay admitted');
      console.log('PASS: SDK-refreshed JWT replay denied');
    } else {
      console.log('SKIP: SDK had not refreshed its JWT during the short fixture run');
    }
    assert.equal(await pageB.evaluate(() => window.smoke.room.state), 'connected');
    console.log('PASS: revocation removed real media; original and fresh JWT replay denied');

    const startup = new VoiceStartup({
      listRooms: () => api.listRooms(),
      deleteRoom: (room) => api.deleteRoom(room),
    });
    assert.equal(startup.ready, false);
    await startup.reconcile();
    assert.equal(startup.ready, true, 'Startup cleanup did not become ready');
    await pageB.waitForFunction(() => window.smoke.room.state !== 'connected', { timeout });
    assert.equal(
      (await api.listRooms()).some((room) => room.name === mediaRoom),
      false,
      'Old room remained after backend startup cleanup',
    );
    console.log('PASS: fast backend restart cleanup deleted old LiveKit room and ended remaining media');
  } finally {
    if (browser) await browser.close();
    if (mediaRoom) await api.deleteRoom(mediaRoom).catch(() => {});
    await new Promise((resolve) => gateway.close(resolve));
    await new Promise((resolve) => staticServer.close(resolve));
  }
}

main().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
