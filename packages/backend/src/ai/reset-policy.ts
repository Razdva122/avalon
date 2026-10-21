import type { ConsumeAiBotResetRequest } from '@avalon/types';

export function validBotResetRequest(value: unknown): value is ConsumeAiBotResetRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const request = value as Record<string, unknown>;
  return (
    Object.keys(request).every((key) => ['instanceID', 'idempotencyKey', 'creditId'].includes(key)) &&
    typeof request.instanceID === 'string' &&
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/.test(request.instanceID) &&
    typeof request.idempotencyKey === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(request.idempotencyKey) &&
    (request.creditId === undefined ||
      (typeof request.creditId === 'string' && request.creditId.length > 0 && request.creditId.length <= 512))
  );
}
