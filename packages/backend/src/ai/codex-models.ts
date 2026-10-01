import { execFile } from 'child_process';
import { promisify } from 'util';
import type { CodexSettings, CodexModelOption } from '@avalon/types';
import { AiTechnicalPause } from './client';

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

let cache: { key: string; expires: number; models: CodexModelOption[] } | undefined;
let pending: Promise<CodexModelOption[]> | undefined;
export async function getCodexModels(): Promise<CodexModelOption[]> {
  const bin = process.env.AI_CODEX_BIN || 'codex';
  const home = process.env.AI_CODEX_HOME || process.env.CODEX_HOME;
  const key = `${bin}:${home}`;
  if (cache?.key === key && cache.expires > Date.now()) return cache.models;
  if (pending) return pending;
  pending = (async () => {
    try {
      const { stdout } = await promisify(execFile)(bin, ['debug', 'models'], {
        timeout: 20000,
        maxBuffer: 8 * 1024 * 1024,
        env: { PATH: process.env.PATH, HOME: process.env.HOME, ...(home ? { CODEX_HOME: home } : {}) },
      });
      const models = parseCodexModels(JSON.parse(stdout));
      if (!models.length) throw new Error('empty');
      cache = { key, models, expires: Date.now() + 300000 };
      return models;
    } catch {
      throw new AiTechnicalPause('Could not load Codex models. Check your local ChatGPT login.');
    } finally {
      pending = undefined;
    }
  })();
  return pending;
}
