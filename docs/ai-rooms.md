# AI Arena

[Documentation index](README.md) · [Production configuration](../deploy/ai-production.md)

AI rooms are spectator games with 5, 6, 7 or 8 bots (default: seven). An
administrator creates and controls a match; spectators see the board, public
chat and optional AI role/decision reveal. Before launch, the database-admin owner can take one seat using “Play with bots”,
replacing one bot while preserving the selected table size. Other humans cannot
join. Mixed games pause at the human seat in each public discussion circle. The “Your turn to speak” prompt waits for a new human text message without opening chat automatically; a persisted message continues the circle, or “Pass turn” skips the speech. Team submission stays disabled until the circle finishes. Mixed games also wait for the human’s ordinary board actions and include their
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

Restart backend after environment changes. Management requires `isAdmin: true`
on the verified account in the selected MongoDB database. A username or client
flag does not grant access. The public AI list/archive remains viewable without
management rights, including when new AI games are disabled.

## Discussion and decisions

Creation accepts `createAiRoom({ model, language, playerCount }, callback)`.
Discussion language is `en`, `ru` or `zh-tw`, with English as the legacy default.
The UI itself supports six languages. Unsupported model, language and table size
are rejected before room reservation.

Bots discuss the proposal before the leader finalizes a team, then vote quietly.
The chosen language applies to public speech, private notes, Evil council,
server announcements and post-game reflections. JSON keys and legal choice
values stay fixed. Ordinary speech allows two short sentences and 240 characters;
server announcements and mandatory role claims can add text.

Private decisions and public speech are separated. Authoritative facts, legal
actions, side objectives and secrecy override personality. Public Percival claims
are testimony, not verified knowledge; other bots must express trust/distrust
when required. Table conventions restrict some team selections/votes after
failed missions. Good Lady-result announcements are deterministic and truthful.

Only permitted private knowledge is supplied to each bot. Spectator role reveal
is AI-only; it must never expose hidden roles in human games. Public room state
omits private model traces and subscription quotas.

## Subscription, pacing and pauses

Messages are paced at two seconds in development and ten seconds in production.
Codex records subscription token usage; there is no RUB budget or per-game paid
API charge. Model selection and reasoning use the authenticated Codex catalog.
The weekly Codex quota is account-wide, read through the same local/remote provider,
cached one minute on success and ten seconds on failure. Missing data means
unavailable, not zero remaining quota. Model price comparisons are estimates from
the checked-in pricing table, not a bill or prediction of subscription consumption.

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
