export const AI_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
export const AI_WORKER_QUEUE_TIMEOUT_MS = 10 * 60 * 1000;
export const AI_PAUSE_TIMEOUT_MS = 15 * 60 * 1000;
// Cover queueing and execution for the initial request and one retry, plus persistence.
export const AI_LEASE_MS = 2 * (AI_REQUEST_TIMEOUT_MS + AI_WORKER_QUEUE_TIMEOUT_MS) + 2 * 60 * 1000;
