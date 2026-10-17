# Mordred predictability: paired saved-position comparison

17 October 2026. Mordred's Lady advice now includes the cost of a recognizable
strategy when comparing plans of similar value. It explicitly considers a legal
known-Evil target with a truthful Evil announcement, if such a target exists.
Potential gains are Mordred's concealment, later Evil control of the Lady and a
less readable policy; the ally's lost cover is still a real cost. The advice does
not prescribe quotas or rotation. Concrete winning access, the Fail threshold
and a reachable coalition take priority over variety.

The shared advice reaches both difficulties at inspection and announcement. It
does not enter the mission-card or team-vote instructions. This changes the
model's comparison, not the legal actions or a server-side strategy selector.

## Paired Lady experiment

The [expanded study's](../2026-10-17-mordred-lady-expanded/README.md) seven saved
Mordred inspection starts from completed Codex games without humans were replayed
before and after the new paragraph. Each selection was followed by an announcement
on the newly selected target: seven starts, two variants, two actions = 28 calls.
The original contexts and all earlier Lady advice were identical between variants.
The only initial difference was the predictability paragraph. There was no extra
diagnostic comparison prompt.

Each linked branch received only its selected target's actual alignment, plus
that branch's new public inspection statement, evidence and choice note. Matching
historical announcement instructions served as stage templates; historical target
and statement were not transplanted into the new branch. Continuations simulate
only the inspection transition, not a complete engine-driven game. Variant order
alternated by case. Model: `gpt-6.1-sol`, medium, independent fresh calls with at
most two concurrent flows. Each branch has one sample.

| Case | Score, Good / Evil | Before: target → announcement | After: target → announcement |
| ---- | ------------------ | ----------------------------- | ---------------------------- |
| H01  | 1 / 2              | Good → Evil                   | Good → Evil                  |
| H02  | 1 / 2              | Good → Evil                   | Good → Evil                  |
| H03  | 2 / 0              | Good → Evil                   | Good → Evil                  |
| H04  | 2 / 1              | Good → Evil                   | Evil → Good                  |
| H05  | 2 / 0              | Good → Good                   | Evil → Evil                  |
| H06  | 1 / 2              | Good → Good                   | Good → Good                  |
| H07  | 2 / 0              | Good → Good                   | Good → Good                  |

Target labels are actual replay alignments; both after Evil targets were also
privately known allies before selection. H05 is the desired complete sequence:
Mordred selected the ally, privately planned a truthful Evil result, and then
announced Evil after inspecting. The reason weighed sacrificing the ally's cover
against gaining personal credibility and retaining a possible later Evil holder.
The before branch chose a different, Good target and reported Good.

H04 retained a different tactical plan: check Evil and falsely announce Good.
Its after explanation prioritized getting two Evil onto the approaching two-Fail
mission, accepting identification by Merlin rather than exposing the ally for
variety. This is evidence that the policy can preserve a concrete sabotage plan,
not proof that the plan secures the necessary coalition or improves the outcome.

Known-Evil target selections were 0/7 before and 2/7 after. Complete Evil/Evil
branches were 0/7 and 1/7. The after sample contains all four alignment/announcement
combinations. These exploratory counts do not measure an optimal mixture or
establish reliable long-run behavior. No numeric equality of plan values was
established, and complete downstream games or win rates were not evaluated.

## Historical winning controls

Four additional saved Mordred mission-card positions had two prior failures and
a one-Fail threshold. Mordred's own Fail was sufficient for an immediate third
failure. They were replayed twice each as before/after negative controls, bringing
the first authorized run to 36 calls. Their historical instruction inputs were
identical between variants because the new policy is confined to Lady decisions.

| Control | Before  | After   | Predeclared expected action |
| ------- | ------- | ------- | --------------------------- |
| C1      | Fail    | Fail    | Fail                        |
| C2      | Success | Success | Fail                        |
| C3      | Success | Success | Fail                        |
| C4      | Fail    | Fail    | Fail                        |

Thus the historical controls showed no changed choices, but only 4/8 responses
met the predeclared Fail criterion. They must not be described as eight passing
winning controls. C2 and C3 relied on a historical lowest-seat sabotage convention
and deferred to another Evil player rather than supplying their own sufficient
Fail. This does not establish that those missions would actually succeed: another
Evil could still sabotage. It does fail the stronger own-card winning criterion.

A server-side boolean audit confirmed a lowest-seat convention in the saved
instruction text of all four controls, absent from their role advice and explicit
table conventions. Those saved instructions did not contain the current denial
of prearranged sabotage. Current `decisionInstructions` already states there is
no designated saboteur; no mission-card production code was changed here. The
historical controls therefore cannot validate current mission-card instructions.

## Follow-up with current card instructions

The user separately authorized eight further calls on the same four saved card
positions, two repeats each, with full local responses. Only the instruction text
was replaced: `decisionInstructions` was generated from the current repository
for `onMission`, smart difficulty, speech disabled, and each saved language
(`ru`, `en`, `zh-tw`). The saved game facts, legal cards, private knowledge,
role advice and memory were retained. Source-trace hashes matched the first run.
No additional raw-context export was required; contexts stayed on the server.

This validates current stage instructions rather than the historical protocol.
It is not an ablation of only the coordination sentence: the full current stage
instruction text replaced the saved historical instructions. The Lady-only
predictability paragraph does not enter this stage. Thus these are current-rule
winning checks, not a simulation of teams and votes after changed Lady choices.

| Control | Current instructions, repeat 1 | Current instructions, repeat 2            |
| ------- | ------------------------------ | ----------------------------------------- |
| C1      | Fail                           | Fail                                      |
| C2      | Fail                           | Fail                                      |
| C3      | Fail                           | No completed response: quota interruption |
| C4      | Fail                           | No completed response: quota interruption |

All six completed replies chose the sufficient winning Fail, covering all four
positions. C2 explicitly declined to rely on the other Evil player's unknown
card; C3 likewise prioritized supplying the winning card over retaining cover.
The paired completed repeats used identical input hashes. Full responses and
both mock-only transition checks were verified locally.

The run did not complete all eight replies. It terminated with `Codex subscription
usage limit reached`; second-repeat replies for C3 and C4 were absent. No further
inference was attempted. These are **6/6 completed passing responses**, not eight
passes, and the uncompleted calls have no measured usage in the retained output.
Known usage for the six completed calls: 73,332 input tokens, including 15,360
cached; 738 output tokens, including 194 reasoning tokens.

The supported result is an observed complete Evil-target / truthful-Evil Lady
plan after the change, while all four saved current-rule card positions retained
the winning Fail in their completed samples. Neither the small sample nor these
separate card checks establish unchanged full-game winning probability.

## Verification and provenance

- The expanded forwarding tests failed on the missing new policy before its
  addition and passed after it. A separate integration case preserves Mordred's
  truthful Evil choice; card and vote cases verify Lady policy isolation.
- All 38 backend AI suites passed: 525 tests. ESLint, Prettier and diff checks
  passed. Backend TypeScript passed with `--rootDir .`; the default rootDir issue
  documented in earlier reports remains unrelated.
- Independent review caught a missing availability qualifier for the Evil target;
  it was fixed before live inference. Script review and mock-only checks verified
  separate variant state, correct linked results, identical historical control
  prompts and call bounds.
- The user explicitly authorized the private export to OpenAI/Codex, full local
  responses and 36 calls. Direct worker calls avoided application retries. All 36
  completed, with no inference errors. Full responses remain outside the repo.

Usage for the first 36 calls: 458,331 input tokens, including 38,528 cached;
16,972 output tokens, including 11,164 reasoning tokens. Production code was not changed
after observing these replies. No deployment was performed.
