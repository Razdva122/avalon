# AI evaluation records

The current website rollout and private production report are documented in
[the site session experiment](2026-10-15-site-session-ab/README.md).

The earlier pilots retain their scripts, explanations and final measurements in
Git. Full model inputs/outputs and intermediate runs remain in their original
local directories, excluded by each experiment’s local `.gitignore`.
No raw files were deleted or moved. A fresh checkout therefore does not contain
all inputs needed to replay these historical measurements.

| Pilot                                                                        | Retained measurements                                                                                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Prompt duplication](2026-10-15-prompt-dedup/README.md)                      | `summary.json`                                                                                                                          |
| [Prompt caching](2026-10-15-prompt-cache/README.md)                          | `summary.json`                                                                                                                          |
| [Persistent sessions with full snapshots](2026-10-15-bot-sessions/README.md) | `summary.json`, `usage-validation.json`                                                                                                 |
| [Incremental session input](2026-10-15-session-deltas/README.md)             | Replay byte counts in `results.json`; live measurements in `live-summary.json`, `live-input-verification.json` and `live-comparison.md` |

Historical replay/analysis scripts expect their local raw files alongside them;
restore those files from a private archive to reproduce a saved run. Inference
commands using `--run` consume the authenticated Codex account's quota. Scripts
can be syntax-checked with `node --check` without running an experiment.

Production request costs and game traces live privately in MongoDB, separately
from these controlled pilot artifacts. They are not exported into this directory.
