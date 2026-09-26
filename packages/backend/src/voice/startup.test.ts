import { VoiceStartup } from './startup';
test('startup does not become ready until every previous room is deleted', async () => {
  let finish!: () => void;
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const deleted: string[] = [];
  const startup = new VoiceStartup({
    listRooms: async () => [{ name: 'old' }, { name: 'old2' }],
    deleteRoom: async (name) => {
      await waiting;
      deleted.push(name);
    },
  });
  const pending = startup.reconcile();
  expect(startup.ready).toBe(false);
  finish();
  await pending;
  expect(deleted).toEqual(['old', 'old2']);
  expect(startup.ready).toBe(true);
});
test('failed startup cleanup stays closed and retries without deleting new live rooms after success', async () => {
  let attempts = 0;
  const startup = new VoiceStartup({
    listRooms: async () => {
      if (++attempts === 1) throw Error('offline');
      return [];
    },
    deleteRoom: async () => {},
  });
  await startup.reconcile();
  expect(startup.ready).toBe(false);
  await startup.reconcile();
  expect(startup.ready).toBe(true);
  await startup.reconcile();
  expect(attempts).toBe(2);
});
