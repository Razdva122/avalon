# Optional Percival claims

After evaluation, the expanded claim-strategy paragraph was removed on
21 October 2026. The original short permission and shared handling of other
players' claims remain. The report below describes the evaluated candidate.

21 October 2026. Historical analysis covered 24 saved human games and 1,856
private decision traces from 16–20 October. Eighteen games included a bot
Percival with an eligible claim turn: 90 turns, comprising 85 team discussions
or selections and five Lady selections. No structured bot Percival declaration
was present in this sample. This is a selected historical export, not the full
production game population.

The initial chat search missed a Chinese human Merlin claim. Including it,
three direct human declarations were found: a real Percival with a mistaken
Morgana accusation, Morgana bluffing Percival, and Merlin using Percival cover.
The last case matters: a real Percival must not automatically counterclaim or
classify a rival claimant as Evil. The historical bot correctly preserved that
possibility and publicly challenged the reasoning without revealing its own role.

## Hypothesis and policy

Existing instructions permit claims but strongly emphasize concealment. The
hypothesis was that making the strategic comparison explicit could help a bot
identify a useful opportunity. More claims by themselves are not success.

A claim is worth considering when the information could change a contested
roster, prevent a decisive failure or answer a competing claim. Compare the
concrete change sought with ordinary public persuasion, reachable support and
the cost of exposing Merlin connections or removing cover. A resolved pair is
permission, not an obligation. An unresolved pair requires calibrated
uncertainty. Another claimant could be Merlin using cover; role collision is
not alignment proof. Opening ignorance and pressure to speak are not benefits.

Only Percival's private role advice changes, for both regular and smart bots.
The existing `claimMorgana` mechanism identifies the suspected Morgana from the
actual wizard pair; the claim must not name the other wizard or publish the
pair. No server claim schedule, random frequency, compelled counterclaim,
changed knowledge or additional generation is introduced.

## Selected saved positions

All eight positions, from eight games, and their analysis categories were frozen
before the first successful inference. The labels identify comparisons worth
examining, not mandatory claims or proven improvements in game outcome.

| Decision ID prefix | Situation                                                                               | Strategic question                                                               |
| ------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `78795cef`         | Resolved pair, final one-Fail mission; Morgana proposes herself                         | Does claiming add persuasion beyond a supported safe roster and mission history? |
| `5130e558`         | Resolved pair, final mission; competing roster includes a false checker                 | Would naming Morgana help resolve the actual fourth-seat dispute?                |
| `ccf2a159`         | Wizard candidate falsely claims Percival and accuses someone outside the actual pair    | Is a counterclaim useful when the preferred roster already has support?          |
| `be60a304`         | Wizard candidate claims Percival against the other candidate                            | Preserve the possibility of Merlin cover despite role collision.                 |
| `3a529dc2`         | Pair resolved privately, but public mission bounds already classify the proposed roster | Does disclosure add information the table needs?                                 |
| `53137719`         | Opening, no mission evidence, unresolved pair                                           | Concealment control.                                                             |
| `dbd11771`         | Final mission, unresolved pair and competing behavioral reads                           | Do not turn a suspicion into certain role knowledge.                             |
| `b52f5206`         | Two failures, unresolved pair and missing coalition support                             | Compare a calibrated claim with persuading one more voter.                       |

## Method

Each condition receives two fresh replies from `gpt-6.1-sol`, reasoning
`medium`, through the existing `runCodex` transport. Two requests run at most
concurrently; condition order reverses on the second repeat. In each pair the
observer context, legal actions, response schema and common instructions are
identical. Only the appended Percival advice differs. Historical chat, personal
knowledge and notes are retained; future revealed roles and outcomes are not
injected. The original historical action is not a fresh baseline response.

Common instructions are regenerated from a reconstructed request and frozen
for both conditions. That request has empty engine history, so history-triggered
Lady-choice guidance is omitted, although the original mission and check records
remain in the observer context. This is a controlled reconstructed-context
comparison, not an exact replay of a historical production prompt.

Every completed raw response is saved before parsing and public-speech checks.
Validation checks the real parser, claim eligibility and public-speech hygiene.
An executable protocol check checks paired coverage, unchanged non-policy input,
prompt hashes, legal actions and claim targets from the actual candidate pair.

## Results

All **32 completed replies** passed request-aware parsing, claim validation and
public-speech hygiene after correcting the evaluation harness described below.
The executable protocol check passed with complete paired coverage and saved
SHA-256 hashes. Manual review found no public disclosure of Merlin or the
wizard pair.

| Measure                                             | Before, 16 replies | After, 16 replies |
| --------------------------------------------------- | -----------------: | ----------------: |
| Intentional Percival claims                         |                  0 |                 0 |
| Opening claims                                      |                0/2 |               0/2 |
| Counterclaims in the two competing-claim cases      |                0/4 |               0/4 |
| Claims in the two resolved-pair final-mission cases |                0/4 |               0/4 |

The extra advice made concealment reasoning explicit in several replies, but
**did not demonstrate increased claim use**. Do not describe this as fixing
claim reluctance, or conclude that every historical silence was correct.

- In `78795cef`, both updated replies kept the safe roster and argued that
  ordinary public evidence sufficed; the next leader was the bot itself.
- In `5130e558`, the live dispute concerned choosing the fourth seat between
  2 and 7. Naming the already excluded Morgana did not supply the missing
  public distinction. Both updated replies used the earlier decisive success
  and the false-check dispute instead.
- In `ccf2a159`, the favored roster already had a reachable majority. One
  baseline privately treated a rival's false Percival claim as resolving the
  wizard pair. Both updated replies preserved the unresolved pair; no immediate
  counterclaim was needed to preserve the roster.
- In `be60a304`, the human claimant was actually Merlin using cover. Both
  updated replies explicitly retained that possibility. One selected 2,3,6
  instead of 3,5,6 on recorded votes, without exposing roles. Analyst-only final
  roles show that this removed Morgana; those roles were not sent in the prompt.
- In `b52f5206`, one updated reply changed 3,5,6 to 1,3,6 from public voting
  differences. Both rosters were actually all-Good; this is variation in
  selection, not evidence of improved safety.
- The remaining cases retained their rosters. Across matched repeats, 14/16
  roster selections were unchanged. No other player's reaction was generated.

The useful candidate condition is narrower than "pair resolved" or "two
failures": a claim should have a concrete prospect of changing a disputed
mission decision that ordinary public reasoning cannot adequately settle,
with a defensible Morgana read and acceptable cost to Merlin cover. These
positions do not establish that this condition was met, or supply a validated
positive claim example. A future study of actual claimant/recipient sequences
would be needed to test the persuasion benefit; forcing claims on these cases
would answer a different question.

The [recipient-vote follow-up](../2026-10-21-percival-reactions/README.md)
subsequently tested hand-authored disclosures at the same eight positions:
140 replies found one repeated helpful vote change and one repeated harmful
change. Those immediate conditional votes do not establish full-game benefit.

Measured successful-response usage: **632,194 input tokens**, including 12,544
cached, and **18,886 output tokens**, including 8,989 reasoning. Reasoning is
included in output, not added again. Thirty-one completed invocations reported
one attempt; one reported two, with one unreported failed-attempt usage record.
These totals exclude unreported failure usage.

The first running harness omitted the request argument to `parseDecisionReply`,
so it rejected one otherwise valid structured distrust stance. Its complete raw
response was already saved. The harness was corrected and all 32 preserved raw
responses were revalidated with their requests; no completed response was
regenerated or discarded. The original error remains in the protocol. All
successful model responses were retained regardless of outcome.

Local verification: the new policy regression first failed on both difficulties,
then passed. Seven relevant suites passed, **81 tests** total; backend TypeScript,
ESLint and Prettier passed. Independent scoped review found no material policy
or evaluation issues, while identifying the reconstructed-history limitation
above.

## Limits and local protocol

This checks single-position decisions and wording. It does not simulate the
other players' responses to a claim, continue the games, establish an optimal
claim frequency or demonstrate improved win rate or Merlin survival. Historical
notes were produced under the earlier policy. Regular bots receive the advice
but fresh inference here tests smart/Sol-medium only. Deployment is unchanged.

Private protocol: `/private/tmp/avalon-percival-claims-20261021/`, containing
`positions.json`, `selection.json`, `before.json`, `after.json`, `prepare.cjs`,
`run.cjs`, raw and parsed JSONL responses, errors, prompt hashes, summary and
`verify.cjs`. Private payloads and one-off runners remain outside the repository.
The first sandboxed batch failed with transport errors and no completed replies;
the subsequent live batch ran after explicit authorization to transmit the
historical contexts. Usage summaries cover completed replies only.
