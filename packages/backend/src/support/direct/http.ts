// URLs come exclusively from server configuration. Never accept a client URL or redirect.
export async function readHTTP(url: string, body?: unknown, apiKey?: string, allow404 = false): Promise<unknown> {
  const response = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  if (allow404 && response.status === 404) return null;
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error('provider_unavailable');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('invalid_response');
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    let next = await reader.read();
    while (!next.done) {
      length += next.value.length;
      if (length > 4 * 1024 * 1024) throw new Error('response_too_large');
      parts.push(next.value);
      next = await reader.read();
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  }
  const text = Buffer.concat(parts).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_response');
  return value as Record<string, unknown>;
}
export async function rpc(url: string, method: string, params: unknown[]): Promise<unknown> {
  const result = record(await readHTTP(url, { jsonrpc: '2.0', id: 1, method, params }));
  if (result.error || result.jsonrpc !== '2.0' || result.id !== 1 || !('result' in result))
    throw new Error('rpc_unavailable');
  return result.result;
}
