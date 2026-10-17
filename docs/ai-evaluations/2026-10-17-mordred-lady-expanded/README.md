# Expanded Mordred Lady study

17 October 2026. Follow-up to [the initial Lady study](../2026-10-17-lady-cover/README.md),
testing whether the advice leaves room for inspecting Evil and truthfully announcing
Evil, rather than replacing ally whitewashing with automatic ally avoidance.

## Method

The available completed Codex games without humans contained seven distinct
Mordred inspection events, each with a saved selection and announcement trace:
14 saved decision positions from seven games. All seven selections had at least
one legal target privately known as Evil. Latest decision traces were deduplicated
by game, actor and stage. No positions were invented or selected for a desired
answer. These seven games overlap the earlier study; the studies are not
independent samples.

The user explicitly authorized the expanded private-context export to OpenAI
through Codex, 28 generations and retention of full responses. The production
server used its existing worker with `gpt-6.1-sol`, medium, fresh calls, and at
most two concurrent flows. Each saved instruction set received the exact current
`evilLadyAdvice` addition. Other historical instructions, context and memory were
preserved; this is not a replay with all current prompt changes substituted.
No production game, configuration or database document was changed.

Each game contributed four calls:

1. **Normal inspection:** choose a target without a diagnostic question.
2. **Linked announcement:** continue that new choice, revealing only that target's
   actual alignment from the completed replay. Carry over the newly generated
   public inspection statement, evidence and choice note using the pipeline's
   bounded formats. Use the matching saved announcement instructions. This is a
   simulated inspection-to-announcement transition, not an engine-driven game
   continuation. No other hidden roles or future events enter the model input.
3. **Saved announcement:** independently replay the historical announcement on
   its original target and private result. This is not the continuation of call 1.
4. **Explicit comparison:** return to the original inspection input and privately
   ask the model to compare a legal known-Evil target plus truthful Evil result
   with its preferred alternative. This prompt changes the decision setting and
   is diagnostic evidence, not spontaneous play.

Full generated replies, private explanations and source context snapshots remain
in local temporary diagnostic files, outside the repository. `publicReason` fields
from announcement replies are generated text, not published game statements;
the live announcement path uses the selected result. Results below score choices
and private explanations, not those unused generated public fields.

A mock-only harness verified all 28 calls, selected-target alignment, carryover
of fresh evidence/chat/notes, and separation from the historical target. An
independent review found no input or transition issues. It noted that `runCodex`
can retry transport failures: the guard bounds logical generations, not underlying
attempts. The completed run reported exactly 28 attempts, no retries and no
unknown-usage attempts.

## Results

| Case | After mission | Score, Good / Evil | Normal selection → linked announcement | Historical target → saved announcement | Already identifiable to Merlin           |
| ---- | ------------: | ------------------ | -------------------------------------- | -------------------------------------- | ---------------------------------------- |
| H01  |             3 | 1 / 2              | Good → Evil                            | Evil → Good                            | Yes                                      |
| H02  |             3 | 1 / 2              | Good → Evil                            | Good → Evil                            | Yes                                      |
| H03  |             2 | 2 / 0              | Good → Evil                            | Good → Good                            | No unique deduction in the factual audit |
| H04  |             3 | 2 / 1              | Good → Good                            | Evil → Evil                            | No unique deduction in the factual audit |
| H05  |             2 | 2 / 0              | Good → Evil                            | Evil → Evil                            | No unique deduction in the factual audit |
| H06  |             3 | 1 / 2              | Good → Good                            | Good → Good                            | Yes                                      |
| H07  |             2 | 2 / 0              | Good → Evil                            | Evil → Evil                            | No unique deduction in the factual audit |

Target alignments in this table are actual replay alignments, not assumptions
that an unknown target is Good.

- **Normal selection:** all 7 targets were actually Good. No unprompted complete
  Evil-target / Evil-announcement branch occurred. Five linked announcements
  falsely accused Good; two reported Good truthfully.
- **Historical Evil targets:** Mordred announced Evil truthfully in 3/4 cases.
  In H04, H05 and H07 the private explanations explicitly weighed losing the
  ally's cover against revealing Mordred to Merlin. These are actual announcement
  choices, but the target was fixed by history, not selected by the new model.
- **Explicit comparison:** all 7 explanations assessed a legal known-Evil target
  with a truthful Evil result and rejected it for that position. Six selected a
  Good target; H01 selected Evil with an intended false Good result. The rejection
  rationales included the ally's lost cover, scarce sabotage access near a
  decisive mission, Mordred's concealment and whether later Lady control would
  still matter. This demonstrates ability to assess the option when asked, not
  evidence that it is routinely compared without prompting.
- **Unprompted conditional plan:** H07's normal inspection explanation considered
  truthfully exposing the inspected player if the unknown target proved Evil,
  to buy credibility for later Evil inclusion. The selected player was actually
  Good. This is evidence of a conditional truthful-Evil plan, not a deliberate
  selection of an already known ally followed by a truthful Evil announcement.

## Exposure audit and limits

An independent factual calculation used Merlin's actual visible Evil set and
known own Good seat, then enumerated possible locations of the one hidden
Mordred. Candidates had to satisfy every completed mission's Fail lower bound and
every public Lady claim made by a hypothesized Good bot, which must be truthful.
Model testimony, role claims and notes were not treated as proof. The true Mordred
remained feasible in all seven cases.

The existing record already left exactly one Mordred candidate in H01, H02 and
H06. In H01 and H02, the prior checker's Evil result was therefore more than a
bare accusation: the missions excluded that checker from being the hidden Evil,
making the truthful-bot rule decisive. In those positions, another lie need not
lose a still-hidden identity. The other four cases retained two or four candidates
under these factual constraints. This audit was not supplied to the model and
does not measure whether a played Merlin actually made the deduction. H06's
generated reasons still value protecting an identity that this audit could already
resolve, so the risk assessment is not consistently calibrated.

All seven events are near a decisive score: one side already has two mission
wins. There are no early neutral-score Mordred examples in this all-bot Codex
sample. Each phase has one sample per position, and no downstream mission or win
rate was simulated. The earlier study's samples cannot turn these into repeated
trials of the same new protocol.

The supported conclusion is narrow: truthful Evil announcements remain available
and are actually chosen on fixed Evil targets, and the model can assess the full
Evil-target / truthful-Evil plan. The run does **not** establish that it will
spontaneously choose that full plan when it is best. Zero such branches also does
not establish that the alternative is never considered internally or that these
seven target choices were strategically wrong.

Usage for the 28 completed calls: 357,106 input tokens, including 25,472 cached;
15,595 output tokens, including 11,150 reasoning tokens. Instructions were not
changed after observing these results, and no deployment was performed.
