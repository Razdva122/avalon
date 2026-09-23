export const AI_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
// Cover the entire HTTP request plus persistence and the pause between bot messages.
export const AI_LEASE_MS = AI_REQUEST_TIMEOUT_MS + 2 * 60 * 1000;
