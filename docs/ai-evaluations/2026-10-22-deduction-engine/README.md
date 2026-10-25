# Deduction engine, analysis block and dominated-move guards

22 October 2026. Branch `ai-play-improvements` (local only, not pushed).

## Problem

Bots were asked to do all mission arithmetic themselves from raw history.
They frequently got it wrong, then let chat impressions outweigh hard evidence.
On the six saved positions in `fixtures/decisive-match.json`, `gpt-6-luna`
(reasoning `low`) with the previous pipeline chose the target action in **2/10**
strict replies (2 samples per position). Typical errors from the private reasons:

- "Two disjoint failed teams already contain both Evil, so 2, 3, 4, 6 are all
  Good". False: 3 is in the second failed team.
- Replacing 5, who sat on a Success at 0–2 (Evil would have won with one Fail),
  with untested 3 because "5 never answered my question".
- A leader picking 3, 5, 6 (fails in 6 of 7 consistent worlds) over a roster
  including themselves (4 of 7).

## Change

`deduction.ts` enumerates every Evil seat set (at most C(8,3) = 56) consistent
with the observer's own knowledge:

- visible roles, including Percival's one-Evil wizard pair;
- the observer's own mission cards;
- Fail counts (each Fail needs a distinct Evil participant);
- Lady results the observer saw;
- the table rule that Good **bots** announce truthfully. Humans may lie, so
  their announcements are only weighted.

Each world is then weighted by a behaviour model:

- per-Evil Fail propensity by score context: 0.96 when a Fail wins at once,
  0.9 at two Good successes, 0.15 on a two-seat opener, 0.6 on a larger
  opener, 0.65 otherwise;
- fewer redundant double Fails;
- lone Evil rarely failing a two-Fail mission;
- off-team votes. On-team votes carry almost no signal because both sides
  approve their own teams.

Opener rates follow ProAvalon and Nakamura data. 0.65 came from self-play,
where 0.75 over-cleared a cover Success.

`analysis.ts` turns the worlds into a private `analysis` block in every
decision context (not in public context or review). It contains:

- `seats[]`: Evil chance and status. "Proven" means certain under the hard
  constraints; behavioural estimates are clamped to 1–99%.
- `teams`: for Good, fail risk per legal roster plus rank of the proposed one;
  for Evil, sabotage-capable rosters ordered by how safe they look publicly.
- `publicView`: the same computation without private knowledge, i.e. what the
  table can verify. Used for Merlin and Evil cover.
- `missionCard` (Evil): whether a Fail can change the result, whether it wins
  now, and the public suspicion after each outcome.
- `ladyTargets`: information value. `announcement` (Evil): public suspicion
  after each possible announcement, and whether Merlin can see the target.
- `merlinCandidates` (assassination): each Good seat's votes and proposals
  compared with what was public at the time. Merlin sees all Evil except
  Mordred.
- `assassinView` (Merlin): the same detector run on Merlin's own record, with
  forecasts for approve vs reject and for each candidate roster.

`guards.ts` overrides only strictly dominated actions (`AI_DECISION_GUARDS=off`
disables them):

- Evil Fails when a Fail wins now or when a Success would give Good its third
  mission.
- Evil plays Success when too few Evil can be on the team to reach the Fail
  threshold.
- Good approves a provably unfailable team. Merlin is exempt because its proofs
  are secret.
- Merlin's silent vote follows `servantLikeVote` (computed without its sight)
  before any failure, and for rejections on proposals 1–3 before two failures.
- Good rejects a provably sabotage-capable team. Merlin is exempt before two
  failures.
- Good rejects a roster that loses at 0–2 when a much safer one exists and
  proposals remain.
- A leader's provably unsafe or far riskier roster gets one revision call, then
  substitution.

The engine is disabled for non-standard roles or addons.

Prompt additions:

- `analysisAdvice`, with a compact version for regular-difficulty team phases;
- Merlin: pivotal-vote and exposure advice;
- Percival: do not spend Lady on a wizard;
- assassination: identify Percival first, and Mordred trust fits Merlin;
- silent decisions keep a private reason.

## Saved-position results

The same six positions and pipeline, with only the new context and
instructions, guards **off**. All 12 replies chose the target, so 10/10 strict,
and this held in two separate runs, including after recalibration. With guards
on, the two losing approvals are also rejected by the guard itself.

| Variant                                 | Strict target choices |
| --------------------------------------- | --------------------: |
| Previous pipeline                       |                  2/10 |
| Analysis only (guards off), two runs    |                 20/20 |
| Final code, guards on, plus 4 resamples |                 13/14 |

The single miss was a discussion preference, which has no guard; four resamples
of that position all chose the target.

## Self-play

Full bot-only matches through `BotRoom` and the real pipeline, with
`gpt-6-luna` at reasoning `low`. Each match costs roughly $0.05–0.10 at
third-party list prices.

Code changed between matches, so each row records the build it ran on. Rosters,
roles and seats were random.

| Match | Seats | Build                        | Missions S–F | Result                       |
| ----- | ----: | ---------------------------- | ------------ | ---------------------------- |
| g1    |     7 | engine + guards              | 3–0          | Evil: Merlin assassinated    |
| g2    |     5 | + Merlin self-check          | 3–2          | Evil: Merlin assassinated    |
| g3    |     7 | + approve/reject forecast    | 3–1          | Evil: Merlin assassinated    |
| g4    |     7 | + pivotal-vote advice        | 3–2          | Evil: Merlin assassinated    |
| g5    |     6 | same                         | 3–1          | Evil: Merlin assassinated    |
| h5    |     5 | + Merlin Servant-like voting | 3–1          | Good: assassin shot Percival |
| h6    |     6 | same                         | 3–2          | Evil: Merlin assassinated    |
| h7    |     7 | same                         | 3–1          | Good: assassin shot Percival |
| k5    |     5 | + cheap cover after a Fail   | 2–3          | Evil: three failed missions  |
| k6    |     6 | same                         | 3–0          | Evil: Merlin assassinated    |
| k7    |     7 | same                         | 3–1          | Good: assassin shot Percival |

Findings:

- Good reached three successes in 10 of 11 matches. g4 recovered from 0–2. Team
  choices tracked the engine's risk numbers closely. Good bots approved their own
  near-best rosters 95% of the time and rejected 95% of rosters they were not on.
- The assassin, helped by `merlinCandidates`, hit Merlin in all five matches
  before the cover policy. Every council cited Merlin's distinctive votes: lone
  rejections that could not stop a roster, approvals of clean off-team rosters,
  and trusting Mordred while avoiding visible Evil. The approve/reject forecast
  alone did not change this, because Merlin kept preferring mission safety.
- With Merlin's silent votes following `servantLikeVote` on early and cheap
  votes, Merlin survived 3 of 5 assassinations, and each miss hit Percival. This
  hit rate of 2/5 is in line with the ProAvalon human rate of about 40%.
  Mission results did not visibly suffer.
- Problems found in transcripts and fixed: Morgana reasoning "as a Good player"
  about Lady and approving a final clean roster at 2–2 (fixed by an explicit
  side/goal line and a stricter Evil vote guard); the forced-approve guard
  making Merlin perfectly accurate (Merlin exempted); and 0.75 early Fail
  propensity over-clearing a cover Success (lowered to 0.65).
- No match paused or produced an invalid action. Guards fired 0–10 times per
  match. Ten firings in k7 were mostly Evil rejecting unsabotageable rosters at
  two Good successes.

Total lab usage for the first part of this study was 1,055 Responses API calls: 6.3M input tokens,
1.5M of them cached, and 0.32M output tokens. That is about $0.66 at
third-party list prices for `gpt-6-luna`. Including the calibration follow-up and the 21 comparison matches, the
total was 2,817 calls, 16.0M input tokens (3.6M cached) and 0.93M output tokens, about $1.74.

## Follow-up: calibration against revealed roles

Later the same day. `lab/calibration.ts` replays every logged decision, takes each non-proven seat estimate a
Good bot received, and compares it with the revealed roles.

**Vote model.** The original model treated a Good player's vote on a roster they were not on as a coin flip.
Logged games show Good bots approve such rosters 18% of the time on mission 1 and 6% afterwards, while Evil
approves 56–100% of rosters holding an ally. The estimates were therefore compressed towards 50%: seats
estimated at 25% were Evil 13% of the time, seats at 75% were Evil 87%. Fitted rates, with softer values for
humans and an exception for voters the public record clears:

| Seat estimates           | Brier (fit set, 11 matches) | Brier (held out, 3 matches) |
| ------------------------ | --------------------------: | --------------------------: |
| Hard constraints only    |                       0.240 |                       0.239 |
| Previous behaviour model |                       0.143 |                       0.125 |
| Fitted vote model        |                       0.074 |                       0.072 |

The held-out matches were played before the refit. Bins now match outcomes within a few points. Mission Fail
propensities barely moved the score. Leader self-exclusion (Evil leaders left themselves off 46% of the time,
Good 9%) was tested and dropped: it did not improve the estimates, because the failed mission already points
at the roster.

**Percival.** In Percival's worlds the wizard pair fixes Merlin's seat, which now votes from measured Merlin
rates. Before, Merlin approving a clean roster it was not on read as Evil; in one logged position Percival
put the real Merlin at 88% Evil and a guard would have swapped a clean team for one holding Morgana.

**Assassination detector.** `lab/merlin-votes.ts` measures, for votes where Merlin's sight disagrees with the
vote a Servant in that seat would cast, how often each role votes with the sight. Under the cover guard, bot
Merlins do so 29–43% of the time and Servants 27–40%, so votes barely separate them; Merlin and Percival
proposals avoided visible Evil in all 26 logged proposals, Servants in 75%. The previous detector gave 81–97% to
the wrong seat in three of eleven assassinations, and its log loss (1.50) was worse than a uniform guess (about
1.35). The rebuilt detector compares each vote with the Servant baseline and uses the measured rates:

| Detector                 | Real Merlin ranked first | Mean log loss |
| ------------------------ | -----------------------: | ------------: |
| Previous                 |                     4/11 |          1.50 |
| Servant baseline, fitted |                     6/11 |          1.08 |

These rates were measured on the same eleven matches, so the comparison is in-sample.

**Lady fix.** `merlinSeesTargetAsEvil` was derived from the announcer's own sight. Mordred checking an unseen
Evil seat (necessarily Oberon) was told Merlin could not see it, and reasoned from that in a logged match.

**Merlin speech.** Merlin's votes were covered, its chat was not. In two mixed matches Merlin publicly doubted
an Evil seat before any mission ("leave 6 out", "take me rather than 4") and the Evil council quoted that line.
When Merlin's public text names a seat it sees as Evil and the public record puts that seat below 50% Evil, the
pipeline now asks for one rewrite with the same choice. Game actions never change.

## Original versus new AI in the same room

`lab/cross-play.ts` runs one room where Good seats and Evil seats can use different versions. "Original" is
commit `fb9bbbf6` (the branch base): only `pipeline.ts` and `client.ts` among existing runtime files changed
since then, so `lab/make-baseline.ts` restores those two and everything else is shared. 21 matches at 5, 6 and 7
seats, `gpt-6-luna` at reasoning `low`; the mixed matches ran in two rounds, the second after the Percival and
detector changes above.

| Good side                      | Original Good (12 matches) | New Good (9 matches) |
| ------------------------------ | -------------------------: | -------------------: |
| Wins                           |                 5/12 (42%) |            5/9 (56%) |
| Reached 3 successes            |                 9/12 (75%) |           9/9 (100%) |
| Missions failed                |                21/50 (42%) |           7/34 (21%) |
| Approved a roster holding Evil |               59/124 (48%) |          21/81 (26%) |
| Rejected a clean roster        |               24/138 (17%) |         28/114 (25%) |
| Leader proposed Evil           |                11/47 (23%) |           5/34 (15%) |
| Paused matches                 |                          2 |                    0 |

| Pairing (Good vs Evil) | Matches | Good wins | Reached 3 successes |
| ---------------------- | ------: | --------: | ------------------: |
| Original vs original   |       6 |         3 |                   4 |
| New vs original        |       6 |         3 |                   6 |
| Original vs new        |       6 |         2 |                   4 |
| New vs new             |       3 |         2 |                   3 |

New Evil won 4 of 6 against original Good, original Evil 3 of 6. Neither version missed a decisive Fail; the
original played one Fail that could not reach the threshold. Assassins hit Merlin about 45% of the time for
both versions. New Good won every mission race against original Evil but lost three of those six matches to the
assassin, two of them to the chat lines above, which the speech check now catches (verified on the logged
lines, not yet in new matches).

Per-decision cost: the same one model call per decision; 5,949 versus 5,090 input tokens and 300 versus 380
output tokens per call; median decision 4.7 s versus 5.6 s. Win counts at this sample size are not significant;
the per-decision rates rest on hundreds of votes.

## Bots at a table with human players

Bot-versus-bot results say little about how the bots play with people, so 24 Claude agents (Sonnet) played the
human seats of 12 seven-player matches. `lab/human-play.ts` puts them through the room's own human path
(with-friend mode, two seats), so the bots treat them as humans. Each agent saw only what that seat sees, chatted
in its turns, was told to play like a strong human (lying and framing when Evil) and wrote a short report at the
end. `AI_LAB_SEED` dealt each table identically for every bot version: four deals, with the human seats as
Merlin + Mordred, Percival + Morgana, Mordred + Morgana and Merlin + Percival.

| Bot seats, 4 deals each                    | Original |    New | New + code votes |
| ------------------------------------------ | -------: | -----: | ---------------: |
| Missions failed                            |      41% |    20% |              20% |
| Good bots approved a team holding Evil     |      46% |    15% |              11% |
| … holding the lying human                  |      50% |     6% |              21% |
| Good bots rejected a clean team            |      22% |    12% |              26% |
| Good bots backed a Good human's clean team |   6 of 7 | 4 of 5 |           0 of 2 |
| Good bot leaders picked the lying human    |      20% |     8% |              23% |
| Evil bots missed a game-deciding Fail      |   1 of 3 |      0 |           0 of 1 |
| Model decisions per match                  |       60 |     60 |               42 |

Good won 3 of 4 matches with the original and with the new bots. Two of the original side's wins came from
assassin misses; with the new bots no human liar won. The original bots let the human Mordred onto the
game-deciding team after a human Merlin had shown that only that seat sat on both failed missions.

What the reports and logs agreed on, and what changed:

- **Evil bots exposed themselves.** Bots failed the two-player first mission in 8 of 12 logged cases (original
  bots 7 of 7), so the other seat knew exactly who failed it. Strong players almost never do this; a guard now
  passes it. In all three Lady checks by the new Evil bots, Mordred ended up publicly calling an Evil player Evil:
  twice it inspected Oberon, whom it cannot see, and once Morgana, whom it knew. Strong players inspect a Good seat;
  a guard now moves the check off a known ally.
- **Repetitive chat** was the complaint in every report, for example four bots repeating "already delivered a
  clean success". A spoken line that shares a five-word run with the last ten chat lines now gets one rewrite of
  its wording; the action never changes. It would have fired on 13% of the new bots' lines.
- **Code votes.** Votes are half of all requests. Over all logged games the deduction engine's Servant vote was
  right more often than the plain Servant bots' own votes (79% vs 70%), but at human tables the two tied on the
  same decisions (85% vs 85%). Code-vote matches also stopped backing a Good human's argued-for team. The model
  weighs what humans say and the engine does not, so code votes now apply only at bot-only tables.
- The Lady reply "This alone does not prove X is Good", which several reports quoted, is a fixed server
  template. The public Evil council messages during the assassination are by design: all Evil roles are revealed
  at that point.

Not yet fixed: Evil bots still propose obviously Evil-heavy teams late in the game; and the echo check and the Lady guard came
after these matches, so they have no match results yet. Twelve matches is a small sample. The per-vote rates
rest on a few hundred votes; the win counts mean little.

Cost: 1,099 API calls for the 12 matches, about $0.59 at list price (code votes made about 30% fewer model
decisions). Total for this evaluation: 3,916 calls, about $2.32.

## Second round: freezes, Evil rosters and a right-answer benchmark

**Freezes.** 7 of the 12 human-table matches paused on a bot turn ("AI decision or speech failed. Match
paused."), 3 of them with the original bots: in production a person has to press retry. Every pause came at the
first bot turn of a discussion round, after new human chat. The pipeline hid the error behind that message; it now
keeps it as the pause's cause. The confirmed bug: when a game decision wrote a testimony note into the `t:` key
space reserved for the human-memory update, the anchor check always failed, because a decision's source is free
text, and the parser threw instead of dropping the note. The note is now dropped and the decision stands. A
reply that breaks the output contract is also asked for once more before the match pauses (provider failures
are not retried), and a failed optional rewrite keeps the reply it would have replaced. Replaying 218 logged
turns reproduced no pause: the bug needs a whole game of accumulated memory notes, so it was confirmed on a
logged request instead. Four matches on the same deals with the fix, the human seats played by a script that rotates
claims and accusations so the bots keep building memory notes: 287 bot decisions, no pause (the earlier rate
predicts about two). The scripted seats are a stability test, not a strength test.

**Merlin.** The earlier note that human assassins found bot Merlin in 2 of 4 tries was wrong. In these 12 matches
bot Merlins were never assassinated (0 of 6, all by bot assassins); human Merlins were hit in 3 of 5 tries, 2 of
them by bot assassins. Nothing was changed.

**Evil leaders.** Some sabotage rosters looked far guiltier to the table than another legal roster with the same
Fails, for example 63% against 15% for Mordred at 2-1. A gap of 25 points or more now goes through the
selectTeam guard (one revision by the model, then the less suspicious roster); it fires on 3 of the 24 logged Evil
picks. In all three Lady checks where an Evil bot found its own ally, it announced the truth. For Mordred that is
a real trade-off, since a lie shows Merlin exactly who lied, so it stays with the model.

**Human claims.** No change: Lady results already enter the deduction engine as testimony, human votes are
already weighted as less consistent, and the gap measured earlier (bots ignoring a Good human's argued-for team)
came from code votes, which no longer run at human tables.

**Right-answer benchmark** (`lab/decision-bench.ts`, no API calls): every logged decision whose right answer the
revealed roles settle. A team counts as unsafe only if it holds enough Evil to reach its Fail threshold.

| Decision, 4 deals each | Original |    New | New + code votes |
| ---------------------- | -------: | -----: | ---------------: |
| Good bot votes         |      59% |    81% |              84% |
| Good leader picks      |      44% |    80% |              82% |
| Evil mission cards     |   2 of 6 | 2 of 3 |           3 of 3 |
| Bot assassin hit       |   0 of 3 | 1 of 3 |           1 of 3 |

The current guards make every logged Evil card right and never turn a right Good vote, pick or card wrong; the
only flips of right choices are Merlin's deliberate cover votes. `real-positions.test.ts` keeps the 33 logged
positions where a guard fires as a regression test.

Cost of this round: 772 OpenRouter calls for the replays and the four matches, $0.47 billed.

## Third round: agent-played matches on the new fixes

Sixteen more matches with Claude agents in the two human seats: the four earlier deals with the round-2 build,
four fresh deals (11, 13, 18, 20) with the round-3 build, and deals 11 and 20 again with the round-4 build and
with the original bots. No match paused.

| Fresh deals 11 and 20, same tables  | Original | Round 3 | Round 4 |
| ----------------------------------- | -------: | ------: | ------: |
| Good won                            |   0 of 2 |  1 of 2 |  2 of 2 |
| Missions failed                     |   6 of 6 |  5 of 9 |  3 of 9 |
| Good bots approved a team with Evil |      44% |     30% |     26% |

On the four earlier deals the round-2 build won 2 of 4 for Good (original and new: 3 of 4 each); its Good bot
picks were worse than the new build's in those games (5 of 10 right against 8 of 10), with no change between
the two builds that touches Good picks, so read it as variance in how the agents played. Two of six round-3
and round-4 losses came from bot Merlin being found after loud, accurate pushing.

Fixes from these matches (all replayed on the logged positions first):

- **Evil off-team approvals.** Good bots approved a team they were not on in 5% of their votes after mission 1,
  Evil bots in 25-40%: the classic tell. Without enough known Evil on the team to fail it, Evil now votes as a
  Servant in its seat would.
- **Evil leaders off their own team.** Good leaders included themselves in 29 of 30 picks, Evil leaders in 14 of 19. An Evil leader who is not already suspect is swapped onto its team.
- **Good leaders voting down their own team** (29 of 323 leader votes) now approve it when their own estimate
  rates it as good as the best.
- **Decisive two-Fail missions.** At two failures the engine rated an Evil pair as failing only 56% of the time, so
  a 24%-risk roster next to three proven-safe ones passed the team guard and lost the game. A pair now fails as
  surely as a lone Evil when a Fail decides, and the guard's gap at two failures is 20 points instead of 30.
- **Said one roster, submitted another.** "I'm keeping 5 off and taking 6 instead" with 5 on the submitted team:
  such a line now gets one repair call.
- **Chat.** An Evil line that wants a Fail ("we need a team that can actually reach two Fails") gets one rewrite in
  a Good player's voice; a long restatement of a proposal two players already backed becomes a short agreement;
  Merlin's speech is no longer softened at two failures.

Checked and left alone: the engine's calibration at the human tables is good (predicted 97% Evil, actual 96%;
predicted 3%, actual 6%), and changing the on-team Evil vote rate made it worse. Evil Lady announcements on an
ally are real trade-offs (Oberon's truthful call cut its own suspicion from 57% to 34%). Bot assassins already
hit human Merlins in 2 of 3 tries. An automatic overused-phrase list would mostly ban game vocabulary.

`real-positions.test.ts` now scores every guard on 116 human-table positions against the revealed roles: no
guard may break more choices than it fixes, and together they must fix three times as many (82 against 18).
Cost of this round: 1,493 calls, about $0.84.

## Fourth round: the assassin

Bots play Evil in every agent-played match, but the win counts above mix both sides, so Evil decisions were also
scored on their own. The third- and fourth-round Evil bots played the right mission card in 8 of 9 spots (the
original bots 4 of 10), approved none of the 37 safe rosters they were not on (12 of 20), and put themselves on
14 of their 20 proposals (6 of 11).

Assassination was the weak spot. Over 45 logged bot assassinations (agent-played and bot-only) the shot hit
Merlin 17 times (38%); against the latest two human-seat Merlins it missed both. The earlier "2 of 3" was a small
sample. A random shot among four Good seats hits 25%. 12 of the 28 misses shot Percival, and the vote detector
behind `merlinCandidates` named Merlin first only 15 times (33%): it counts only votes where Merlin's sight and
the Servant vote disagree, and bot Merlins rarely depart before a failure. Council allies then repeat the first
speaker, who usually quotes the detector.

- **Detector.** Every vote now also counts two direct rates measured on those games: Merlin approved 17% of
  rosters with Evil it could see (other Good 29%) and 45% of rosters whose only Evil was Mordred (other Good 33%).
  In a leave-one-game-out test the top candidate is Merlin in about 26 of 45 games, against 15 before; on the
  agent-played games alone 8 of 15 against 4. Chat-based word counts did not help and were left out.
- **Guard.** A final shot at a seat the detector rates under half its top candidate goes to the top candidate.
  On the 45 logged shots that changes 10, 7 of them to Merlin, and breaks none: 17 hits become 24. On the
  human-table fixture it would also have moved a correct shot away in 3 games where the detector is confidently
  wrong (fixed 4, broken 3 on those positions); no logged correct shot was moved. Council advice is not guarded.
- **Prompt.** The assassin is told the detector is its strongest single clue, and how to find Percival from the
  revealed Morgana: Percival's two candidates are exactly Merlin and Morgana, so whoever treated Morgana as a
  possible Merlin is likely Percival, the other seat they treated that way is likely Merlin, and a player weighing
  two candidates that exclude Morgana is not Percival. This part is untested with the model.

The parameters were fitted on the same 45 games the numbers come from, so expect less on new games.

## Fifth round: Evil play on its own, and two table rules

Four fresh deals with both agent seats Good, so every Evil seat was a bot, each played twice with the Good bots on
the latest build: once with the original Evil bots (`--evil-bots=old`), once with the latest. These ran on the
fourth-round build, before the rules below.

|                           | Original Evil bots | Latest Evil bots |
| ------------------------- | ------------------ | ---------------- |
| Evil won                  | 1 of 4             | 2 of 4           |
| Missions failed           | 5                  | 7                |
| Assassin hit Merlin       | 1 of 4             | 2 of 4           |
| Evil leader on own roster | 2 of 9             | 13 of 17         |

Four deals separate only large differences. The agents' reports named the same Evil tells in both builds: double
Fails on one-Fail missions (two Evil bots failing the opening pair together), leaders sitting out, and Evil seats
rejecting the clean opener as a block.

- **Leaders always go on their own team.** A leader who leaves themselves off is swapped in after one chance to
  revise: a Good leader for the member adding the most risk, an Evil leader keeping the roster able to fail.
- **One Fail per Evil group.** When more Evil who see each other are on a mission than its Fails need, the
  lowest-numbered play Fail and the rest Success. Seat 1 always leads first and the lead passes upward, so this is
  order from the first leader. A game-winning Fail stays open to all; Oberon sees nobody and is outside it. The
  prompts had said the opposite ("no prearranged sabotage convention").
- **Off-team rule from mission 2.** Forcing Evil to reject off-team rosters on mission 1 made all three Evil reject
  the clean opener together. On mission 1 Good bots approved 24% of off-team rosters and human Good players all of
  them, so there is no Good pattern to copy; after mission 1 Good players approved about 20%, Evil bots 40%.
- **Detector at human tables.** Out of sample, the detector named Merlin first in 3 of the 7 new assassinations
  and twice rated a human Servant above 80%. Human seats reason past the Servant rule whatever their role: human
  Merlins followed their sight in 75% of the telling votes, other human Good in 54% (the detector had assumed 70%
  against 33%). Human seats now have their own rates, and the guard no longer moves a shot onto a human seat. Over
  53 logged assassinations it changes 6 shots, all to Merlin, and moves no hit: 20 hits become 26. In hindsight it
  would have blocked a correct shot in 4 games where the detector is confidently wrong.

`real-positions.test.ts` now covers 180 positions: 134 choices fixed against 22 broken. Cost of this round: 1,045
calls, about $0.60.

## Sixth and seventh rounds: think, then talk

Built from the fifth round's reports, then played in two milestone rounds on the full latest build (gpt-6-luna,
table level medium): four fresh deals (r6), then the same four plus two more after fixes (r7).

- **Thinking per call.** The assassination and council, final rosters, Lady decisions and any call at match point
  run one reasoning level above the table's; memory batches and text rewrites one below.
- **Think, then talk** (`speaker.ts`). Once an action is final, a short second call writes the public line from what
  a player has in mind: the gist of the decision's line (never its wording), the record, recent chat, the seat's own
  earlier lines, lines that question or accuse it, worn-out phrases (word pairs already used twice), per-seat length
  examples and a role posture computed from the record (Evil: one shared target and caught allies to cut loose, off
  at match point; Merlin: never first to doubt a seat; Percival: never vouch for the wizard pair; Good: proofs and
  contradictions). The bot's own persona leads the voice. A discussion seat may pass unless addressed. Every speech
  check still applies and the decision's line stays on any failure; Evil council lines go through it as open talk.
  Published chat gets typed typography (straight quotes, hyphens, full stops for semicolons), and a leader's line
  drops a repeat of the team the room already prints after "I propose". `lab/speak-probe.ts` replays logged turns
  through the speaker alone, at about $0.0005 a call, which is how most of the wording was tuned.
- **Decisions.** Evil leaders leave out caught allies, never re-propose a roster voted down this mission and back
  their own proposals; Evil approves a too-clean roster a Servant would approve; Good bots' votes at human tables
  follow the deduction engine (right 36 times against the model's 19 where they disagreed), approve an off-team
  roster within 5 points of the best, and a Good leader's pick is held to the 10-point line its own vote draws;
  Merlin's leader vote is exempt from its cover rule. Every roster guard now answers with the exact legal text: the
  legal list runs in seat order from the leader ("6, 1, 2") and sorted answers had silently failed to substitute.
- **Removed after play.** A rule predicting the other seats' votes for Evil ally rosters rejected an approval that
  would have passed a failable roster (game 55), and was dropped.

Bot chat, scored over every bot line (`lab/chat-score.ts`):

| Build                              | Games | Avg chars | Over 150 | Jargon | Starts "I" | AI typography | Discussion passes |
| ---------------------------------- | ----- | --------- | -------- | ------ | ---------- | ------------- | ----------------- |
| Earlier builds (r2 to fifth round) | 26    | 126-136   | 24-33%   | 14-27% | 41-53%     | 80-89%        | 0-1%              |
| r6                                 | 4     | 101       | 8%       | 5%     | 37%        | 4%            | 1%                |
| r7                                 | 6     | 87        | 3%       | 3%     | 30%        | 0%            | 5%                |
| r8                                 | 4     | 79        | 1%       | 4%     | 25%        | 0%            | 4%                |

Agent players went from calling the chat "mostly robotic" to "partly human" and "about 60% human". Results:

| Game | Agents            | r6                     | r7                                  |
| ---- | ----------------- | ---------------------- | ----------------------------------- |
| 48   | Servant, Merlin   | Evil, bot assassin hit | Evil, bot assassin hit              |
| 55   | Servant, Morgana  | Good                   | Good                                |
| 59   | Servant, Servant  | Good                   | Evil, bot assassin hit (bot Merlin) |
| 68   | Merlin, Morgana   | Evil, bot assassin hit | Evil, bot assassin hit              |
| 49   | Percival, Morgana |                        | Good                                |
| 63   | Merlin, Servant   |                        | Evil, bot assassin hit              |

A last check round (r8) on four fresh deals after the wrapped-order fix, the leader-consistency rules and the line-shape changes: Good won three (deal 50, Mordred and Percival agents: human assassin missed; 54, Merlin and Servant: bot assassin missed the human Merlin; 61, Morgana and Servant: the human assassin missed a bot Merlin the agents said hid well) and Evil one (64, two Servant agents: bot assassin found the bot Merlin). No match paused in r6 to r8. Agent ratings of the chat in r7 and r8 ranged from 25% to 60% human-like.

Good completed three missions in all fourteen games of r6 to r8. In r6 and r7 bot assassins found Merlin in all six of their shots (four human
Merlins who, by their own account, were too accurate in public, and one bot Merlin); the two human assassins
missed. Remaining weaknesses named by the agents: Oberon cannot avoid double Fails with allies it cannot see, Good
bots still form a visible voting block around a trusted trio, bot Merlin is still found when it leads the table, and
the persona voices (the sarcastic snob above all) repeat their own tics. Cost of the three rounds and all probes: about $2.10.

## Ninth round: on Codex, and the remaining weaknesses

From here the bots ran through the local Codex CLI on the ChatGPT login, as production does, instead of a paid API
key (`human-play.ts --runner=codex`, `speak-probe.ts --runner=codex`); four games moved the weekly allowance by
less than a percent. Built after r8 and played in this round:

- **Stock frames.** Worn-out phrases include sentence frames, not only word pairs: "can you back this?" requests,
  "quit circling", "How <adjective>" and "Surely..." quips, "rather <adjective>", "let's see how it goes", smiley
  emoji. A seat that used an emoji in its last two lines publishes the next without one.
- **Openers.** Before any mission a Servant approves an opener that likely passes (Good bots had rejected 25 of 38).
- **Oberon** holds its Fail on a one-Fail roster when the record puts another Evil on it above the 60% a three-seat
  roster starts at.

| Game | Agents           | Result                                                                  |
| ---- | ---------------- | ----------------------------------------------------------------------- |
| 52   | Oberon, Merlin   | Evil, human assassin found the human Merlin                             |
| 53   | Percival, Oberon | Evil, bot assassin found the bot Merlin                                 |
| 58   | Mordred, Servant | Good, human assassin missed the bot Merlin ("nearly perfect as Merlin") |
| 66   | Servant, Morgana | Good, bot assassin missed the bot Merlin                                |

Chat: 83 characters a line, 4% over 150, 29% starting with "I"; agents rated it 30 to 55% human-like. Found and
fixed after this round: the inspection reply, the Lady announcement, the proposal opener and the council line were
fixed templates repeated word for word ("Yep, 5 is right about me...", "I inspected 2 and announce: Evil.",
"I propose ...", "Evil council: Target 3."), now natural and varied where it is safe; the speaker no longer recruits
votes by naming a seat or uses filler closers from the first use; Merlin defers to nobody publicly and keeps its
45-point roster leeway before two failures (the 10-point line had forced it into perfect rosters); a caught Evil
leader may sit out; Oberon and Morgana are told a Lady-found ally costs nothing to call Good; half of the "same team
again" discussion turns pass. One case stays open: the deduction engine ignores chat, so it can follow a wrong read
a correct human Merlin argued against (game 52).

Tenth round (Codex, built on everything above except the items in the next paragraph): Good won all four. Game 46
(Morgana and Oberon agents) and 56 (Oberon and Servant): the human assassin missed the bot Merlin; 60 (Percival and
Mordred): the bot assassin missed the bot Merlin; 69 (Merlin and Percival): the bot assassin missed a human Merlin who
hid behind Percival's Lady result. Bot Merlin survived all three of its assassinations; the vote detector named
Merlin first in none of the four, since bot Merlins now vote like Servants. Chat: 80 characters a line, 19% starting
with "I", 3% jargon; agents rated it 35 to 55% human-like.

Built during the tenth round: a spoken pass ("No new point to
add.") becomes silence; a line claiming a seat cast a vote it never cast is not published (a bot invented "3 and 6
both backed 4 earlier" before any vote; on all 1,540 logged bot lines nothing true is flagged); at most one emoji in
four lines per seat; the snob persona's adverb barbs ("A perfectly respectable fourth seat") count as a worn-out
frame; the council line reads "Evil council - my pick is 3."; optional calls (the speaker and rewrites) give up
after a minute; and a hung Codex call is retried after three minutes instead of pausing the table at ten (decisions
take 11 s at the median and 72 s at most over 504 Codex-round decisions).

## Eleventh round (Codex) and a cleanup

Good won three of four: game 47 (Mordred and Oberon agents) and 57 (Morgana and Oberon) went to Good with the bot
assassin missing the bot Merlin, 65 (Morgana and Mordred) with the human assassin missing; in 51 (Percival and
Servant) the bot assassin found the bot Merlin. No match paused. Chat: 74 characters a line, none over 150, 16%
starting with "I"; agents rated it 25 to 60% human-like. Fixed after it: stacked spoken passes ("Pass. Nothing new
to add.") are silenced, replies talk to the person as "you", the snob persona's "tidy little" and "hardly a..."
quips wear out, a first discussion reacts to a team already suggested instead of each bot naming its own, and
"keep it simple" counts as a stock frame.

Cleanup without changing behaviour: the five text rewrites share one helper; Good seats other than Merlin take the
deduction engine's vote without a model call at human tables too, which removes a call per vote and the guard that
overrode the model with the same vote; the assassination guard steps in below a third of the top candidate (it still
fixes all three logged human-table misses and would block two correct shots in hindsight instead of four); and nine
one-off lab tools were removed. The guard fixture is 311 positions.

## Twelfth round (Codex)

Good won three of four. In 73 (Servant and Morgana agents) and 77 (Merlin and Servant) the bot assassin shot the
bot Percival, who had played as sharply as Merlin; in 76 (Merlin and Mordred) the human assassin missed. In 74
(Percival and Oberon) Evil won on missions: Good voted down two clean third-mission teams, one of them because
Merlin's cover rejected a roster Merlin sat on, and the forced fifth roster went to the Oberon agent. Chat: 79
characters a line, 2% over 150, 21% starting with "I"; agents rated it 35 to 55% human-like and named "clean run"
(eight times in one game), "I'll own it" and "cleanest" as the stock lines.

Fixed after it. On the fourth proposal a Good seat approves a roster safer than what an Evil-looking fifth leader
would send (over the logs this changed 9 votes, each with an Evil fifth leader: 5 rosters were clean and 4 would
have failed like the forced one). Merlin's cover never votes down a clean roster Merlin is on, and the Merlin
detector no longer counts such votes as cover; it now puts the real Merlin first in 18 of 41 logged assassinations
instead of 16, and treats a Lady holder acting on its own check as a Servant. An Evil Lady holder who finds an
ally the table already suspects tells the truth for credit (Evil holders did so in 15 of 16 such logged checks)
and still covers an unsuspected one; an Evil leader backs a roster it sat out of. A stock frame is worn out for a
seat after one use, and "I'll own it" and "clean run" phrases count as frames.

## Thirteenth round (Codex)

Four fresh deals, Evil won three. In 83 (Morgana and Mordred agents) and 85 (two Servants) the bot assassin found
the bot Merlin at 71% and 80% detector confidence: Merlin's on-team rejection of a roster with Oberon and its
approval of a roster whose only Evil was the hidden Mordred gave it away, and the Evil council cited both. In 80
(Servant and Oberon) the Good bots approved the proven-safe fourth-mission roster twice, but the two humans
rejected it, the Servant agent persuaded by the Oberon agent, and the forced roster went to Mordred. In 81 (Merlin
and Servant) the bot assassin missed the human Merlin. Chat: 84 characters a line, 2% over 150, jargon down from
10% to 5% of lines, 4% passes.

Across all logged rounds human assassins have never found a bot Merlin (0 of 10), while bot assassins find bot
Merlins about a third of the time (9 of 25; 2 of 2 this round, after the detector changes above). Good bots reject a clean
roster they sit on 14% of the time after mission 1 and a dirty one 83%; the human agents did so 19% and 44%.

Merlin's remaining vote tell. Votes are silent and nobody speaks between a proposal and its vote, so Merlin cannot
give a reason first. Two vote-side fixes were tried and dropped: voting like a Servant whenever the other seats'
likely votes make Merlin's unlikely to decide the result changed none of the 308 logged bot-Merlin votes (the
telling votes are close ones, decided by Merlin 4 times in 13), and leaving a leader's vote on its own team out of
the Merlin detector cost it accuracy (log loss 1.053 to 1.094). What remains: the speaker hands Merlin a reason a
Servant could have had for its latest vote that set it apart, to give only if asked.

## Fourteenth round (Codex): the chat

Two blind Codex judges measured the chat before the changes, on rounds 12 and 13. Line by line it already passes:
bot lines scored 71 for "typed by a human" against 73 for the agent testers' lines, and on the same 48 turns
regenerated with the changes below 0.545 against 0.51 for the logged lines (0.5 is indistinguishable). Reading
whole games the judge put 8 of the 16 humans in its top two (chance is about 5) and named its tells: analyst
wording ("the vote gives us no split to read", "a point of comparison", "4 is publicly clear"), personality played
on every line ("spectacularly sideways", "glad to be with you again") and the fixed "4, 1, 2 for this one." stamp.
Fixed: the personality shows in full on every third line of a seat and lightly otherwise; analyst words are worn
out from the first line; a leader's team is printed as people type it ("Going with 1, 2 and me."); and personality
catchphrases (gambling talk, "left out", "streak", "sounds fun", "thanks for keeping me on") are worn out for a
seat after one use, the last ones added after this round.

Round 14 replayed round 13's four deals. Chat: 80 characters a line, none over 150, jargon 2% of lines (5% in round
13), 17% starting with "I" (21%). The whole-game judge found 3 of the 8 humans, as on the same deals in round 13;
its named tells were now mostly the catchphrases limited after the round. Evil won three: the bot assassin found
the human Merlin in 81 and the bot Merlin in 83, and Evil took the missions in 85. In 81 and 85 the Lady guard had
forced an Oberon bot to announce Mordred as Evil at 70% and 68% public suspicion, which both testers of each game
called burning a teammate; the guard now forces only clear cases (an ally at 90% or more is told truthfully, one
under 50% is covered) and leaves the middle to the model.

## Review of PR #18

The maintainer's review found four faults, each reproduced by a test that failed before the fix:

- **Admission after a guard swap.** A guard that replaced an admitting Evil leader's roster kept the admission but
  dropped its words, and the exposed-Evil check paused the match. A first admission now gets one call to restate it
  for the server's roster, or waits for a later turn; repaired replies are taken only if they pass the exposed-Evil
  and leak checks.
- **Convention with a human ally.** The one-Fail convention could switch a bot's Fail to Success because a human
  ally was the one due to fail. The server plays only bot cards, so with a human designated the bot's card stays its
  own, and at two Good successes the last-chance rule makes it Fail.
- **Claims from withheld lines.** A line withheld for an invented vote had already recorded its Percival claim and
  stances. The published line is now settled first, and claims, stances and the post-game record follow it.
- **Remote timeout.** The three-minute attempt deadline covered only a local Codex CLI. It now covers the SSH worker
  too: the SSH session is closed (the worker's launcher then removes the Codex container) and the attempt is retried
  once, as is a worker `timeout` reply.

## Token use

The maintainer's 100 games on GPT Luna: complete bad decisions fell from 20% to 15%, but tokens per game rose 82%.
Every model call was then logged with its phase and Codex usage (`lab/human-play.ts`, `lab/token-report.ts`; one
seated human that passes and approves, `low` reasoning; free call counts with `--fake-model`).

- **Codex's own prompt.** Each `codex exec` sent 10,900 input tokens for a one-line prompt: the coding-agent prompt,
  a skills list, permission, apps and collaboration notes, and the model's coding tools (a JavaScript runner,
  multi-agent tools, user questions). A one-line base prompt, those notes off and the model's own catalog entry
  without its tools bring that to 360 (`AI_CODEX_LEAN=off` restores the defaults). At low reasoning Luna spent no
  reasoning tokens, and Codex reported no cached input, so input size and the number of calls set the cost.
- **Calls the server settles.** A silent vote or mission card that the guards settle the same way for either answer
  (Merlin's cover votes before any failure, a winning Fail, the Fail convention) no longer reaches the model.
- **Rewrites.** Each flagged check (copied line, stock phrase, restatement, Fail wish, Merlin's early doubt) used to
  cost its own call with the full decision prompt; one rewrite now answers all of them, through the speaker's short
  prompt unless a Percival claim must be kept.
- **Prompt text.** The analysis guide, the Good team risk comparison and the Lady announcement rules go only to the
  seats and moments they are for. The speaker and line rewrites keep the table's reasoning level instead of the
  raised one for leaders, and re-explaining a guarded choice is a light call.

Three deals each, original and new bots, both on the lean Codex settings:

| Bots     | Tokens per game | Tokens per bot turn | Calls per bot turn | Missions | Proposals rejected |
| -------- | --------------- | ------------------- | ------------------ | -------- | ------------------ |
| Original | 302k            | 6.1k                | 0.99               | 3.3      | 0 of 10            |
| New      | 584k            | 6.0k                | 1.01               | 4.7      | 12 of 26           |

Per bot turn the new bots now cost what the original ones do. The lean settings take about 10,500 tokens off every
call, by the one-line measurement above roughly 60% of what an original bot turn costs on Codex's defaults. Their games are longer: two of the original's three ended 0-3 in three missions with every team
approved, while the new Good seats rejected risky teams and the games went to four or five missions. Of the new
bots' tokens, 71% are decisions, 23% the speaker and 6% guard re-explanations and rewrites; `AI_SPEAKER=off` drops the
speaker. On these six games the right-answer benchmark found the new bots' logged decisions right at least as often
as the original's in every category, so the lean Codex settings did not visibly change play; three games per side is
too few for more.

## Limits

- Sample sizes are small. Six saved positions are development positions, not an
  independent validation set, and self-play matches are few.
- The behaviour constants are heuristics. They rank hypotheses; only "proven"
  statuses are certain.
- Self-play pits the improved bots against each other, so win rates are not a
  strength measure; transcripts and blunder counts are the evidence.
- Production uses Codex with admin-selected model and effort. These runs used
  the OpenAI Responses API with `gpt-6-luna`, effort `low`.

## Reproduce

See `packages/backend/src/ai/lab/README.md`.
