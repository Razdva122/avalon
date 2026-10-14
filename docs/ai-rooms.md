# AI Arena

[Documentation index](README.md) · [Production configuration](../deploy/ai-production.md)

AI rooms support public matches with one, two or three humans and the remaining
seats filled by bots, and administrator spectator games with 5–8 bots.
“Play with AI” stays visible and clickable in the lobby, including for guests,
while checking access, and when every bot mode is unavailable. It opens a setup
dialog before reserving a room. Owners of an existing match return to that room.

Setup offers Solo / With friends, with a choice of 2 or 3 human players including
the owner, regular bots, stronger opponents, and a compact
solo-only First game option. The discussion language defaults to the supported
interface language or English. Total seats are 5, 6, 7 or 8; 7/8 display Premium
and require the server-checked entitlement. Unavailable modes remain visible as
locked choices; one notification explains mode availability, known recovery hours,
or that the shared slot is occupied. Guests can reach authentication from setup.

Create game saves the selected language, size and `preparedDifficulty` in the
ready room without making an inference request. The owner is already seated.
Solo preparation expires after 60 seconds; friend preparation after 120 seconds.
Before launch, the owner can remove a guest using the Remove player button or
the guest avatar. This frees the reserved seat for another player without resetting
the preparation deadline. Bots and the owner cannot be removed from AI tables.
Lobby and archive cards count human players, bots and reserved empty seats separately;
joining or removing a guest updates the live roster immediately.
Reserved friend seats appear empty until authenticated humans join through the
room link. Launch waits for the selected number of humans; removing one guest
keeps the other guest seated. Older friend rooms retain their two-human default. The owner starts with one Start match button using the saved
settings. Launch rechecks quota and Premium; prepared settings cannot be altered
by a different launch payload. Legacy preparation without saved settings retains
its original table controls. Only one AI room reserves the shared slot at a time,
including preparation, active play and technical pauses.

Administrators retain their separate spectator arena controls. Before launch,
the administrator owner can replace one bot with a human seat. Role/decision
reveal is available only in games containing bots exclusively, never in mixed games.

Mixed games wait for human discussion and board actions. A persisted public text
message continues discussion, or Pass turn skips it. Spectator messages are not
passed to bots. AI games use their own statistics pool; mixed games do not change
ordinary human ratings. A completed human victory against either bot difficulty
unlocks the dedicated `ai_win` achievement and Morgana sticker.

## Table and characters

| Players | Good                             | Evil                     | Lady of the Lake |
| ------- | -------------------------------- | ------------------------ | ---------------- |
| 5       | Merlin, Percival, Servant        | Mordred, Morgana         | No               |
| 6       | Merlin, Percival, two Servants   | Mordred, Morgana         | No               |
| 7       | Merlin, Percival, two Servants   | Mordred, Morgana, Oberon | Yes              |
| 8       | Merlin, Percival, three Servants | Mordred, Morgana, Minion | Yes              |

A random subset of ten stable characters fills the table: Severin, Lada, Ray,
Vera, Mark, Nika, Oscar, Mira, Leo and Thea. IDs are `avalon-agent-1` through
`avalon-agent-10`. Their avatars and personalities do not identify their game
roles. Legacy `avalon-ai-*` profiles remain readable in old archives.

Mission sizes, required approvals and fail thresholds come from the game engine.
The fourth mission needs two Fail cards at seven/eight seats. Bots use seat
numbers from the board, not character names, in their discussions.

## Enable in development

Add to `packages/backend/.env.local` (ignored by Git):

```dotenv
AI_ROOMS_ENABLED=true
AI_CODEX_ENABLED=true
# Optional local CLI/profile paths:
# AI_CODEX_BIN=/absolute/path/to/codex
# AI_CODEX_HOME=/absolute/path/to/profile
```

Codex is the only supported provider and must be authenticated with ChatGPT.
The backend discovers available models and reasoning levels from that account.
There is no paid API fallback. For a separate worker, follow the remote SSH setup
in [Codex production](../deploy/codex-production.md).

Restart backend after environment changes. Arena administration requires
`isAdmin: true` on the verified account in the selected MongoDB database. A
username or client flag does not grant access. Public bot play requires a
verified signed-in account; it does not grant arena administration, arbitrary
model selection or access to private decisions and account quotas. The public
AI list/archive remains viewable without management rights, including when new
AI games are disabled.

## Discussion and decisions

Administrator creation accepts
`createAiRoom({ model, language, playerCount }, callback)`.
Discussion language is `en`, `ru` or `zh-tw`, with English as the legacy default.
The UI itself supports six languages. Unsupported model, language and table size
are rejected before room reservation. Public bot play accepts
`createHumanAiRoom(callback)` (standard) or
`createHumanAiRoom({ beginner: true }, callback)` (legacy beginner); the callback returns a `roomID` or an `error`.
The setup dialog passes `{ beginner, withFriend, difficulty, language, playerCount }`
to `createHumanAiRoom` to save the prepared settings.
`startHumanAiRoom(roomID, { difficulty: 'smart' | 'regular', language, playerCount?: 5 | 6 | 7 | 8 }, callback)`
starts the same prepared room and returns `ok: true` or an `error`. The server
chooses the model and reasoning effort, validates table size and Premium, and
forces Luna low bots with five seats for beginner rooms; clients cannot override
these settings or start another owner's room.
Access responses include `canPlay`, `botModes` availability and `ownRoomID` for
returning to the owner's active match. Room state records the selected mode as
`botDifficulty` after launch; `publicBotGame` identifies the public room before
and after launch. The server supplies its title and visible countdown deadlines.

On the first proposal of each mission, every player gets a public speaking turn
before the leader finalizes a team. After a rejection, only the new leader speaks:
a bot selects the final roster in that same turn, addresses another seat and
explains why it chose this team using earlier discussion and recorded votes.
A human leader gets a discussion turn followed by team selection; other humans
and bots do not get scheduled reply turns on repeat proposals. Voting stays quiet,
and the full public circle returns at the start of the next mission.
The chosen language applies to public speech, private notes, Evil council,
server announcements and post-game reflections. JSON keys and legal choice
values stay fixed. Ordinary public speech allows 240 characters;
server announcements can add text.

Private decisions and public speech are separated. Authoritative facts, legal
actions, side objectives and secrecy override personality. Public Percival claims
are testimony, not verified knowledge; claims and reactions use the model's own
words. The room's saved `botDifficulty` selects prompt advice independently of the
model: regular bots receive shorter team-selection/voting instructions and compact
role advice; smart bots retain deeper strategy and coalition negotiation. Matches
without a saved difficulty, including administrator games, use smart advice.
Rules, legal choices, private knowledge, language and output format remain shared.
Regular team decisions explicitly check the current roster, known and possible Evil,
the Fail threshold and a reachable alternative before acting. Both profiles treat
old model notes as fallible, correct contradicted notes under the same key and cite
the relevant mission/proposal in their sources. These instructions do not impose
server-selected teams or votes. Prompt-routing tests do not establish stronger
model play; improvements need model evaluation on recorded situations.

Strategic advice covers coalition support, the consequences of rejection,
combined mission constraints, consistent wizard-candidate risk and Merlin's
history of public words and votes. Off-team Good players account for the reduced
number of Good available inside a roster; Evil bluffing as Good check the same
arithmetic when explaining support. Unavoidable Evil presence is distinct from
actual Fail cards and the mission's Fail threshold. Good treat unqualified
voluntary support from an off-team player as a strong Evil read when that
player's claimed Good perspective forces enough Evil inside to sabotage. They
act on that read through trust, roster preferences and public persuasion, without
first requiring an explanation. The sourced read remains a revisable hypothesis;
reliable Good knowledge, supported two-Fail safety and explicit risk tradeoffs
still matter. Bots choose among all legal actions without mandatory self-inclusion
or failed-mission partner exclusions. Evil team advice assesses how the sequence
of actual proposals and votes exposes links to known allies, using public facts
to evaluate the credibility of support. It weighs immediate sabotage access
against cover and future influence; when the score permits, another roster or an
early Good success can serve a concrete later benefit. Decisive sabotage and
immediate Evil victory take priority. This advice sets no fixed voting pattern
or mandatory rejection of allies. Evil bots predict teammates' cards from
public discussion, recorded votes, completed missions and current incentives,
with no prearranged sabotage order or designated saboteur. Secret card decisions
retain the bounded public chat and vote history; future cards and unseen allies
remain unknown.
Good Lady-result announcements are deterministic and truthful.
The model receives human seat numbers and the rule that a bot announcement proven
false establishes the checker as Evil. Humans can choose their announcement, so
that inference does not apply to them. A bot can state its own mission card as
testimony to support an accusation without revealing Merlin or the wizard pair.

During ordinary play and the public Evil council, only `publicReason` is
published. `speech` remains the private decision reason used by diagnostics and
post-game review examples; the final post-game reflection uses `speech` publicly.

Only permitted private knowledge is supplied to each bot. Spectator role reveal
is AI-only; it must never expose hidden roles in human games. Public room state
omits private model traces and subscription quotas.

## Subscription, pacing and pauses

Public discussions and the Evil council remain sequential, without an artificial
message delay. Private team votes, secret mission-card decisions and post-game
reflections generate at most two replies concurrently. Private actions are applied
only after the entire phase has completed; post-game replies publish in seat order.
Both thinking seats animate during votes and reviews. Mission generators are not
identified publicly, so immediate Good cards cannot reveal which seats needed a model.
Codex records subscription token usage; there is no RUB budget or per-game paid
API charge. Administrator model selection and reasoning use the authenticated
Codex catalog. Public play uses these fixed server presets:

| Mode         | Model         | Reasoning effort | Required five-hour remainder | Required weekly remainder |
| ------------ | ------------- | ---------------- | ---------------------------- | ------------------------- |
| Smart bots   | `gpt-6.1-sol` | `medium`         | Greater than 60%             | Greater than 5%           |
| Regular bots | `gpt-6-luna`  | `medium`         | Greater than 30%             | Greater than 3%           |
| First game   | `gpt-6-luna`  | `low`            | Greater than 20%             | Greater than 1%           |

Both thresholds are strict: equality does not allow a new match. The selected
preset must also be supported by the authenticated model catalog. Missing or
invalid quota data disables public starts. If Codex explicitly reports a
weekly-only account (the other window is null), only the weekly threshold applies;
an omitted or malformed window still prevents admission. Availability and start admission share the same backend quota snapshot;
the server checks eligibility again when a player starts a match. Public clients
receive mode availability without the underlying percentages or account limits.

The Codex quota is account-wide and read through the same local/remote provider.
The backend shares a 60-second cache across users and coalesces simultaneous
refresh requests into one provider read. The cache refreshes on demand when its
snapshot expires; it does not poll the provider while the site is idle. Failed
reads are also cached for one minute, and an unavailable snapshot denies new
public starts. Model price comparisons are estimates from the checked-in pricing
table, not a bill or prediction of subscription consumption.

These checks limit admission; they do not reserve provider quota or guarantee
completion. Usage elsewhere on the same account can consume the shared quota
after admission. A match keeps its selected model and reasoning effort; lower
remaining quota prevents new starts rather than changing that preset mid-game.
Technical continuation of an already started match does not reapply these
admission thresholds; provider exhaustion can still pause the match.

Public solo rooms allow 60 seconds to launch after creation; friend rooms allow 120 seconds to join and launch. Settings are chosen before creation.
Every actual human discussion or board-action turn has 90 seconds plus the
remaining shared five-minute reserve. Overtime on either kind of turn spends
that reserve; it does not refill between turns. Once both run out, discussion
passes automatically, while a required board action stops the match, clears its
pending human turn and releases the shared slot.
The backend publishes `launchExpiresAt`, `humanActionBaseExpiresAt` and
`humanActionExpiresAt` so the table can show the turn time and remaining reserve.
Unrelated messages, partial team selections and polling do not extend a turn.
A late start or action is rejected.
These human-turn deadlines do not apply to administrator-created mixed games.
Prepared rooms are temporary and are not archived before gameplay starts.

Model requests have a ten-minute timeout and a twenty-two-minute ownership lease.
The technical limit is 400 calls for 5–7 bots and 450 for eight. Provider
failures pause the game instead of inventing a move. Completed discussion,
final selection and votes are retained for continuation; persisted message IDs
prevent duplicate publication. A backend restart is not a live-game resume protocol.

A paused AI match stops automatically after 15 minutes without continuation and
releases the shared slot. This applies to both recoverable technical pauses and
other paused errors, in public and administrator games. The stopped replay keeps
the reason for expiry; an unfinished game is ended manually without awarding a
winner. Resuming or stopping clears the old deadline. A later pause starts a new
15-minute period. Leaving the page or polling the room does not extend it.

## Persistence and retention

MongoDB stores replay state, public messages, model requests, private traces,
subscription usage and private decision traces. AI profile statistics use their own
rating season/pool. Completed human games and human rating models remain separate.
See [diagnostic retention](ai-storage-retention.md) before changing TTL settings. Public chat uses the shared
[persistent room chat](room-chat.md) service.

## Production and verification

Follow [production configuration](../deploy/ai-production.md) and
[Codex setup](../deploy/codex-production.md). Current code allows Codex
in both development and production when explicitly enabled. The production image
contains the pinned CLI and OpenSSH client; remote mode keeps ChatGPT credentials
on the worker VM.

From the repository root:

```sh
npm run test --workspace=packages/backend -- --runInBand src/ai
npx tsc --noEmit -p packages/backend/tsconfig.json
npm test --workspace=packages/ui
npm run build:ui
```

Tests use mocked model responses; provider authentication and complete gameplay
need a separately supervised live check. Tests never start paid inference requests.

Historical experiments, intermediate budgets and measured games are preserved in
[the September–October experiment notes](history/ai-experiment-2026-09-21-to-2026-10-03.md).
They are evidence for those dates, not current operational defaults.

Before assassination, Evil council advice is published to the room chat immediately,
with no post-game duplicate. An Evil human gets a speaking turn even when a bot
is the assassin. The human message becomes part of subsequent bot input. A human
assassin can shoot only after all council participants have spoken or passed;
this guard also applies during asynchronous state persistence. Good humans can
read the council in the common chat but do not get an Evil council turn.
