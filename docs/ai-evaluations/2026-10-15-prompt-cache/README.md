# Instruction-prefix caching — 15 October 2026

The local runner and SSH worker now place trusted game instructions in Codex's
`developer_instructions` block. Stage-specific advice and the current `GAME INPUT`
suffix go on stdin. The six smart evaluation cases share one common-rule hash
across selection, discussion and voting. Regular team turns have a shorter common
prefix than regular non-team turns, preserving their existing advice. `include_environment_context=false` removes irrelevant temporary-directory
metadata. No game facts or strategic instructions are removed. Requests still
use isolated ephemeral sessions, per-call legal-choice schemas and disabled tools.
Private roles, messages, choices and model notes remain in game input, not CLI
arguments. Replies are never cached by Avalon.

This enables the native provider to reuse an eligible instruction prefix; Avalon
does not control cache placement or guarantee a hit. The installed Codex 0.160.0
source derives cache affinity from the session identity and exposes no general
CLI `prompt_cache_key` override. We do not invent such a configuration option,
reuse identities or share conversation history between bots.

## Comparison

The completed run used one repetition of six saved positions in both transport
layouts: 12 planned decisions and a 16-generation ceiling for repairs, at most
two requests concurrently. Model: `gpt-6.1-sol`, medium, Traditional Chinese;
local CLI: 0.160.0.

Both arms use identical current instruction text, game data, output schema,
settings and decision pipeline. `before` sends the entire prompt on stdin using
the previous transport. `after` uses the new instruction/data message boundary.
Their first-call full-prompt hashes must match the recorded measurement. Thus
this comparison does not mix the earlier prompt-deduplication change into the
cache result. Repairs retain their own corrective instructions and context.

Five cases are required strategic targets; the earlier accuser selection is
exploratory. The script records target mismatches rather than making them fatal;
technical errors fail the run. An existing transport failure can retry once and
its attempts are not separately counted by this harness.

Launch order alternates, but cache warmth, routing and model randomness are not
controlled. Earlier probes can warm a provider cache. The old layout can also
receive cache hits; it does not explicitly turn provider caching off.
Three preliminary split-message requests were excluded from the
final comparison but still part of this investigation's subscription usage.

## Interpretation and deployment

`cached_input_tokens` reports reused tokens. `input_tokens - cached_input_tokens`
is the reported uncached portion, not a bill or subscription-quota measurement.
Cached tokens are not necessarily free, and varying output/reasoning lengths can
affect the total. The sample evaluates smart team selection/voting only, not
full-game win rates, regular mode, Lady strategy, Merlin survival or bluff quality.

The pinned production Codex 0.159.2 source includes both configuration keys, but
this local run does not verify that deployed version or a live SSH worker. The
worker protocol is tested against a controlled CLI subprocess. Five Linux-only
launcher checks are skipped on this macOS host. See
[worker-first rollout instructions](../../../deploy/codex-production.md#prompt-cache-reuse-2026-10-15).
Production has not been changed by this task.

Official references:
[prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching),
[configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference),
[Codex 0.160.0 request construction](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/core/src/client.rs),
[Codex 0.159.2 configuration](https://github.com/openai/codex/blob/rust-v0.159.2/codex-rs/core/src/config/mod.rs).

## Earlier layout experiment

The first, rejected layout experiment recorded
24 completed decisions, 10/10 required targets in each arm. Putting **all**
instructions, including stage-specific advice, in one developer block resulted
in 28,672 cached tokens out of 226,688 input after the change, versus 40,576 out
of 228,844 before it. That experiment did not demonstrate savings and prompted
the final common/stage separation. It is not pooled with the final sample.

## Final common-prefix pilot

| Measurement                       | Before |  After |
| --------------------------------- | -----: | -----: |
| Required targets matched (of 5)   |      5 |      5 |
| Exploratory target matched (of 1) |      0 |      1 |
| Generation calls                  |      6 |      6 |
| Input tokens                      | 114418 | 113350 |
| Cached tokens                     |      0 |   7680 |
| Uncached input tokens             | 114418 | 105670 |
| Output tokens                     |   3002 |   3560 |
| Calls with a cache hit (of 6)     |      0 |      1 |

All 12 decisions completed without repairs or technical errors. No required
strategic target regression was observed. All six current cases have the same
shared-rule hash; full prompt hashes still match the earlier deduplication
prompts. The exploratory target is reported separately and is not an acceptance
gate.

In this small run, uncached input decreased by **7.65%**. Only
**1 of 6** new-layout calls reused tokens, so this is evidence of working
cache reuse, not a reliable steady-state saving or a subscription-quota promise.
The earlier layout experiment produced worse reuse; neither run justifies
claiming statistically established cost superiority. Cache warmth and routing
remain uncontrolled, and the final variant has one sample per position.

Final validation: 35 AI suites / **505 tests passed**; worker **21 passed**,
with five Linux-only launcher tests skipped on macOS. ESLint, Prettier and
backend type checking passed (`--rootDir .` avoids the existing backend test
importing a UI helper outside its configured root). A reviewer checked secrecy,
message separation, repairs and worker rollout compatibility. No production
rollout was performed.

The completed pilot scripts and machine exports were removed during YAGNI cleanup on 16 October 2026.
