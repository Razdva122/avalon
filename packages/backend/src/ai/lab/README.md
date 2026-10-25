# AI lab (offline evaluation)

Dev-only scripts for measuring the bots. Nothing here runs in production. Bots run through the local Codex CLI on its
ChatGPT login, as production does; no API key is needed.

## Bots against human seats

`human-play.ts` runs a bot table where one or more seats go through the room's own human path, without turn timers.
Each human seat gets a file mailbox, and `seat.ts` is the command a person or an agent plays it with: `wait` prints
the turn as that seat sees it, `answer` submits a JSON answer and prints the next turn. `AI_LAB_SEED` repeats the
deal (seats, roles, first leader and bot profiles); `--deal-only` prints a seed's human roles without model calls
and `--fake-bots` checks the mailbox flow for free. `--bots=old` (with `AI_LAB_BASELINE` from `make-baseline.ts`)
plays an earlier version, and `--evil-bots=old|new` gives the Evil seats another version than the Good ones.

```sh
AI_LAB_SEED=5 npx ts-node --transpile-only src/ai/lab/human-play.ts --players=7 --humans=2 --deal-only
AI_LAB_SEED=5 npx ts-node --transpile-only src/ai/lab/human-play.ts --players=7 --humans=2 --bots=new \
  --dir=/tmp/hp/5-new --out=/tmp/hp-5-new.json
node --no-warnings src/ai/lab/seat.ts /tmp/hp/5-new/human-1 wait
node --no-warnings src/ai/lab/seat.ts /tmp/hp/5-new/human-1 answer 3 '{"vote":"reject","say":"4 again? no."}'
npx ts-node --transpile-only src/ai/lab/make-baseline.ts fb9bbbf6 /tmp/baseline-ai   # the original bots
```

Every game log lists its model calls with phase, reasoning and Codex token usage; `--fake-model` runs the real
pipelines on canned replies instead, to count calls and prompt sizes for free.

## Measuring logged games (no model calls)

```sh
# Right-answer benchmark: every decision the revealed roles settle, logged vs current guards.
# --fixture rewrites fixtures/human-table-positions.json for real-positions.test.ts.
npx ts-node --transpile-only src/ai/lab/decision-bench.ts [--flips] [--fixture=<file>] /tmp/hp-*.json
# Bot chat scorecard per build: length, jargon, "I" openers, generated-text typography, passes.
npx ts-node --transpile-only src/ai/lab/chat-score.ts /tmp/hp-*.json
# The assassin: Merlin's rank in merlinCandidates, logged shots and shots after the guard.
npx ts-node --transpile-only src/ai/lab/assassin-eval.ts /tmp/hp-*.json
# Tokens per game, per bot turn and per call phase.
npx ts-node --transpile-only src/ai/lab/token-report.ts /tmp/hp-*.json
```

`AI_DECISION_GUARDS=off` disables the guards, which isolates the analysis block's effect on the model's choices.

## Short model calls on logged turns

```sh
# What the speaker would say on logged spoken turns (decision taken from the log, only short calls run).
npx ts-node --transpile-only src/ai/lab/speak-probe.ts --limit=10 --stage=discussion [--role=merlin] /tmp/hp-*.json
```

Earlier one-off tools (the paid-API runner, self-play, cross-play, scorecards, calibration, Merlin-vote rates and
re-asking logged decisions) are in the git history.
