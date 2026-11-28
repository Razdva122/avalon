/** Error acknowledgements must never be stored as successful response data. */
export function isSocketError(value: unknown): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string';
}

/** Server error codes map to existing `errors.*` translations; anything else gets a generic message. */
export function serverErrorKey(error: unknown, exists: (key: string) => boolean): string {
  const key = typeof error === 'string' && error ? `errors.${error}` : '';
  return key && exists(key) ? key : 'errors.requestFailed';
}
