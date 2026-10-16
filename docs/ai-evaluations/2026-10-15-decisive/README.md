# Decisive Good-player choices

15 October 2026. Diagnostic replays use **gpt-6.1-sol, medium**, Traditional
Chinese, and the original personality, human testimony and model hypotheses.
The six sanitized positions retain only the observer's visible roles and own
cards. Each call starts a separate decision pipeline; no database, running game
or production setting is changed.

Five positions are required regression targets: the second-mission Good vote,
both final-mission discussion preferences and both final votes. The earlier
accuser selection is exploratory: its information does not uniquely establish
the safest roster, so it was excluded from the gate before any inference.

| Revision                                                               | Required choices matched |
| ---------------------------------------------------------------------- | ------------------------ |
| Original instructions and context                                      | 0 / 5                    |
| Historical score, coalitions, voting contrasts and decisive comparison | 4 / 5                    |
| Additional comparison of known Good seats and information bets         | 4 / 5                    |
| Roster consistency check and final replay                              | 5 / 5                    |

The second revision corrected the early vote but exposed a separate output
contradiction: the private explanation selected `2,4,5,6`, while the action was
`1,2,4,6`. The existing guard checked only bracketed private declarations.
Regression tests now cover ordinary explicit lists in private and public words,
one fresh decision, and a pause if the contradiction persists. Historical,
conditional, negative and ambiguous lists are excluded conservatively.

The final model replies selected `2,4,5,6` in both final discussions and rejected
`2,3,4,6` in both final votes. Their explanations weighed Success when Evil
already had two failures, selective support for `3`, and the existing four-vote
coalition against the unanswered question to `5`. The early Good voter also
rejected `3,4,5` rather than replace a known Good seat with an extra unknown.

The recorded diagnostic included intermediate failures. Its one-off machine
export was removed during YAGNI cleanup on 16 October 2026; the maintained
regression fixture and evaluator remain in backend.
This is sequential diagnosis, with one sample per position per revision. It is
not a blinded benchmark, a complete match, or a guarantee of future choices,
Good win rate or Merlin survival. The consistency guard does not interpret all
possible natural-language declarations. No roster or vote is chosen by the
server from these regression targets.

Reproduce from the repository root with an authenticated Codex CLI:

```sh
# Dry run: list cases without inference.
npx ts-node --project packages/backend/tsconfig.json packages/backend/src/ai/evaluate-decisive-match.ts

# Latest instructions, six positions, at most twelve logical generation calls.
npx ts-node --project packages/backend/tsconfig.json packages/backend/src/ai/evaluate-decisive-match.ts --run --output=/private/tmp/avalon-decisive-results.json
```

`--variant=both` compares the saved original prompt/context with the latest
version. A repair can use an extra generation; an incomplete run returns
nonzero. Required latest-version mismatches or errors also return nonzero.
The exploratory selection and original-baseline mismatches are informational.
Transport retries follow the existing `runCodex` behavior.
