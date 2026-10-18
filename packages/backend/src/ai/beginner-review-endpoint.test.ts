import { AiService } from './service';
import * as codex from './codex';
import type { Manager } from '@/main';
import type { ServerSocket } from '@avalon/types';
import { validPacket } from '@/security/validation';

test('review packet requires exactly one room ID and an acknowledgement', () => {
  expect(validPacket('getBeginnerReview', ['room', () => {}])).toBe(true);
  expect(validPacket('getBeginnerReview', ['room'])).toBe(false);
  expect(validPacket('getBeginnerReview', ['room', 'not-ack'])).toBe(false);
  expect(validPacket('getBeginnerReview', ['room', { model: 'different' }, () => {}])).toBe(false);
});
test('review endpoint serves only the finished beginner participant, including archived rooms', async () => {
  jest.spyOn(codex, 'codexEnabled').mockReturnValue(true);
  try {
    const room = {
      roomID: 'room',
      stage: 'started',
      createAt: new Date().toISOString(),
      ai: { beginner: true, humanPlayerID: 'owner' },
      game: {
        stage: 'end',
        result: { winner: 'good', reason: 'goodTeamMissions' },
        players: [{ id: 'owner', role: 'servant' }],
        history: [],
        settings: { roles: { good: ['servant'], evil: [] } },
      },
    };
    const load = jest.fn(async () => room);
    const get = jest.fn(async () => ({
      status: 'complete',
      review: { decision: 'Actual choice', observation: 'Known fact', next: 'Try this' },
    }));
    const host = { rooms: {}, dbManager: { getUserByID: async (id: string) => ({ id }) } } as unknown as Manager;
    const service = new AiService(host);
    Object.assign(service, { repository: { load }, beginnerAnalysis: { get } });
    const connect = (id?: string) => {
      const events: Record<string, Function> = {};
      service.register(
        { on: (event: string, handler: Function) => (events[event] = handler) } as unknown as ServerSocket,
        id,
      );
      return events;
    };
    for (const id of [undefined, 'spectator']) {
      const ack = jest.fn();
      await connect(id).getBeginnerReview('room', ack);
      expect(ack).toHaveBeenCalledWith({ status: 'unavailable' });
    }
    expect(get).not.toHaveBeenCalled();
    const ack = jest.fn();
    await connect('owner').getBeginnerReview('room', ack);
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ status: 'complete' }));
    expect(get).toHaveBeenCalledWith(room, 'owner', true);
  } finally {
    jest.restoreAllMocks();
  }
});
