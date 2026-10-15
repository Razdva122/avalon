# One Codex session per bot: full-game pilot

User-approved scope: two complete five-player games, one per mode.

## Result

Session reuse did not save measured usage in this pilot. More input was cached, but growing history and a longer game outweighed it. Keep the production default as fresh sessions; the new runner is experimental and is used only by this harness.

Subsequent change: [incremental session input](../2026-10-15-session-deltas/README.md) replaces repeated snapshots with exact updates. The benchmark defaults explicitly to the original snapshot mode; `--session-deltas` selects the new mode and saves into a separate directory. The measurements below remain the original full-snapshot pilot.

The table covers play through assassination. Five post-game conclusions per mode are accounted for separately below.

| Metric                                       |         Fresh session per request |            One session per bot |
| -------------------------------------------- | --------------------------------: | -----------------------------: |
| Completed games                              |                                 1 |                              1 |
| Played missions                              |                                 4 |                              5 |
| Model generations during play                |                                54 |                             84 |
| Input tokens, including cached               |                           810,393 |                      3,931,750 |
| Cached input tokens                          |                            71,936 |                      2,456,576 |
| Share of input cached                        |                              8.9% |                          62.5% |
| Generations with a cache hit                 |                            9 / 54 |                        62 / 84 |
| Uncached input tokens                        |                           738,457 |                      1,475,174 |
| Mean uncached input per generation           |                            13,675 |                         17,562 |
| Output tokens, including reasoning           |                            18,238 |                         23,174 |
| Peak input for one generation                |                            16,552 |                         93,626 |
| Wall time, including conclusions             |                         13.46 min |                      19.27 min |
| Failed generation results / technical pauses |                             0 / 0 |                          0 / 0 |
| Winner                                       | Good: assassination missed Merlin | Evil: assassination hit Merlin |
| Account weekly remaining snapshot            |                         79% → 78% |                      78% → 76% |

During play, the per-bot game used **99.8% more uncached input overall**, with **55.6% more generations**. Mean uncached input per generation rose **28.4%**. Mean output per generation fell 18.3%. These are observations from different game paths, not causal estimates for session reuse.

Including the five conclusions, totals were 59 versus 89 generations, 811,342 versus 1,541,753 uncached input tokens, and 19,994 versus 24,883 output tokens. Observed weekly account consumption was approximately 1 versus 2 percentage points; the account-wide integer readings do not isolate this experiment from other account activity.

### Playing quality

Both games completed with legal parsed decisions, no technical pauses, and no public-speech guard rejection. The narrow automated check found no Good approvals of a team containing an individually known Evil player (one applicable decision in fresh, two in per-bot). Neither game presented an Evil mission-card opportunity to win immediately at two failures, so that check has no applicable cases. These checks do not certify every deduction or every possible information leak.

Concrete observations:

- In fresh mode, Good recovered after the opening failure and won three missions. Evil selected seat 3 for assassination; Merlin was seat 5. Evil compared early preferences for seats 2 and 4 and explicitly acknowledged ordinary explanations for those choices.
- In per-bot mode, Evil persuaded Good seat 3 to prefer `5, 3, 4` after the first failure; hidden Mordred at seat 4 supplied the second Fail. This is a successful observed bluff/coalition, without proving that session memory caused it.
- During the third mission, Good seat 3 repeatedly rejected `5, 2` in favor of including itself. This created additional proposals and model calls. Its private explanation used its own known Good alignment and the possibility of a forced proposal; it was not a JSON or rule-validity error.
- In the per-bot assassination, Evil selected seat 5, comparing its early exclusion of Evil seat 1 before the opening failure against seat 2's later accusation based on its own card. This hit Merlin. Early public statements differed between games, including seat 3's first preferred roster, so this is not evidence of better assassination skill from memory alone.

One match per mode cannot establish unchanged playing strength or a win-rate improvement. The result supports leaving session reuse experimental. A separate candidate experiment would reduce repeated full-state snapshots inside a session; that change was deliberately excluded from these games and has not been evaluated.

### Verification

- Both `BotRoom` instances reached `finished`; initial seats and roles match exactly.
- The per-bot pool created exactly five sessions; no owned temporary profile remained after cleanup.
- 35 backend AI test suites / 506 tests passed. TypeScript, ESLint and source formatting checks passed.
- `usage-validation.json` checks a real resumed turn: cumulative deltas match native last-turn input, cache, output and reasoning counts.

## Method

- Real `BotRoom`, `decisionPipeline`, structured-output parser and public-speech guards.
- `gpt-6.1-sol`, medium reasoning, Russian, the first five existing personalities.
- Identical seeded role assignment, starting leader and random assassin selection.
- `fresh`: the existing ephemeral `runCodex` runner for each generation.
- `per-bot`: one explicit Codex thread UUID per player during play, continued with `codex exec resume`.
- Every turn still receives current instructions and the full current game snapshot. This tests session reuse without simultaneously compressing observations or changing strategy.
- Five post-game conclusions use fresh sessions in both modes and have separate accounting. They happen after the match and must not inherit in-game confidentiality constraints.
- Both modes use the same private temporary CODEX_HOME, with a symlink to existing ChatGPT authentication, no profile config or profile-installed skills, and tools disabled. HOME and other native discovery behavior stay the same for both arms; global skill discovery is not disabled. Experimental work directories stay outside the repository. Original authentication is never copied into the report.
- Session histories are isolated by player and removed together with the temporary profile in `finally`. SIGINT/SIGTERM stop the room and abort active generations before cleanup.
- At most two normal technical-pause resumes, recorded in `pauses`. Rejected decisions are never applied; no prompts or moves are substituted. A failed session runner is quarantined because an interrupted turn may already be present in history.

## Accounting

Codex CLI 0.160.0 emits cumulative thread totals in `turn.completed.usage`. Resumed calls therefore return the delta from the preceding completed turn, including cached and output tokens. Ordinary fresh calls are unchanged.

Reference: official [Codex JSONL processor](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/exec/src/event_processor_with_jsonl_output.rs), `usage_from_last_total`.

Input includes cached tokens. Uncached input = input − cached. Report totals and per-generation means; output includes reasoning, so reasoning is a subset and must not be added again. Token counts are not a formula for subscription quota charges.

Quota snapshots are account-wide, coarse, and can include other account activity. Missing usage on interrupted calls is unknown, not zero.

## Preliminary run

The first launch was stopped during mission 1 after review found that resume could use the repository working directory. The corrected runner explicitly sets its OS working directory to the owned experiment directory. `preliminary-results.json` and `preliminary-fresh-traces.jsonl` preserve this excluded launch: six generations have reported usage (83,314 input; 1,808 output), and two more were started without final usage. These requests are excluded from both comparison arms but did consume account resources.

## Reproduction and files

```sh
# Engine-only checks, no model calls:
node docs/ai-evaluations/2026-10-15-bot-sessions/compare.cjs
# Two real games; refuses to overwrite existing live results:
node docs/ai-evaluations/2026-10-15-bot-sessions/compare.cjs --run
```

`results.json` holds per-generation usage, choices, private reasoning, public speech, checkpoints and quota snapshots. Each mode's `*-traces.jsonl` contains private model inputs and raw replies. Do not feed this combined diagnostic data back to individual players.

Run `node docs/ai-evaluations/2026-10-15-bot-sessions/analyze.cjs` to rebuild `summary.json`, including per-stage accounting and the complete post-game review context under `finalPublicRecord`. The completed pilot's raw manager checkpoints serialize history callbacks as null; use the trace/review contexts for historical votes and rosters. The harness now records observer state for future runs; this recording-only correction did not change either game's bot inputs.

## Interpretation

The same opening does not imply the same game: model decisions change later rosters, votes and match duration. Totals describe these games, not an isolated causal saving. One game per mode cannot establish win rate or demonstrate unchanged playing strength. Inspect legality, pauses, factual contradictions, role disclosure and concrete tactical choices alongside the token measurements.
