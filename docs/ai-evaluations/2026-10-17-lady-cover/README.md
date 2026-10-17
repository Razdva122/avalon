# Lady cover and Mordred exposure

17 October 2026. Evil now compares the inspection target and intended announcement
together instead of treating ally control plus a false Good result as the default.
The shared advice reaches regular and smart bots at both inspection stages. It
compares publicly credible alternatives, trust, alliance exposure and the value
of any remaining checks. After mission four there is no later check to control.

Mordred additionally considers Merlin's information: falsely calling a visible
Evil target Good reveals a lying bot, and an Evil checker absent from Merlin's
visible Evil can be identified as Mordred. This is Merlin's deduction, not
necessarily public proof. Other lies require Merlin to establish their falsity;
unseen players are not automatically known Good. Already lost secrecy is not
charged twice. Decisive Evil gains can justify exposure; no target, truth quota
or announcement is forced by the server.

## Saved-position comparison

Six saved decision traces from completed Codex games without human players were
selected before inference. Inputs stayed on the production server and used its
configured Codex worker. The user explicitly authorized sending these private
contexts to OpenAI through Codex. No active game, service configuration or database
document was changed. This experiment used fresh independent calls, not live bot
sessions or simulated continuation of a changed game.

Each position received two calls per variant with `gpt-6.1-sol`, medium: 24
completed calls. Both variants used the identical saved context, personality,
memory, legal choices and original instructions. The after variant appended the
exact new `evilLadyAdvice`; this isolates that addition instead of comparing
unrelated historical prompt changes. Integration tests separately verify its
delivery through the current pipeline and legacy system prompt.

| Saved position                                                            | Before, two samples        | After, two samples         |
| ------------------------------------------------------------------------- | -------------------------- | -------------------------- |
| P1: Mordred target, after mission 3, score 1 success / 2 failures         | Known Evil, Known Evil     | Other target, Other target |
| P2: Mordred target, after mission 3, score 1 / 2                          | Other target, Other target | Other target, Other target |
| P3: Mordred announcing an actual Evil result, score 1 / 2                 | Good, Good                 | Good, Good                 |
| P4: Mordred announcing an actual Evil result, score 2 / 1                 | Good, Good                 | Good, Evil                 |
| P5: Morgana target, after mission 2, score 1 / 1                          | Other target, Known Evil   | Other target, Other target |
| P6: Morgana announcing an actual Evil result after mission 4, score 2 / 2 | Good, Good                 | Good, Good                 |

Known Evil means visible as Evil in the acting bot's private knowledge. Other
target does not certify Good: it can be unknown, including to bots unaware of
Oberon. These categories measure selection of known allies, not every target's
revealed alignment.

Known-Evil selections fell from 3/6 to 0/6. Mordred's false Good announcements
fell from 4/4 to 3/4, not to zero. All four after Mordred announcement explanations
contained the Merlin keyword versus none before. This keyword check is only an
auxiliary signal; it does not establish correct reasoning or a good tradeoff.
Generated explanations were not retained in the comparison output beyond keyword
flags, so their detailed tactical justification was not independently scored.

P1 is the clearest observed action improvement: the same ally transfer disappeared
in both repeats. P2 preserves a different target. P4 demonstrates that Mordred is
still allowed to expose an ally rather than himself. P3 and P6 also show the
limit: false Good results remain available and were retained close to a decisive
mission. At announcement the original target is already fixed; changing that
result is not equivalent to choosing a different target earlier. No subsequent
mission outcome was replayed, so these choices do not prove stronger overall play.

Measured usage: 323,644 input tokens, including 7,680 cached; 10,876 output tokens,
including 6,407 reasoning tokens. All 24 calls completed in one attempt, with no
unknown-usage attempts reported. Two samples per position are exploratory, not a
reliability estimate, an unbiased population sample, or a win-rate comparison.
Private contexts and diagnostic exports were not added to the repository.

## Verification

- New forwarding regression tests failed before the addition and passed after it.
  They cover both difficulties and both stages, retaining the original legal
  choices and allowing a tactical false announcement from Mordred.
- All 38 backend AI suites passed: 522 tests. MongoDB tests required execution
  outside the sandbox because its port restrictions initially caused EPERM.
- Changed TypeScript files passed ESLint, Prettier and diff checks. Independent
  code review found no actionable issues.
- Backend TypeScript passed with `--rootDir .`. The default configuration still
  reports the existing TS6059 import of a UI helper from `player-boards/routes.test.ts`.

This is a local code change and an isolated evaluation; production behavior has
not been deployed.

The [expanded Mordred study](../2026-10-17-mordred-lady-expanded/README.md) examines
the truthful-Evil alternative separately and audits whether Mordred was already
identifiable to Merlin before the decision.
