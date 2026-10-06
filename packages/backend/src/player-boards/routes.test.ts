import { editableDraft } from '../../../ui/src/pages/community/board-helpers';
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { config } from '@/config';
import { userProfileModel, roomModel } from '@/db/models';
import { createPlayerBoardsRouter } from './routes';
import { ensurePlayerBoardIndexes, boardListingModel, boardReportModel, boardAuthorModel } from './repository';

jest.mock('@/config', () => ({ config: { SECRET_KEY: 'player-board-test-only' } }));
jest.setTimeout(120000);
let mongo: MongoMemoryServer;
let server: Server;
let base: string;
let time: number;
const DAY = 86400000;
const draft = {
  kind: 'solo',
  groupName: '',
  otherLanguage: '',
  languages: ['en'],
  scheduleEnabled: true,
  days: [1, 7],
  startHour: 18,
  endHour: 23,
  timeZone: 'Asia/Yekaterinburg',
  communication: 'either',
  experience: 'beginner',
  beginnerFriendly: true,
  canTeach: false,
  groupSize: 1,

  contacts: [{ type: 'discord', value: 'alice_123' }],
};
function token(id: string, extra = {}) {
  return jwt.sign({ id, authVersion: 0, ...extra }, config.SECRET_KEY);
}
async function request(path = '', method = 'GET', user?: string, body?: unknown) {
  return fetch(base + path, {
    method,
    headers: { ...(user ? { authorization: `Bearer ${token(user)}` } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function publish(user = 'alice', body: unknown = draft, kind = 'solo') {
  return request('/me/' + kind, 'PUT', user, body);
}
async function listing() {
  const response = await publish();
  expect(response.status).toBe(200);
  return (await response.json()).listing;
}
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { autoIndex: false });
  await ensurePlayerBoardIndexes();
  const app = express();
  app.use(
    '/api/player-boards',
    createPlayerBoardsRouter(() => new Date(time)),
  );
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/player-boards`;
});
beforeEach(async () => {
  time = Date.parse('2026-09-01T00:00:00Z');
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
  await userProfileModel.collection.insertMany([
    {
      id: 'alice',
      login: 'alice',
      name: 'Alice',
      avatar: 'merlin',
      email: 'alice@private.test',
      password: 'private',
      authVersion: 0,
    },
    { id: 'bob', login: 'bob', name: 'Bob', email: 'bob@private.test' },
    { id: 'admin', login: 'admin', name: 'Admin', email: 'admin@private.test', isAdmin: true },
  ]);
});
afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  await mongo?.stop();
});
test('publication has 30-day expiry and exposes only current public profile', async () => {
  const item = await listing();
  expect(item).toMatchObject({
    userID: 'alice',
    name: 'Alice',
    createdAt: '2026-09-01T00:00:00.000Z',
    bumpedAt: '2026-09-01T00:00:00.000Z',
    expiresAt: '2026-10-01T00:00:00.000Z',
    active: true,
    moderated: false,
  });
  await userProfileModel.updateOne({ id: 'alice' }, { name: 'New Name' });
  const page = await (await request('?kind=solo')).json();
  expect(page.listings[0].name).toBe('New Name');
  expect(JSON.stringify(page)).not.toMatch(/private|password|login|authVersion/);
});
test('expiry boundary hides public listing but retains owner data', async () => {
  await listing();
  time += 30 * DAY - 1;
  expect((await (await request('?kind=solo')).json()).listings).toHaveLength(1);
  time++;
  expect((await (await request('?kind=solo')).json()).listings).toHaveLength(0);
  expect((await (await request('/me', 'GET', 'alice')).json()).listings[0].active).toBe(true);
  expect((await request('/me/solo/bump', 'POST', 'alice')).status).toBe(409);
  expect((await request('/me/solo/reactivate', 'POST', 'alice')).status).toBe(200);
});
test('edit preserves rank and expiry; concurrent publish retains one owner/kind', async () => {
  const item = await listing();
  time += DAY;
  const responses = await Promise.all(Array.from({ length: 6 }, () => publish('alice', { ...draft, days: [2] })));
  expect(responses.every((r) => r.status === 200)).toBe(true);
  const me = await (await request('/me', 'GET', 'alice')).json();
  expect(me.listings).toHaveLength(1);
  expect(me.listings[0]).toMatchObject({ id: item.id, bumpedAt: item.bumpedAt, expiresAt: item.expiresAt, days: [2] });
});
test('only one simultaneous bump wins at exact seven-day boundary', async () => {
  await listing();
  time += 7 * DAY - 1;
  expect((await request('/me/solo/bump', 'POST', 'alice')).status).toBe(409);
  time++;
  const responses = await Promise.all(Array.from({ length: 8 }, () => request('/me/solo/bump', 'POST', 'alice')));
  expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
  expect(responses.filter((r) => r.status === 409)).toHaveLength(7);
  expect((await (await request('/me', 'GET', 'alice')).json()).listings[0].expiresAt).toBe('2026-10-08T00:00:00.000Z');
});
test.each(['solo', 'group'])(
  '%s hidden listing can be restored before cooldown without raising or extending it',
  async (kind) => {
    if (kind === 'group')
      await roomModel.collection.insertOne({
        roomID: 'eligible',
        players: [{ id: 'alice' }],
        game: { stage: 'end', result: { winner: 'good', reason: 'quests' } },
      });
    const body = { ...draft, kind, groupName: kind === 'group' ? 'Test group' : '' };
    const original = (await (await publish('alice', body, kind)).json()).listing;
    await request(`/me/${kind}/hide`, 'POST', 'alice');
    time += DAY;
    await publish('alice', body, kind);
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(`/me/${kind}/reactivate`, 'POST', 'alice')),
    );
    expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
    const restored = (await (await request('/me', 'GET', 'alice')).json()).listings[0];
    expect(restored).toMatchObject({ active: true, bumpedAt: original.bumpedAt, expiresAt: original.expiresAt });
    expect((await request(`/me/${kind}/bump`, 'POST', 'alice')).status).toBe(409);
  },
);
test('saved listing with absent optional fields can be edited through the real API', async () => {
  await listing();
  await boardListingModel.collection.updateOne(
    { userID: 'alice' },
    { $unset: { otherLanguage: '', scheduleEnabled: '' } },
  );
  const stored = (await (await request('/me', 'GET', 'alice')).json()).listings[0];
  const edit = editableDraft(stored);
  edit.canTeach = true;
  const response = await publish('alice', edit);
  expect(response.status).toBe(200);
  expect((await response.json()).listing).toMatchObject({ canTeach: true, otherLanguage: '', scheduleEnabled: false });
});
test('completed non-manual participation is required for group publishing', async () => {
  const group = { ...draft, kind: 'group', groupSize: 4, groupName: '台北 Avalon' };
  expect((await publish('alice', group, 'group')).status).toBe(403);
  await roomModel.collection.insertMany([
    {
      roomID: 'manual',
      players: [{ id: 'alice' }],
      game: { stage: 'end', result: { winner: 'good', reason: 'manualy' } },
    },
    { roomID: 'running', players: [{ id: 'alice' }], game: { stage: 'task', result: { winner: 'good' } } },
    {
      roomID: 'bob-game',
      players: [{ id: 'bob' }],
      game: { stage: 'end', result: { winner: 'good', reason: 'tasks' } },
    },
  ]);
  expect((await publish('alice', group, 'group')).status).toBe(403);
  await roomModel.collection.insertOne({
    roomID: 'real',
    players: [{ id: 'alice' }],
    game: { stage: 'end', result: { winner: 'good', reason: 'tasks' } },
  });
  const published = await publish('alice', group, 'group');
  expect(published.status).toBe(200);
  expect((await published.json()).listing.groupName).toBe('台北 Avalon');
  const publicGroups = await (await request('?kind=group')).json();
  expect(publicGroups.listings[0].groupName).toBe('台北 Avalon');
  expect(publicGroups.listings[0]).not.toHaveProperty('seeking');
  expect((await (await request('/me', 'GET', 'alice')).json()).canRecruit).toBe(true);
});
test.each([
  { languages: ['zh'] },
  { languages: [] },
  { days: [0] },
  { days: [1, 1] },
  { startHour: 24 },
  { endHour: 2.5 },
  { endHour: 18 },
  { timeZone: 'Mars/Olympus' },
  { communication: 'anything' },
  { beginnerFriendly: 'true' },
  { contacts: [{ type: 'discord', value: 'https://example.com' }] },
  { contacts: [{ type: 'discord', value: '<script>alert(1)</script>' }] },
  { contacts: [] },
  { contacts: [{ type: 'qqGroup', value: '12345' }] },
  { groupSize: 0 },
  { groupSize: 11 },
  { kind: 'group' },
  { userID: 'bob' },
  { active: true },
  { expiresAt: '2099-01-01' },
  { description: 'free text' },
])('rejects invalid or injected draft %#', async (change) => {
  expect((await publish('alice', { ...draft, ...change })).status).toBe(400);
});
test('session revocation, ownership, DB admin authority, and private state are enforced', async () => {
  expect((await request('/me')).status).toBe(401);
  await listing();
  expect((await request('/me/solo/hide', 'POST', 'bob')).status).toBe(404);
  const fakeAdmin = await fetch(base + '/moderation', {
    headers: { authorization: `Bearer ${token('alice', { isAdmin: true })}` },
  });
  expect(fakeAdmin.status).toBe(403);
  await userProfileModel.updateOne({ id: 'alice' }, { authVersion: 1 });
  expect((await publish()).status).toBe(401);
});
test('reports deduplicate per reporter; admin hide blocks reactivation and dismiss clears reports', async () => {
  const item = await listing();
  expect((await request('/' + item.id + '/report', 'POST', 'bob', { reason: 'spam' })).status).toBe(200);
  await Promise.all(
    Array.from({ length: 5 }, () => request('/' + item.id + '/report', 'POST', 'bob', { reason: 'abuse' })),
  );
  let reports = (await (await request('/moderation', 'GET', 'admin')).json()).reports;
  expect(reports).toHaveLength(1);
  expect(reports[0]).toMatchObject({ id: item.id, count: 1, reasons: ['spam', 'abuse'], banned: false });
  expect((await (await request('?kind=solo')).json()).listings).toHaveLength(1);
  await request('/moderation/' + item.id + '/hide', 'POST', 'admin');
  time += 8 * DAY;
  expect((await request('/me/solo/reactivate', 'POST', 'alice')).status).toBe(403);
  expect((await publish()).status).toBe(403);
  expect((await (await request('?kind=solo')).json()).listings).toHaveLength(0);
  await request('/moderation/' + item.id + '/dismiss', 'POST', 'admin');
  reports = (await (await request('/moderation', 'GET', 'admin')).json()).reports;
  expect(reports).toHaveLength(0);
});
test('ban removes public listings and rejects all publishing actions, unban restores permission', async () => {
  await listing();
  expect((await request('/moderation/users/alice/ban', 'POST', 'bob', { banned: true })).status).toBe(403);
  expect((await request('/moderation/users/alice/ban', 'POST', 'admin', { banned: true })).status).toBe(200);
  expect((await (await request('?kind=solo')).json()).listings).toHaveLength(0);
  expect((await publish()).status).toBe(403);
  for (const action of ['bump', 'reactivate'])
    expect((await request('/me/solo/' + action, 'POST', 'alice')).status).toBe(403);
  expect((await request('/me/solo/hide', 'POST', 'alice')).status).toBe(200);
  expect((await (await request('/me', 'GET', 'alice')).json()).banned).toBe(true);
  await request('/moderation/users/alice/ban', 'POST', 'admin', { banned: false });
  time += 7 * DAY;
  expect((await request('/me/solo/reactivate', 'POST', 'alice')).status).toBe(200);
});
test('public pagination filters before paging and has deterministic newest bump ordering', async () => {
  const users = Array.from({ length: 24 }, (_, i) => 'player' + i);
  await userProfileModel.collection.insertMany(
    users.map((id) => ({ id, name: id, login: id, email: id + '@test.local' })),
  );
  for (const [index, user] of users.entries()) {
    time += 1000;
    expect((await publish(user, { ...draft, languages: index < 2 ? ['ru'] : ['en'] })).status).toBe(200);
  }
  const page = await (await request('?kind=solo&language=en&page=1')).json();
  expect(page.listings).toHaveLength(20);
  expect(page.hasMore).toBe(true);
  expect(page.listings[0].userID).toBe('player23');
  const next = await (await request('?kind=solo&language=en&page=2')).json();
  expect(next.listings).toHaveLength(2);
  expect(next.hasMore).toBe(false);
  expect((await request('?kind=solo&page=0')).status).toBe(400);
  expect((await request('?kind=solo&language=xx')).status).toBe(400);
});
test('banned users remain discoverable and can be unbanned without pending reports', async () => {
  await request('/moderation/users/alice/ban', 'POST', 'admin', { banned: true });
  const response = await request('/moderation/bans', 'GET', 'admin');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ users: [{ userID: 'alice', name: 'Alice' }] });
  expect((await request('/moderation/bans', 'GET', 'bob')).status).toBe(403);
  expect((await publish()).status).toBe(403);
  expect((await (await request('/me', 'GET', 'alice')).json()).listings).toHaveLength(0);
  await request('/moderation/users/alice/ban', 'POST', 'admin', { banned: false });
  expect((await publish()).status).toBe(200);
  expect(await (await request('/moderation/bans', 'GET', 'admin')).json()).toEqual({ users: [] });
});
test.each([
  { communication: ['voice'] },
  { experience: ['beginner'] },
  { groupName: 42 },
  {
    contacts: [
      { type: 'discord', value: 'a' },
      { type: 'discord', value: 'b' },
    ],
  },
])('rejects coerced enum and group/contact inconsistencies %#', async (change) => {
  expect((await publish('alice', { ...draft, ...change })).status).toBe(400);
});
test('simultaneous first publications share one persistent identity', async () => {
  const responses = await Promise.all(Array.from({ length: 12 }, () => publish()));
  expect(responses.every((response) => response.status === 200)).toBe(true);
  const bodies = await Promise.all(responses.map((response) => response.json()));
  expect(new Set(bodies.map((body) => body.listing.id)).size).toBe(1);
  expect((await (await request('/me', 'GET', 'alice')).json()).listings).toHaveLength(1);
});
test('concurrent initial publication cannot bypass a completed ban', async () => {
  const publishRequests = Array.from({ length: 12 }, () => publish());
  const ban = request('/moderation/users/alice/ban', 'POST', 'admin', { banned: true });
  await Promise.all([...publishRequests, ban]);
  expect((await publish()).status).toBe(403);
  expect((await (await request('?kind=solo')).json()).listings).toHaveLength(0);
  expect((await request('/me/solo/bump', 'POST', 'alice')).status).toBe(403);
});
test('malformed JSON and oversized bodies return safe structured errors', async () => {
  const headers = { authorization: `Bearer ${token('alice')}`, 'Content-Type': 'application/json' };
  const malformed = await fetch(base + '/me/solo', { method: 'PUT', headers, body: '{broken' });
  expect(malformed.status).toBe(400);
  expect(await malformed.json()).toEqual({ error: 'invalid_request' });
  const oversized = await fetch(base + '/me/solo', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ description: 'x'.repeat(10000) }),
  });
  expect(oversized.status).toBe(413);
  expect(await oversized.json()).toEqual({ error: 'invalid_request' });
});

test('startup enforces owner, reporter and author uniqueness with production autoIndex disabled', async () => {
  const item = await boardListingModel.create({ userID: 'alice', kind: 'solo' });
  await expect(boardListingModel.create({ userID: 'alice', kind: 'solo' })).rejects.toMatchObject({ code: 11000 });
  await boardReportModel.create({
    listingID: item._id,
    reporterID: 'bob',
    reasons: ['spam'],
    createdAt: new Date(time),
  });
  await expect(
    boardReportModel.create({ listingID: item._id, reporterID: 'bob', reasons: ['abuse'], createdAt: new Date(time) }),
  ).rejects.toMatchObject({ code: 11000 });
  await boardAuthorModel.create({ userID: 'alice', banned: false });
  await expect(boardAuthorModel.create({ userID: 'alice', banned: true })).rejects.toMatchObject({ code: 11000 });
});
test('schedule can be removed on edit and stays absent in public listings', async () => {
  await listing();
  const response = await publish('alice', {
    ...draft,
    scheduleEnabled: false,
    days: [],
    startHour: 0,
    endHour: 0,
    timeZone: '',
  });
  expect(response.status).toBe(200);
  const result = await (await request('?kind=solo')).json();
  expect(result.listings[0]).toMatchObject({
    scheduleEnabled: false,
    days: [],
    startHour: 0,
    endHour: 0,
    timeZone: '',
  });
});
test('other language filter returns custom-language listings with their text', async () => {
  expect((await publish('alice', { ...draft, languages: ['en', 'other'], otherLanguage: '日本語' })).status).toBe(200);
  await publish('bob');
  const result = await (await request('?kind=solo&language=other')).json();
  expect(result.listings).toHaveLength(1);
  expect(result.listings[0].otherLanguage).toBe('日本語');
});

test.each(['solo', 'group'])(
  'bump renews %s for 30 days from last bump and expiry removes it publicly',
  async (kind) => {
    await roomModel.collection.insertOne({
      roomID: 'eligible',
      players: [{ id: 'alice' }],
      game: { stage: 'end', result: { winner: 'good', reason: 'tasks' } },
    });
    const body = { ...draft, kind, groupName: kind === 'group' ? 'Avalon' : '' };
    const createdAt = time;
    expect((await publish('alice', body, kind)).status).toBe(200);
    time += 20 * DAY;
    expect((await publish('bob', draft, 'solo')).status).toBe(200);
    time += DAY;
    const response = await request('/me/' + kind + '/bump', 'POST', 'alice');
    expect(response.status).toBe(200);
    const renewed = (await response.json()).listing;
    expect(renewed.bumpedAt).toBe(new Date(time).toISOString());
    expect(renewed.expiresAt).toBe(new Date(time + 30 * DAY).toISOString());
    expect(renewed.createdAt).toBe(new Date(createdAt).toISOString());
    expect((await (await request('?kind=' + kind)).json()).listings[0].userID).toBe('alice');
    const expiry = time + 30 * DAY;
    time = expiry - 1;
    expect(
      (await (await request('?kind=' + kind)).json()).listings.some(
        (item: { userID: string }) => item.userID === 'alice',
      ),
    ).toBe(true);
    time = expiry;
    expect((await (await request('?kind=' + kind)).json()).listings).toHaveLength(0);
  },
);

test('JSON endpoints are not search landing pages', async () => {
  expect((await request()).headers.get('x-robots-tag')).toBe('noindex');
});
test('member search requires authentication, bounds and escapes names, and exposes public profiles', async () => {
  expect((await request('/members?query=Al')).status).toBe(401);
  for (const query of ['A', 'x'.repeat(81)])
    expect((await request('/members?query=' + query, 'GET', 'alice')).status).toBe(400);
  await userProfileModel.collection.insertMany(
    Array.from({ length: 12 }, (_, i) => ({ id: 'search' + i, name: 'Al' + i })),
  );
  const response = await request('/members?query=al', 'GET', 'alice');
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.members).toHaveLength(10);
  expect((await (await request('/members?query=ali', 'GET', 'alice')).json()).members).toEqual([
    { userID: 'alice', name: 'Alice', avatar: 'merlin' },
  ]);
  expect(JSON.stringify(body)).not.toMatch(/email|password|login|authVersion/);
  expect(await (await request('/members?query=Al.*', 'GET', 'alice')).json()).toEqual({ members: [] });
});
test('party members are editable public profiles and unknown accounts are rejected', async () => {
  await roomModel.collection.insertOne({
    roomID: 'eligible',
    players: [{ id: 'alice' }],
    game: { stage: 'end', result: { winner: 'good', reason: 'tasks' } },
  });
  const group = { ...draft, kind: 'group', groupName: 'Avalon', groupSize: 2, memberIDs: ['alice', 'bob'] };
  const response = await publish('alice', group, 'group');
  expect(response.status).toBe(200);
  expect((await response.json()).listing.members).toEqual([
    { userID: 'alice', name: 'Alice', avatar: 'merlin' },
    { userID: 'bob', name: 'Bob', avatar: 'servant' },
  ]);
  expect((await publish('alice', { ...group, memberIDs: ['missing'] }, 'group')).status).toBe(400);
  expect((await (await publish('alice', { ...group, memberIDs: [] }, 'group')).json()).listing.members).toEqual([]);
  const solo = await listing();
  expect(solo.memberIDs).toEqual([]);
});
