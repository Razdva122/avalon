/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Manager } from '@/main';
import { AiService } from './service';
import * as pipeline from './pipeline';
import * as remote from './codex-remote';
import * as limits from './codex-limits';
import fixture from './fixtures/decisive-match.json';
import type { BotRequest } from './client';
import type { AiRepository } from './repository';

const environment = { ...process.env };
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...environment };
});

test.each(['standard', 'session-delta'])(
  'site routes %s games, audits every request and keeps reviews fresh',
  async (mode) => {
    process.env.NODE_ENV = 'development';
    process.env.AI_CODEX_ENABLED = 'true';
    jest.spyOn(remote, 'hasRemoteCodex').mockReturnValue(true);
    jest.spyOn(limits, 'readCodexExperimentQuota').mockResolvedValue(null as any);
    const wire = jest.spyOn(remote, 'remoteCodex').mockImplementation(async (request: object) => {
      const r = request as any;
      if (r.operation === 'closeSessions') return {};
      return {
        text: '{"choice":"approve","speech":""}',
        usage: { input_tokens: r.session?.id ? 300 : 100 },
        ...(r.session ? { threadID: r.session.key } : {}),
      };
    });
    jest.spyOn(pipeline, 'decisionPipeline').mockImplementation(
      (generate) => async (request, signal) =>
        generate(
          request,
          {
            instructions: 'COMMON stage',
            cacheInstructions: 'COMMON',
            context: { player: request.playerID, turn: request.task },
          },
          signal,
        ),
    );
    const io: any = { to: () => io, except: () => io, emit: () => true };
    const service = new AiService({ io, dbManager: {} } as unknown as Manager);
    const audits: any[] = [];
    const repo = {
      beginSessionExperiment: jest.fn(async () => ({ version: 'session-delta-v1', mode })),
      renewLease: async () => {},
      recordExperimentQuota: jest.fn(async () => {}),
      recordRequest: async (entry: object) => {
        audits.push(structuredClone(entry));
      },
      recordDecision: async () => {},
      recordExperimentProgress: jest.fn(async () => {}),
    };
    service.repository = repo as unknown as AiRepository;
    const room = (service as any).createRoom('test-site', 'owner', 'ru', 5);
    room.ai.codex = { model: 'gpt-test', reasoning: 'low' };
    const request = structuredClone(fixture.cases[0].request) as unknown as BotRequest;
    request.choices = ['approve'];
    request.state.stage = 'votingForTeam';
    await room.decide(request);
    request.task = 'next turn';
    await room.decide(request);
    request.state.stage = 'end';
    await room.decide(request);
    expect(repo.beginSessionExperiment).toHaveBeenCalledTimes(1);
    expect(repo.recordExperimentQuota).toHaveBeenCalledTimes(1);
    const calls = wire.mock.calls.map(([r]) => r as any);
    expect(Boolean(calls[0].session)).toBe(mode === 'session-delta');
    expect(Boolean(calls[1].session?.id)).toBe(mode === 'session-delta');
    expect(calls[2].session).toBeUndefined();
    const completed = audits.filter((a) => a.status === 'completed');
    expect(completed.map((a) => a.inputTokens)).toEqual([100, mode === 'session-delta' ? 200 : 100, 100]);
    expect(completed.every((a) => a.experiment.mode === mode && a.model === 'gpt-test')).toBe(true);
    room.ai.status = 'finished';
    await (service as any).experimentRuns.get('test-site')();
    expect(repo.recordExperimentProgress).toHaveBeenCalledTimes(1);
    expect((service as any).experimentRuns.has('test-site')).toBe(false);
    if (mode === 'session-delta') expect((wire.mock.calls.at(-1)![0] as any).operation).toBe('closeSessions');
    room.stop();
  },
);
