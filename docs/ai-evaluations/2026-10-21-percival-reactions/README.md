# Recipient votes after a Percival disclosure

21 October 2026. Follow-up to the optional-Percival-policy comparison, using the
same eight saved positions. The question here is whether a concrete disclosure
changes other bots' willingness to approve a fixed roster, not whether Percival
chooses to disclose spontaneously.

## Frozen intervention

Each condition contains the same short, hand-authored public roster argument.
The treatment appends a Percival declaration naming a suspected Morgana and
records the accompanying structured `publicRoleClaims` testimony. Baseline has
no added declaration. No role becomes verified by the engine, and recipient
private knowledge is identical across the pair. The treatment tests this whole
declaration, including its Morgana accusation and metadata; it does not isolate
the words “I am Percival” alone.

Disclosure text, target roster, recipient set and safety labels were frozen
before inference in the private `selection.json`. Resolved-pair accusations are
assertive; unresolved accusations explicitly retain uncertainty. Suspects follow
the historical Percival reasoning rather than analyst hindsight. In the opening
control there was no discriminating evidence: the first candidate in the saved
pair is named only as an unsupported possibility. This is deliberately an
unjustified-disclosure control, not a recommended opening tactic.

Seven fixed rosters are all-Good. In the Chinese `be60a304` position, the
historical roster 3,5,6 contains Morgana 5 and permits sabotage at the one-Fail
threshold; the real Percival instead suspects actual Merlin 2. This mistaken
counterclaim is retained to test potential harm. Actual final roles classify
safety only in analysis and never enter the prompts.

## Recipient reconstruction

All 35 other bot seats are included; human seats and the declaring Percival do
not receive model calls. Each recipient gets the shared public record at the
saved cutoff, their own personality, role visibility, private inspections,
past mission cards, decision history and private notes. No Percival hypotheses
or wizard pair are shared with them. Own mission cards are recovered from past
mission-action traces; missing Good actions are necessarily Success. No missing
Evil card had to be guessed.

For non-opening positions, private snapshots come from each recipient's latest
pre-cutoff trace. The opening preceded the first trace for all five recipients:
only static initial role visibility and personality are copied from their first
opening traces, with no checks, notes, previous decisions or subsequent chat.
The public record remains the earlier cutoff record. A just-completed personal
inspection is retained as private check knowledge when moving to the vote.

Requests reconstruct completed mission/vote/check history and regenerate current
smart-bot voting instructions, including applicable Lady and Merlin advice.
Both conditions have identical instructions, schemas, target team and personal
state. The only differences in observer context are the last public statement
and its structured declaration. This is a counterfactual immediate vote from a
reconstructed state, not an exact historical prompt replay or full continuation.

## Measurement

Each of 35 recipient positions receives two conditions and two independent
repeats: **140 planned replies**, using `gpt-6.1-sol`, reasoning `medium`.
Condition order reverses on repeat two; at most four requests run concurrently.
Each bot chooses the actual legal `approve`/`reject` action with voting silence;
its private reason provides the evidence about recognition and trust. No
respondent speeches, rebuttals or later votes are fed into another bot's input.

The declaring Percival is assumed to keep supporting its own fixed roster.
For each repeat, sum approvals of the other bots and this fixed one vote. If
that reaches the game's approval threshold, no human approval is needed.
Otherwise report the number of human approvals still needed and whether all
available humans could fill the gap. Human behavior is unmodeled: these are
conditional support bounds, not a claim that a real coalition was assembled.

A safe roster contains fewer Evil than `failsRequired` and cannot fail even if
all Evil play Fail. An unsafe roster permits sabotage; it does not guarantee a
Fail. Good and Evil votes are reported separately because Evil may reject a
safe team or approve one for cover. A flip in one stochastic repeat is not a
reliable treatment effect. Repeated same-direction flips are identified
separately; two repeats still do not establish a population effect.

## Results

All **140 completed replies** passed request-aware validation, with no missing
cells, invalid outputs, regeneration or transport errors. Each invocation
reported one attempt. Prompt hashes, paired identity and recipient privacy
checks passed. Independent scoped review found no material issues in the
preparation, verification or interpretation.

Of 70 matched recipient/repeat comparisons, **62 votes were unchanged** and
eight differed. Across all other-bot votes, approvals rose from 39/70 to 43/70,
but that aggregate mixes helpful and harmful support:

| Fixed roster class                      | Control approvals | With disclosure |
| --------------------------------------- | ----------------: | --------------: |
| Seven safe rosters                      |             37/64 |           39/64 |
| One unsafe roster                       |               2/6 |             4/6 |
| Good-bot approvals of safe rosters      |                25 |              27 |
| Good-bot approvals of the unsafe roster |                 0 |               2 |

The two stable changes below mean the same bot changed in the same direction
across **both of two repeats**. This is stronger qualitative evidence than a
single flip, not a population-level reliability estimate.

### Support by position

Numbers include the declaring Percival's fixed assumed approval. Each cell
lists repeat one / repeat two. **Four approvals are required in every case.**
Human votes are not included; up to the listed number of humans could still
approve. A count below four is not necessarily a failed vote. In `5130e558`,
only one human is available, so two existing approvals cannot reach four even
if that human approves.

| Position   | Team    | Safety | Humans | Control support | With disclosure |
| ---------- | ------- | ------ | -----: | --------------: | --------------: |
| `78795cef` | 3,4,6,7 | Safe   |      1 |           3 / 3 |           3 / 3 |
| `5130e558` | 1,2,4,5 | Safe   |      1 |           2 / 2 |           2 / 2 |
| `ccf2a159` | 3,5,7   | Safe   |      1 |           5 / 5 |           5 / 5 |
| `be60a304` | 3,5,6   | Unsafe |      2 |           2 / 2 |           3 / 3 |
| `3a529dc2` | 1,5,6   | Safe   |      2 |           4 / 4 |           4 / 4 |
| `53137719` | 2,4     | Safe   |      1 |           6 / 6 |           6 / 5 |
| `dbd11771` | 1,4,5,6 | Safe   |      2 |           2 / 2 |           4 / 3 |
| `b52f5206` | 3,5,6   | Safe   |      1 |           4 / 3 |           3 / 4 |

Across the seven safe rosters and two repeats, the number of cohorts reaching
four without a human approval changed from **7/14 to 8/14**. This conditional
support measure is not an observed match win or actual human coalition.

### Helpful disclosure: `dbd11771`

On the final mission at 2:2, Percival 1 proposes 1,4,5,6, replacing 3 with 4.
In final-role analysis, 3 is Morgana and 4 is Merlin; the real Percival's pair
was still unresolved, so the intervention preserves that uncertainty:

> Я Персиваль. 3 подозреваю как Моргану; пара ещё не разрешена.

The common roster argument already cited 4's rejections of the failed teams
and 3's pressure to include 2 after the first failed pair. The disclosure
provided a further, explicitly fallible reason to revisit the wizard choice.

- Good bot 6 rejected without disclosure in both replies, but approved with it
  in both. It explicitly cited the new declaration alongside public votes and
  the two-Fail threshold that made the earlier four-seat success weak evidence.
- Good bot 5 approved in one of two controls and both disclosure replies.
- Other matched votes did not change. Oberon 2 varied between repeats in both
  conditions, so the bot-only quorum in repeat one includes an Evil approval.

Support including Percival rises from two to four in repeat one, and two to
three in repeat two. The second still needs one human approval. In both
conditions with disclosure, Percival and the two Good bots supply three votes;
the actual human Merlin could supply the fourth, but no human response was
simulated. This is a concrete candidate missed by the earlier spontaneous-
claim run, where Percival stayed concealed. It does not establish that an
actual claim would guarantee passage or preserve Merlin at assassination.

### Harmful disclosure: `be60a304`

At two failures, Percival 3 prefers 3,5,6 and suspects 2 rather than 5. The
historical human 2 had already claimed Percival and accused 5. Final roles
show that 2 is Merlin using cover and 5 is Morgana; the proposed team permits
a decisive sabotage. The intervention is an honestly uncertain but mistaken
counterclaim:

> 我是派西維爾；暫疑2是莫甘娜，但候選尚未分清。

Good bot 6 rejected both control replies, preferring to replace 5 with 2 in
a later roster. It approved both disclosure replies. Its evidence notes
recognize both declarations as unverified, yet the competing claim weakens
the earlier accusation of 5 and restores preference for the unsafe roster.

The other two recipients were unchanged: Good bot 4 rejected, Morgana 5
approved for an immediate sabotage opportunity. Support including Percival
rises from two to three in both repeats, reducing the human approvals still
needed from two to one. The roster still does not reach a bot-only majority;
this is increased support for risk, not an observed mission loss.

### Other positions

- `78795cef`, `ccf2a159` and `3a529dc2`: every recipient/repeat vote is unchanged.
  Available mission/check evidence or existing coalition support already
  suffices for the bot's decision.
- `5130e558`: no votes change. Good bots retain suspicion of Percival 4 from
  prior behavior. One reason explicitly says the claim about 6 fits existing
  deductions but does not clear 4. Naming Morgana does not settle the actual
  fourth-seat dispute with 7.
- `53137719`: Good bot 6 switches from approval to rejection in one repeat;
  the other repeat is unchanged. It notes the claim but prefers self-inclusion.
  This is not a repeated same-direction effect; the opening roster retains
  enough assumed support either way.
- `b52f5206`: Good bot 1 rejects in both conditions and both repeats, still
  preferring itself to 5. Mordred 2 changes in opposite directions across the
  two repeats while weighing cover against blocking a safe team. Each condition
  reaches the conditional threshold in one of two repeats; no consistent
  persuasion benefit is shown.

### What this supports

A role disclosure can affect votes, including when listeners explicitly know
it is not proof. The strongest positive candidate here is a consequential
wizard replacement at 2:2: mission/vote evidence already supports the change,
but an unresolved dispute keeps Good voters on the wrong roster. The strongest
negative candidate has the same social mechanism applied to a mistaken wizard
read, undermining Merlin's correct cover claim.

These results justify evaluating the expected roster change and the credibility
of the Morgana read together. A true Percival declaration does not make its
Morgana accusation true. Resolved pair alone and a desire to counterclaim did
not supply a general benefit in these positions. The study supports keeping
claims optional and context-sensitive, without a mandatory frequency; it does
not establish an optimal claim rule.

Measured completed-response usage: **2,508,754 input tokens**, including
805,248 cached, and **40,634 output tokens**, including 17,329 reasoning.
Reasoning is part of output, not added again. All 140 invocations reported one
attempt, with no unreported-attempt usage.

## Verification and limits

Preparation asserts paired identity outside the intervention, legal target
eligibility, publication hygiene, original scores/proposal arithmetic, correct
recipient identity and private card ownership. Final checks validate every raw
reply using `parseDecisionReply` with its actual request, exact balanced repeat
coverage, prompt SHA-256 hashes, legal silent votes and unchanged recipient
knowledge. All completed raw replies are retained before semantic validation;
none are regenerated for their vote or reasoning.

No complete discussion, human response, mission cards, assassination or future
Merlin-survival effect is simulated. The texts are hand-authored alternatives,
not spontaneously chosen claims or an evaluation of the new Percival policy's
win rate. The historical notes are fallible and reflect older play. These are
eight selected positions with two repeats, not representative production rates.
No production strategy or deployment is changed by this follow-up study.

Private local protocol: `/private/tmp/avalon-percival-reactions-20261021/`,
including `extract.py`, `positions.json`, `selection.json`, `prepare.cjs`,
`inputs.json`, `run.cjs`, `raw.jsonl`, parsed/validated responses, errors,
`verify.cjs` and `summary.json`. The user explicitly authorized 140 external
requests with the recipient contexts before the successful launch. Private
payloads and one-off runners stay outside the repository.
