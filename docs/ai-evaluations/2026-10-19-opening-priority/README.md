# Opening partner priority

19 October 2026. Both difficulties now receive a private random partner priority
when selecting a two-seat team on the first mission. Each bot's order is sampled
once in its room's decision pipeline, independently of roles; it survives final
selection, rejected opening proposals, roster repair and technical retries.

The common advice selects the first eligible partner only after comparing safety,
private knowledge, public evidence and real coalition needs. A known Evil is not
equivalent to an unresolved partner for Good on a one-Fail mission with a safer
alternative. Seat numbers, next leadership and list position alone do not override
the priority. Bots retain a supported preference until information or a concrete
coalition reason changes it. The order is not public evidence and must not be
published or used to invent trust.

This is a model instruction, not a server roster override. It adds no inference
calls, leaves all legal teams available and does not affect votes, secret cards,
later missions or three-seat openings. The pipeline belongs to one room; an
application restart does not restore live in-memory games or their priorities.

## Saved-position experiment

The user authorized 16 independent `gpt-6.1-sol`, medium calls on two saved opening
positions: one Servant knowing only their own side, and one Merlin seeing seats
2 and 3 as Evil. Both acted from seat 1 at seven-seat tables with no preceding
missions or discussion and a one-Fail threshold. Their historical personalities
and base instructions differ, but stay fixed within each position.

Each role received two baseline calls and two calls for each of three predefined
priority permutations. The after condition added the common advice and a private
priority field; everything else, including legal-choice and schema ordering, was
unchanged within each role. Conditions were interleaved, requests used fresh
sessions and there were no automatic retries. Hashes confirmed identical repeated
inputs. The priorities were selected before inference to cover different partners
and known-Evil heads, not sampled to estimate production frequencies.

| Condition | Partner order | Servant, two replies | Merlin, two replies |
| --------- | ------------- | -------------------- | ------------------- |
| Baseline  | None          | 1+2, 1+2             | 1+4, 1+4            |
| A         | 2,5,4,7,3,6   | 1+2, 1+2             | 1+5, 1+5            |
| B         | 3,6,2,4,7,5   | 1+3, 1+3             | 1+6, 1+6            |
| C         | 4,7,3,2,6,5   | 1+4, 1+4             | 1+4, 1+4            |

All 16 calls completed. All 12 after replies followed the first eligible partner.
Each role used three different partners rather than the one observed in its two
baseline replies. Merlin selected visible Evil in 0/6 after replies, including
four replies whose first-ranked partner was visible Evil. All 16 public statements
were manually inspected: no private priority or hidden role assignment was stated.
This textual check does not measure whether behavior reveals Merlin.

Measured usage: 218,876 input tokens, including 7,808 cached; 3,260 output tokens,
including 1,458 reasoning tokens. Private source prompts and local detailed output
are not checked into the repository.

## Limits and regression coverage

One position per role and two repeats per condition validate an exploratory
mechanism, not a long-run error rate, win rate or reduced assassination risk.
Unknown partners can still contain hidden Mordred. Luna/regular model behavior,
other roles, later discussion and complete games were not evaluated live.

`opening-priority.test.ts` verifies delivery for both difficulties and all roles,
a complete role-independent partner permutation, stable reuse across retries and
opening proposals, reuse during repair, per-bot partner sets, unchanged legal
choices and absence from public context and unrelated stages. Mocked generation
checks integration and scope; it does not establish that models always obey.
