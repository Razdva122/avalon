# Incremental input for persistent bot sessions

The experimental persistent runner now sends an initial snapshot, followed by exact state updates. It does not summarize or infer game facts.

The requested real-game comparison has now completed: see [live results and quality assessment](live-comparison.md). The replay-only figures below describe the earlier representation check, not the measured costs of the two new live games.

- The stable developer message contains the existing tool/input guard, shared claim-output guide and update protocol.
- `commonRules` sends the shared game instructions on initialization, and replaces them only when their actual content changes. This includes regular bots moving between team and mission-card stages.
- `rules` replaces stage-specific instructions only when changed. Older stage advice is no longer current.
- `state.set` sends changed or newly introduced fields; `state.remove` explicitly deletes obsolete fields.
- For arrays, the encoder can remove leading entries and append new ones when this is smaller than replacement. It preserves identical repeated messages. Otherwise it sends the replacement array.
- Unchanged role knowledge, personality, rules and history are retained in the player's session. Corrections and changing legal actions are preserved. Dropping old entries from a recent-chat window does not retract historical facts.
- Each player's encoder belongs to its own runner and thread. A failed native request quarantines that runner, so a later delta cannot silently skip an unsuccessful update.
- Actual delta text is recorded in the private decision trace as `payload.sessionInput`; `submittedInputBytes` records its UTF-8 size. Existing `inputBytes` still describes the logical full prompt. Neither byte count is API token usage.

## Replay validation, zero inference calls

```sh
node docs/ai-evaluations/2026-10-15-session-deltas/replay.cjs
```

The replay uses the two previously completed games. For each player separately, it applies every update and asserts deep equality with the original snapshot. It also reconstructs the complete instruction text and asserts exact equality.

| Saved game                                       | Requests | Exact snapshots and instructions | Original new user text | Incremental new user text | Reduction |
| ------------------------------------------------ | -------: | -------------------------------: | ---------------------: | ------------------------: | --------: |
| Fresh-session game, replayed as persistent input |       54 |                          54 / 54 |          967,914 bytes |             538,178 bytes |     44.4% |
| Persistent-session game                          |       84 |                          84 / 84 |        1,667,150 bytes |             755,319 bytes |     54.7% |

Counting the developer message once per player as well, the reductions are 44.7% and 54.8%. Full per-update measurements are in `results.json`.

These are **UTF-8 text sizes**, not token or quota savings. The model still processes conversation history, may receive native context compaction, and may interpret updates differently. Replay proves exact recoverability of supplied data and instructions; it does not prove that an LLM maintains this state without reasoning errors. Subsequent real-game measurements are recorded separately in `live-comparison.md`.

## Available experiment

The old benchmark explicitly retains snapshot mode to reproduce its recorded results. The new mode can be exercised with:

```sh
# Complete two engine-only games; no model calls:
node docs/ai-evaluations/2026-10-15-bot-sessions/compare.cjs --session-deltas
# Two real games, if explicitly selected for a subsequent measurement:
node docs/ai-evaluations/2026-10-15-bot-sessions/compare.cjs --session-deltas --run
```

Live results are written here as `live-results.json` and separate traces, preserving the previous comparison. The harness refuses to overwrite the existing live report. The per-bot runner defaults to delta mode; the production game service still uses its existing fresh-session runner. This change does not enable persistent sessions in production.
