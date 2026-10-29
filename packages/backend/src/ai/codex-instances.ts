import { AsyncLocalStorage } from 'async_hooks';
import { isAbsolute, resolve } from 'path';

export type CodexInstance = { id: string; environment: NodeJS.ProcessEnv; maxGames?: 1 | 2 };
const context = new AsyncLocalStorage<CodexInstance>();
const connectionKeys = [
  'AI_CODEX_HOME',
  'CODEX_HOME',
  'AI_CODEX_SSH_HOST',
  'AI_CODEX_SSH_USER',
  'AI_CODEX_SSH_PORT',
  'AI_CODEX_SSH_KEY',
  'AI_CODEX_SSH_KNOWN_HOSTS',
] as const;

/** Server-only routing context; never mutate process.env while concurrent rooms run. */
export function withCodexInstance<T>(instance: CodexInstance, operation: () => T): T {
  return context.run(instance, operation);
}

export function codexEnvironment(): NodeJS.ProcessEnv {
  return { ...process.env, ...context.getStore()?.environment };
}

export function codexInstanceID(): string {
  return context.getStore()?.id ?? 'default';
}

export function configuredCodexInstances(): CodexInstance[] {
  const raw = process.env.AI_CODEX_INSTANCES;
  if (raw === undefined) {
    return [{ id: 'default', environment: Object.fromEntries(connectionKeys.map((key) => [key, process.env[key]])) }];
  }
  const invalid = () => new Error('Invalid AI_CODEX_INSTANCES configuration');
  let entries: unknown;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw invalid();
  }
  if (!Array.isArray(entries) || !entries.length || entries.length > 32) throw invalid();
  const ids = new Set<string>();
  const destinations = new Set<string>();
  return entries.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
    const entry = value as { id?: unknown; home?: unknown; ssh?: unknown; maxGames?: unknown };
    if (
      Object.keys(entry).some((key) => !['id', 'home', 'ssh', 'maxGames'].includes(key)) ||
      (entry.maxGames !== undefined && entry.maxGames !== 1 && entry.maxGames !== 2) ||
      typeof entry.id !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/.test(entry.id) ||
      entry.id === 'default' ||
      ids.has(entry.id) ||
      (entry.home === undefined) === (entry.ssh === undefined)
    )
      throw invalid();
    ids.add(entry.id);
    const environment: NodeJS.ProcessEnv = Object.fromEntries(connectionKeys.map((key) => [key, undefined]));
    let destination: string;
    if (entry.home !== undefined) {
      if (typeof entry.home !== 'string' || !isAbsolute(entry.home)) throw invalid();
      environment.AI_CODEX_HOME = resolve(entry.home);
      destination = `local:${environment.AI_CODEX_HOME}`;
    } else {
      if (!entry.ssh || typeof entry.ssh !== 'object' || Array.isArray(entry.ssh)) throw invalid();
      const ssh = entry.ssh as Record<string, unknown>;
      if (
        Object.keys(ssh).some((key) => !['host', 'user', 'port', 'key', 'knownHosts'].includes(key)) ||
        typeof ssh.host !== 'string' ||
        !/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(ssh.host) ||
        typeof ssh.user !== 'string' ||
        !/^[a-z_][a-z0-9_-]*$/.test(ssh.user) ||
        typeof ssh.key !== 'string' ||
        !isAbsolute(ssh.key) ||
        typeof ssh.knownHosts !== 'string' ||
        !isAbsolute(ssh.knownHosts) ||
        (ssh.port !== undefined && (!Number.isInteger(ssh.port) || Number(ssh.port) < 1 || Number(ssh.port) > 65535))
      )
        throw invalid();
      Object.assign(environment, {
        AI_CODEX_SSH_HOST: ssh.host,
        AI_CODEX_SSH_USER: ssh.user,
        AI_CODEX_SSH_PORT: String(ssh.port ?? 10022),
        AI_CODEX_SSH_KEY: ssh.key,
        AI_CODEX_SSH_KNOWN_HOSTS: ssh.knownHosts,
      });
      destination = `ssh:${ssh.user}@${ssh.host.toLowerCase()}:${ssh.port ?? 10022}`;
    }
    if (destinations.has(destination)) throw invalid();
    destinations.add(destination);
    return {
      id: entry.id,
      environment,
      ...(entry.maxGames !== undefined ? { maxGames: entry.maxGames as 1 | 2 } : {}),
    };
  });
}
