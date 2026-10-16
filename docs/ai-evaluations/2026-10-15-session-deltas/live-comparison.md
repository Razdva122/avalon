# Full games: fresh requests versus persistent sessions with deltas

Both requested games completed on 15 October 2026. The delta mode reduced mean uncached input per generation by **22.7%**, but used **33.3% more generations**. Total uncached input during play was **3.0% higher**. This pilot does not demonstrate lower total token usage per completed game.

The observed account weekly remaining indicator fell by 2 percentage points during the fresh game and 1 during the delta game. Those integer, account-wide readings are not isolated charges for these games and do not establish a 50% quota saving.

## Identical starting setup

The user selected two autonomous games with identical starts. Initial role/seat equality was verified against both live game records.

| Seat | Personality       | Role     |
| ---- | ----------------- | -------- |
| 1    | Lada, diplomat    | Morgana  |
| 2    | Ray, gambler      | Percival |
| 3    | Vera, guardian    | Servant  |
| 4    | Mark, provocateur | Mordred  |
| 5    | Severin, analyst  | Merlin   |

First leader: seat 1. Same clockwise order, seeded role/leader/assassin selection, standard five-player rules, Russian language, `gpt-6.1-sol`, medium reasoning, no artificial turn delay. Transport was local Codex CLI 0.160.0 with tools disabled and an owned temporary profile. Five post-game conclusions used fresh requests in each mode and are accounted for separately.

The game engine and decision pipeline were unchanged. Modes differed in session reuse and whether repeated input was replaced with exact updates. Later rosters, votes and public statements were allowed to diverge according to the bots' own decisions.

## Measurements during play

| Metric                             | Fresh request per generation | Persistent session per player, deltas |
| ---------------------------------- | ---------------------------: | ------------------------------------: |
| Played missions                    |                            4 |                                     4 |
| Submitted team proposals           |                            5 |                                     8 |
| Model generations                  |                           54 |                                    72 |
| Input tokens, including cached     |                      809,550 |                             1,869,828 |
| Cached input tokens                |                      126,720 |                             1,166,336 |
| Cached share of input              |                        15.7% |                                 62.4% |
| Generations with a cache hit       |                      14 / 54 |                               53 / 72 |
| Uncached input tokens              |                      682,830 |                               703,492 |
| Mean uncached input per generation |                       12,645 |                                 9,771 |
| Output tokens, including reasoning |                       17,116 |                                18,552 |
| Peak input for one generation      |                       16,485 |                                41,133 |
| Newly submitted user-message text  |                973,156 bytes |                         613,559 bytes |
| Wall time, including conclusions   |                    13.18 min |                             14.25 min |
| Failed generation results          |                            0 |                                     0 |
| Technical pauses / resumes         |                        0 / 0 |                                 0 / 0 |
| Weekly account remaining           |                    75% → 73% |                             73% → 72% |
| Match winner                       |          Evil, Merlin killed |                   Evil, Merlin killed |

Input includes cached tokens. Uncached input is input minus cached. Reasoning is already included in output; it must not be added again. Message bytes measure the new text appended by our runner and are not API token counts.

The delta game's new message text was 37.0% smaller in total despite the additional calls. Its mean uncached input was 22.7% lower, while total uncached input was 3.0% higher and output was 8.4% higher. Wall time was 8.1% longer.

Including the five conclusions per mode: **59 versus 77 generations**, **748,006 versus 770,765 uncached input tokens**, and **18,700 versus 20,232 output tokens**. The same approximately 3% difference in total uncached input remains.

## Why the call counts differed

The delta game needed three additional proposals overall, accounting for exactly 18 additional model generations: one leader decision plus five votes for each extra proposal.

- Mission 2: fresh mode immediately approved `5, 2, 3`. Delta mode rejected `5, 2, 3`, `5, 3, 4`, and `2, 3, 4`, then approved `5, 2, 3` on proposal 4.
- Mission 3: fresh mode approved `5, 3` immediately. Delta mode rejected `5, 4`, then approved `5, 2`.
- Mission 4: fresh mode rejected `5, 3, 4`, then approved `5, 2, 3`. Delta mode approved `5, 2, 3` immediately.

Both games therefore ended with the same mission-result sequence: Fail, Success, Success, Success. Additional calls came from coalition decisions, rather than retries or invalid output. This is an observed path difference, not proof that delta input causes slower consensus.

## Playing quality and state integrity

All model replies passed the structured parser and game checks. No public-speech guard rejection or technical pause occurred. A narrow automated check found no Good approval of a team containing an individually known Evil player (one applicable decision per mode). Neither game tested an Evil player's immediate winning-card opportunity at two mission failures; do not interpret that empty check as evidence of correct play in that situation.

Actual transmitted deltas, rather than regenerated patches, were replayed separately for each player. **All 72 snapshots and complete instruction sets reconstructed exactly**, and each reconstructed role/seat matched the live assignment. Counts and transmitted-byte totals match the live report. No implementation/protocol references were found in in-game public speech by the narrow text scan.

Concrete observations:

- Both Evil councils identified Merlin at seat 5 by comparing its early exclusion of Evil seat 1 with seat 3's initial preference including seat 1. Both explicitly considered ordinary self-inclusion, chance and Percival knowledge as alternative explanations.
- In delta mode, Morgana maintained a false Success-card accusation. During mission 2 it rejected an advantageous team because approval would contradict its own public alignment arithmetic and expose a connection with its ally. The private explanation explicitly framed this as cover, not a mistaken belief about its side.
- During mission 4, Morgana falsely claimed Percival and called the real Percival, seat 2, Morgana. The real Percival retained its own card knowledge and rejected that account. Good leader seat 3 acknowledged that the new claim was unverified, retained the successful `5, 2, 3` team and gave a public explanation. The false role claim was intentional bluff, not a factual hallucination by a Good bot.
- Delta mode had more difficulty reaching consensus in mission 2; this increased total usage despite cheaper average requests. The reasoning and public positions differed between games, so there is no basis to attribute this solely to persistent memory or patches.

There was no observed technical degradation or loss of supplied state. Two autonomous matches do **not** establish unchanged playing strength, improved bluffing, or a win-rate difference. Exact recoverability of the wire input does not prove that the model internally retained every fact without error.

## Quota interpretation and decision

The quota snapshots cover the whole account, including this chat and any other activity. The experiment was sequential with no window reset between its snapshots; its resolution is still too coarse to isolate the cost of one game. Fewer observed percentage points in delta mode is encouraging, but not a reliable quota multiplier.

The change achieved smaller submitted messages and cheaper mean uncached input. **A total per-game saving is not established**: uncached input was nearly equal, output and call count were higher, and the quota indicator was coarse. Keep the mode experimental; the production runner was not switched.

## Archive status

The completed experiment's one-off analysis scripts and machine exports were
removed during YAGNI cleanup on 16 October 2026. Aggregate measurements, observed
behavior and the limits of this comparison are retained above.

Both games reached `finished`, five separate persistent sessions were created, initial assignments matched, and no owned temporary profile remained after cleanup. No additional bot model calls were made for analysis. The earlier 511-test implementation check remains the relevant backend validation; this comparison changed only evaluation analysis scripts.
