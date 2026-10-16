# Prompt duplication pilot — 15 October 2026

This pilot compresses repeated conversation, evidence-maintenance and secrecy
instructions in `client.ts` and `pipeline.ts`. It retains all game inputs, legal
choices, output schemas, model settings and the existing strategic checks.
Lady strategy changes already present in the working tree are included in both
arms. No production settings or running rooms are changed.

The comparison froze the instructions immediately before the edit and held
observer input, schemas and settings constant. It did not use the older baseline
embedded in the maintained decisive-match fixture.

## Recorded method

The live run uses `gpt-6.1-sol`, medium reasoning, Traditional Chinese, two
repetitions of six positions per arm: 24 planned decisions, with a 28-generation
ceiling to allow repairs. At most two calls run concurrently. Launch order
alternates; caching and backend model variability are not controlled. The
existing transport can retry a failed generation once; its attempts are not
separately counted by this harness.

The run recorded completed decisions, token usage and request hashes. Five cases per repetition are required strategic
regression targets. The earlier accuser selection is exploratory and must be
reported separately. The harness exits nonzero for technical errors; strategic
target mismatches are recorded in `passed` and require inspection.

There were four completed preliminary decisions on an earlier
candidate. Review identified ambiguous wording about bluffing; it was corrected
before the final run. One additional in-flight request was cancelled. These
preliminary decisions are excluded from the final comparison, not from the
fact that the investigation consumed subscription usage.

## Limits

This is a small diagnostic sample of **smart team-selection and team-voting
decisions**, including preselection discussion. It does not measure match win
rate, regular-mode strategy, assassination, Lady choices, successful deception,
or Merlin survival. Passing the targets does not prove statistical
non-inferiority. Existing automated AI tests cover mechanics and prompt
contracts, and are not a substitute for playing-strength measurements.

Text reduction and reported input/output tokens are different measurements.
Codex usage includes runtime context beyond the supplied prompt. Token savings
cannot be converted into an equal percentage of account subscription quota;
cache warmth and output/reasoning length can change the total cost.

## Results

| Measurement                 | Before |  After |
| --------------------------- | -----: | -----: |
| Required targets matched    |     10 |     10 |
| Exploratory targets matched |      0 |      0 |
| Generation calls            |     12 |     12 |
| Reported input tokens       | 231048 | 228844 |
| Reported output tokens      |   6505 |   6026 |
| Cached input tokens         |      0 |      0 |

Required targets: 10 per arm (five positions twice); exploratory targets: two
per arm. All 24 decisions completed without repair or technical errors. No
required-target regression was observed. Both arms missed the exploratory exact
roster target twice; this is not counted as a pass or hidden in the gate.

The supplied text is 968 characters shorter per case: **3.70%** across
these six prompts. Reported input fell by **2,204 tokens (0.95%)** across
12 decisions per arm. Input plus output fell by
**1.13%** in this run. The output difference is observational noise/behavior,
not a guaranteed saving attributable to deduplication. The counts above are the retained measurements.

Validation of the final code: 35 AI suites / 501 tests passed; ESLint and
Prettier passed. Backend type checking passed with `--rootDir .`; the default
backend command encounters the existing TS6059 issue from
`player-boards/routes.test.ts` importing a UI helper outside backend `rootDir`.

Keep this as a small, measured reduction. Further compression should have its
own unchanged-input comparison and include other stages before making broader
playing-strength claims.

The completed pilot scripts and machine exports were removed during YAGNI cleanup on 16 October 2026.
