import { AiService } from './service';
import type { Manager } from '@/main';
import type { AiRepository } from './repository';
import type { ServerSocket } from '@avalon/types';
import * as codexLimits from './codex-limits';
import * as codexModels from './codex-models';

const environment = { ...process.env };
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...environment };
});

test('only Codex is advertised and legacy provider requests cannot acquire a room', async () => {
  jest.spyOn(codexLimits, 'getCodexWeeklyLimit').mockResolvedValue(null);
  jest.spyOn(codexModels, 'getCodexModels').mockResolvedValue([]);
  process.env.NODE_ENV = 'production';
  process.env.AI_CODEX_ENABLED = 'true';
  const host = { rooms: {}, dbManager: { getUserByID: async () => ({ isAdmin: true }) } } as unknown as Manager;
  const service = new AiService(host);
  const claim = jest.fn();
  service.repository = { claim } as unknown as AiRepository;
  const handlers: Record<string, (...args: unknown[]) => Promise<void>> = {};
  service.register(
    {
      on: (name: string, handler: (...args: unknown[]) => Promise<void>) => {
        handlers[name] = handler;
      },
    } as unknown as ServerSocket,
    'admin',
  );
  const response = jest.fn();
  await handlers.getAiRoomAccess(response);
  expect(response).toHaveBeenCalledWith(
    expect.objectContaining({
      models: [{ id: 'codex-chatgpt', label: 'Codex · ChatGPT' }],
      defaultModel: 'codex-chatgpt',
    }),
  );
  await handlers.createAiRoom('retired-provider', response);
  expect(response.mock.calls.at(-1)?.[0]).toHaveProperty('error');
  expect(claim).not.toHaveBeenCalled();
  expect(handlers.getAiBudget).toBeUndefined();
  expect(handlers.getAiRoomCosts).toBeUndefined();
});
