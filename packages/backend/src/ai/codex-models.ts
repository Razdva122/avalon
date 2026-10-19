import { codexEnvironment } from './codex-instances';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { CodexSettings, CodexModelOption } from '@avalon/types';
import { AiTechnicalPause } from './client';
import { hasRemoteCodex, remoteCodex, remoteCodexCacheKey } from './codex-remote';

export function parseCodexModels(value: unknown): CodexModelOption[] {
  const models = (value as { models?: unknown[] })?.models;
  if (!Array.isArray(models)) throw new AiTechnicalPause('Codex model catalog unavailable.');
  return models.flatMap((entry) => {
    const m = entry as {
      slug?: string;
      display_name?: string;
      visibility?: string;
      supported_reasoning_levels?: { effort: string }[];
    };
    if (m.visibility !== 'list' || typeof m.slug !== 'string' || !Array.isArray(m.supported_reasoning_levels))
      return [];
    const efforts = m.supported_reasoning_levels
      .map((level) => level.effort)
      .filter((effort) => ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'].includes(effort));
    return efforts.length ? [{ id: m.slug, label: m.display_name || m.slug, efforts }] : [];
  });
}

export function validateCodexSettings(value: unknown, catalog: CodexModelOption[]): CodexSettings {
  const settings = value as CodexSettings | null;
  const model = catalog.find((m) => m.id === settings?.model);
  if (!model || !model.efforts.includes(settings?.reasoning || ''))
    throw new AiTechnicalPause('Invalid Codex model or reasoning level.');
  return { model: model.id, reasoning: settings!.reasoning };
}

const cache = new Map<string, { expires: number; models: CodexModelOption[] }>();
const pending = new Map<string, Promise<CodexModelOption[]>>();
function cacheModels(key: string, models: CodexModelOption[]) {
  if (cache.size >= 64) cache.delete(cache.keys().next().value!);
  cache.set(key, { models, expires: Date.now() + 300000 });
}
export async function getCodexModels(): Promise<CodexModelOption[]> {
  const bin = codexEnvironment().AI_CODEX_BIN || 'codex';
  const home = codexEnvironment().AI_CODEX_HOME || codexEnvironment().CODEX_HOME;
  const key = hasRemoteCodex() ? remoteCodexCacheKey() : `${bin}:${home || codexEnvironment().HOME}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.models;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      if (hasRemoteCodex()) {
        const models = parseCodexModels(await remoteCodex({ operation: 'models' }));
        if (!models.length) throw new Error('empty');
        cacheModels(key, models);
        return models;
      }
      const { stdout } = await promisify(execFile)(bin, ['debug', 'models'], {
        timeout: 20000,
        maxBuffer: 8 * 1024 * 1024,
        env: { PATH: process.env.PATH, HOME: process.env.HOME, ...(home ? { CODEX_HOME: home } : {}) },
      });
      const models = parseCodexModels(JSON.parse(stdout));
      if (!models.length) throw new Error('empty');
      cacheModels(key, models);
      return models;
    } catch {
      throw new AiTechnicalPause('Could not load Codex models. Check server ChatGPT login.');
    }
  })();
  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    if (pending.get(key) === promise) pending.delete(key);
  }
}
