# AI Arena

[Documentation index](README.md) · [Production configuration](../deploy/ai-production.md)

AI rooms support public matches with one human and four bots, and spectator
games with 5, 6, 7 or 8 bots (default: seven). A signed-in player sees “Play with
bots” next to “Create room” when at least one mode is available. It opens a
prepared room named `Username vs 4 Bots`, with the owner already seated. On the
table, the owner chooses the discussion language and starts with “Smart bots”
or “Regular bots”; regular bots are described as useful for understanding the
principles of the game. The language defaults to the user's interface language
when supported, otherwise English. Preparing a room makes no inference request.
An owner can return to their existing room without creating another.
Only one AI room can reserve the shared slot at a time, including preparation,
active play and technical pauses. Other players cannot create or start another
AI match while that slot is occupied.

Administrators retain the separate arena controls for creating and managing
spectator games. Before launch, the database-admin owner can take one seat,
replacing one bot while preserving the selected table size. Other humans cannot
join an existing room. Spectators see the board, public chat and optional AI
role/decision reveal in games containing only bots.

Mixed games pause at the human seat in each public discussion circle. The “Your turn to speak” prompt waits for a new human text message without opening chat automatically; a persisted message continues the circle, or “Pass turn” skips the speech. Team submission stays disabled until the circle finishes. Mixed games also wait for the human’s ordinary board actions and include their
public chat in bot context. Role/decision reveal is disabled for everyone in a
mixed room. Mixed games award neither human nor AI profile ratings.
Spectator messages are not passed to the bots. AI games use their own profile
statistics/rating pool and do not award human ratings or achievements.

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
`createHumanAiRoom(callback)`; the callback returns a `roomID` or an `error`.
`startHumanAiRoom(roomID, { difficulty: 'smart' | 'regular', language }, callback)`
starts the same prepared room and returns `ok: true` or an `error`. The server
chooses the model, reasoning effort and five-seat table; clients cannot override
these settings or start another owner's room.
Access responses include `canPlay`, `botModes` availability and `ownRoomID` for
returning to the owner's active match. Room state records the selected mode as
`botDifficulty` after launch; `publicBotGame` identifies the public room before
and after launch. The server supplies its title and visible countdown deadlines.

Bots discuss the proposal before the leader finalizes a team, then vote quietly.
The chosen language applies to public speech, private notes, Evil council,
server announcements and post-game reflections. JSON keys and legal choice
values stay fixed. Ordinary public speech allows 240 characters;
server announcements can add text.

Private decisions and public speech are separated. Authoritative facts, legal
actions, side objectives and secrecy override personality. Public Percival claims
are testimony, not verified knowledge; claims and reactions use the model's own
words. Strategic advice covers coalition support, the consequences of rejection,
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
or failed-mission partner exclusions. Evil card
coordination is optional advice; future cards and unseen allies remain unknown.
Good Lady-result announcements are deterministic and truthful.

During ordinary play and the public Evil council, only `publicReason` is
published. `speech` remains the private decision reason used by diagnostics and
post-game review examples; the final post-game reflection uses `speech` publicly.

Only permitted private knowledge is supplied to each bot. Spectator role reveal
is AI-only; it must never expose hidden roles in human games. Public room state
omits private model traces and subscription quotas.

## Subscription, pacing and pauses

Messages are paced at two seconds in development and ten seconds in production.
Codex records subscription token usage; there is no RUB budget or per-game paid
API charge. Administrator model selection and reasoning use the authenticated
Codex catalog. Public play uses these fixed server presets:

| Mode         | Model         | Reasoning effort | Required five-hour remainder | Required weekly remainder |
| ------------ | ------------- | ---------------- | ---------------------------- | ------------------------- |
| Smart bots   | `gpt-6.1-sol` | `medium`         | Greater than 80%             | Greater than 5%           |
| Regular bots | `gpt-6-luna`  | `low`            | Greater than 20%             | Greater than 2%           |

Both thresholds are strict: equality does not allow a new match. The selected
preset must also be supported by the authenticated model catalog. Missing or
invalid quota data, including an absent five-hour window, disables public
starts. Availability and start admission share the same backend quota snapshot;
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

Public rooms allow 90 seconds to choose the language and launch after preparation.
Every actual human discussion or board-action turn also has a 90-second deadline.
The backend publishes `launchExpiresAt` and `humanActionExpiresAt` so the table
can show the remaining time. Unrelated messages, partial team selections and
polling do not extend a turn. At expiry the match stops, clears its pending
human turn and releases the shared slot. A late start or action is rejected.
These human-turn deadlines do not apply to administrator-created mixed games.
Prepared rooms are temporary and are not archived before gameplay starts.

Model requests have a ten-minute timeout and a twelve-minute ownership lease.
The technical limit is 400 calls for 5–7 bots and 450 for eight. Provider
failures pause the game instead of inventing a move. Completed discussion,
final selection and votes are retained for continuation; persisted message IDs
prevent duplicate publication. A backend restart is not a live-game resume protocol.

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
