export const AI_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
export const AI_PAUSE_TIMEOUT_MS = 15 * 60 * 1000;
// Cover the initial Codex request and one retry, plus persistence and bot message pauses.
export const AI_LEASE_MS = 2 * AI_REQUEST_TIMEOUT_MS + 2 * 60 * 1000;
