/** Error acknowledgements must never be stored as successful response data. */
export function isSocketError(value: unknown): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string';
}
