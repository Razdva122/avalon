# Merlin early-vote cover

20 October 2026. Merlin retains the same objectives: three successful missions
AND surviving assassination. The policy now permits occasional early approval
of a team containing visible Evil as a deliberate risk for identity cover. It
adds no fixed approval percentage, random vote, quota, server override or extra
generation call.

This is an option, not a preference for dangerous teams. The private advice
compares cover benefit with mission risk, public grounds, recorded words and
votes, score and reachable alternatives. Repeated vetoes of visible Evil can
expose Merlin even after proposing a safer roster; an accusation or certainty
that cover will work is not required. Conversely, lack of public evidence or one
accurate early rejection alone does not establish a worthwhile cover benefit.
The safer winning plan remains the fallback. Known Evil remain Evil and may
sabotage after approval.

The exception applies only to team voting on missions 1–2 with fewer than two
failures. Later missions and two failures explicitly disable concealment
approvals. Existing Fail-threshold arithmetic is preserved: a safe two-Fail
mission can still be approved normally. The exception does not permit deliberate
dangerous team selection, playing Fail, fabricated evidence or public disclosure
of the cover motive. Both difficulties receive the contextual advice; live
inference below tested Sol-medium only.

## Saved-position comparison

The final comparison contains eight actual saved votes from seven seven-player
games: six early decisions with visible Evil and two controls at two failures.
Each position received two independent replies per policy from
`gpt-6.1-sol`, reasoning `medium`: **32 valid replies**, 16 old and 16 final.
Historical actions were Reject in all eight positions.

The original six positions were selected before inference. After the first
wording gave 7/8 early approvals, its preference for approval was removed. The
neutral wording returned 0/8 early approvals. Two additional saved positions
were then selected by their history, before their new inference: three prior
rejections of visible Evil, with no other rejections. The neutral wording still
rejected all four replies there. The final wording explicitly recognizes that
repeated veto pattern as an exposure risk, while retaining the neutral tradeoff.
It was rerun on all eight positions. These are exploratory, reused development
positions, not an independent validation set or a target approval frequency.

Both variants used the same current pipeline instructions and original observer
input, including historical discussion, private knowledge and notes. Only
`roleAdvice` differed. Preparation refreshed this policy from the real pipeline;
old advice for the two additional cases was restored from the baseline after
checking the shared old role advice. Assertions checked identical other context,
instructions and response schema; prompt SHA-256 hashes were saved. No future
events or revealed end-game roles were added.

| Saved decision ID                      | Mission | Successes : failures | Old, two replies | Final, two replies |
| -------------------------------------- | ------: | -------------------- | ---------------- | ------------------ |
| `40d06f01-107d-4337-a52d-bd8b1cfb8eaf` |       2 | 0:1                  | Reject, Reject   | Reject, Reject     |
| `497a831f-580a-4c86-b7c7-18336a04fffc` |       5 | 2:2                  | Reject, Reject   | Reject, Reject     |
| `557a318a-b415-4c4a-bb2b-b8d37e5fb077` |       2 | 1:0                  | Reject, Reject   | Reject, Reject     |
| `5de4056e-628f-4beb-92a2-dea57fc3ee3e` |       1 | 0:0                  | Reject, Reject   | Reject, Reject     |
| `6e10865a-13a5-4858-8868-ed28c2c8a76f` |       3 | 0:2                  | Reject, Reject   | Reject, Reject     |
| `7706d519-80e9-47f1-8673-ccae059730e2` |       1 | 0:0                  | Reject, Reject   | Approve, Approve   |
| `6c11d5e4-e323-4ce0-8f79-44d1a9a355cd` |       2 | 1:0                  | Reject, Reject   | Approve, Approve   |
| `8785e393-e9ad-4740-afa9-67f37e2dd526` |       2 | 0:1                  | Reject, Reject   | Reject, Reject     |

Early approvals changed from **0/12 to 4/12**; the final policy also rejected
8 early samples. Both policies rejected **4/4** dangerous two-failure controls.
All 32 replies passed `parseDecisionReply`, chose legal actions and had empty
`publicReason`.

The final approvals had explicit private cover reasons. In `6c11d5e4…`, Merlin
accepted possible failure at 1:0 after three accurate vetoes. In `7706d519…`,
approving a pair containing Merlin after rejecting an off-team pair supplied
plausible ordinary-Good behavior. In `8785e393…`, three prior vetoes still did
not outweigh the cost of a second failure and the reachable safer plan. No
approval treated known Evil as cleared or assumed a Success card.

Old baseline replies were retained; final replies were fresh. Initial old/new
calls and additional-case calls were interleaved; later wording checks ran as
separate batches. At most two requests were active, using fresh ephemeral
sessions through the existing `runCodex` transport. Two requests exceeded the
180-second evaluation deadline: initial after `40d06f01…` repeat 1 and final
`5de4056e…` repeat 2. Both cancellations were retained and only the missing
identical input was retried. No completed response was discarded or regenerated.
Across all wording experiments there were **60 valid responses and two cancelled
invocations**; the final comparison reuses 16 baseline responses and 16 final
responses. Each successful transport reported one attempt.

Measured usage for the final 32 replies: 586,432 input tokens, including
85,120 cached, and 5,378 output tokens, including 2,337 reasoning.
These totals exclude other exploratory replies and any unreported cancellation
usage; reasoning is included in output, not added again.

## Verification and limits

The executable comparison check asserts paired coverage, unchanged non-policy
input, legal silent votes, baseline vetoes, both approval and rejection under
the final early policy and all decisive rejections. Existing client,
player-count, decisive-match and pipeline suites passed: **90 tests**. Backend
TypeScript checking, source ESLint, Prettier and independent code review passed.

This establishes a change in decisions on selected positions, not an optimal
approval rate, improved Merlin survival or overall win rate. No complete game
continuation or Luna/regular inference was evaluated. Historical notes arose
under the previous policy and were shared unchanged; wording was refined using
these same positions. Production deployment was not changed.

Private local protocol: `/private/tmp/avalon-merlin-cover-20261020/`, including
`positions.json`, `positions-extra.json`, `before.json`, `before-extra.json`,
`after-v1.json`, `after-v2.json`, `after-v3.json`, `after-extra.json`,
`after-extra-v3.json`, all `results*.jsonl` and `errors*.jsonl`,
`hashes-final.json`, `summary-final.json` and `verify-final.cjs`.
Private prompts and one-off preparation/runners remain outside the repository.
