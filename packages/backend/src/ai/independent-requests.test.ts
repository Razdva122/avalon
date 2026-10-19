/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Manager } from '@/main';
import { AiService } from './service';
import * as pipeline from './pipeline';
import * as remote from './codex-remote';
import fixture from './fixtures/decisive-match.json';
import type { BotRequest } from './client';
import type { AiRepository } from './repository';

const environment = { ...process.env };
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...environment };
});

test('every player turn and review sends an independent decision and retains token accounting', async () => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  jest.spyOn(remote, 'hasRemoteCodex').mockReturnValue(true);
  const wire = jest.spyOn(remote, 'remoteCodex').mockResolvedValue({
    text: '{"choice":"approve","speech":""}',
    usage: { input_tokens: 100, cached_input_tokens: 40, output_tokens: 10 },
  });
  jest.spyOn(pipeline, 'decisionPipeline').mockImplementation(
    (generate) => async (request, signal) =>
      generate(
        request,
        {
          instructions: 'COMMON stage',
          cacheInstructions: 'COMMON',
          phase: request.state.stage === 'end' ? 'review' : 'decision',
          context: { player: request.playerID, turn: request.task },
        },
        signal,
      ),
  );
  const io: any = { to: () => io, except: () => io, emit: () => true };
  const service = new AiService({ io, dbManager: {} } as unknown as Manager);
  const audits: any[] = [];
  service.repository = {
    renewLease: async () => {},
    recordRequest: async (entry: object) => {
      audits.push(structuredClone(entry));
    },
    recordDecision: async () => {},
  } as unknown as AiRepository;
  const room = (service as any).createRoom('independent', 'owner', 'ru', 5);
  try {
    room.ai.codex = { model: 'gpt-test', reasoning: 'low' };
    const request = structuredClone(fixture.cases[0].request) as unknown as BotRequest;
    request.choices = ['approve'];
    request.state.stage = 'votingForTeam';
    await room.decide(request);
    request.task = 'next turn';
    await room.decide(request);
    request.playerID = 'other-player';
    await room.decide(request);
    request.state.stage = 'end';
    await room.decide(request);
    expect(wire.mock.calls).toHaveLength(4);
    for (const [request] of wire.mock.calls) {
      expect(Object.keys(request).sort()).toEqual(['instructions', 'operation', 'prompt', 'schema', 'settings']);
      expect(request).toMatchObject({ operation: 'decide', settings: { model: 'gpt-test', reasoning: 'low' } });
    }
    const completed = audits.filter((a) => a.status === 'completed');
    expect(completed.map((a) => [a.inputTokens, a.cachedTokens, a.outputTokens])).toEqual([
      [100, 40, 10],
      [100, 40, 10],
      [100, 40, 10],
      [100, 40, 10],
    ]);
    expect(completed.map((a) => a.phase)).toEqual(['decision', 'decision', 'decision', 'review']);
  } finally {
    room.stop();
  }
});
