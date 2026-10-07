# AI Arena

[Documentation index](README.md) · [Production configuration](../deploy/ai-production.md)

AI rooms are spectator games with 5, 6, 7 or 8 bots (default: seven). An
administrator creates and controls a match; spectators see the board, public
chat and optional AI role/decision reveal. Before launch, the database-admin owner can take one seat using “Play with bots”,
replacing one bot while preserving the selected table size. Other humans cannot
join. Mixed games wait for the human’s ordinary board actions and include their
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
YANDEX_API_KEY=your-key
YANDEX_FOLDER_ID=your-folder
YANDEX_MODEL=qwen3.6-35b-a3b
AI_TOTAL_BUDGET_RUB=700
AI_MATCH_BUDGET_RUB=100
```

For Codex instead of, or alongside, Yandex:

```dotenv
AI_ROOMS_ENABLED=true
AI_CODEX_ENABLED=true
# Optional paths to an installed/authenticated CLI and its profile:
# AI_CODEX_BIN=/absolute/path/to/codex
# AI_CODEX_HOME=/absolute/path/to/profile
```

Codex must be authenticated with ChatGPT. The backend discovers available models
and reasoning levels from that account; API-key billing is not used by this
runner. Yandex credentials are unnecessary when only Codex is configured.
The model catalogue shown for Yandex contains Qwen3.6 35B and DeepSeek V4 Flash;
`YANDEX_MODEL` selects the default, while each room retains its chosen model.

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

## Budgets, pacing and pauses

| Mode        | Yandex shared budget                | Initial per-game cap | Message pacing |
| ----------- | ----------------------------------- | -------------------- | -------------- |
| Development | 700 RUB lifetime experiment         | 100 RUB              | 2 seconds      |
| Production  | 3000 RUB per 30 calendar days (MSK) | 200 RUB              | 10 seconds     |

Environment overrides may lower the initial caps. Production periods are anchored
at first budget access/creation and renew automatically; they are neither calendar
months nor rolling windows. Spending and reservations survive restarts.
The administrator can explicitly continue a game with a doubled room cap
(first default production continuation: 200 → 400 RUB). This preserves previous
spending and does not increase the shared cap. Never reset ledgers to resume a game.

Yandex reserves before dispatch and settles confirmed token usage. Codex records
subscription/token usage separately; the UI does not show it as a RUB charge.
The weekly Codex quota is account-wide, read through the same local/remote provider,
cached one minute on success and ten seconds on failure. Missing data means
unavailable, not zero remaining quota. Model price comparisons are estimates from
the checked-in pricing table, not a bill or prediction of subscription consumption.

Model requests have a ten-minute timeout and a twelve-minute ownership lease.
The technical limit is 400 calls for 5–7 bots and 450 for eight. Budget/provider
failures pause the game instead of inventing a move. Completed discussion,
final selection and votes are retained for continuation; persisted message IDs
prevent duplicate publication. A backend restart is not a live-game resume protocol.

## Persistence and retention

MongoDB stores replay state, public messages, model requests, private traces,
aggregate costs and archived room budgets. AI profile statistics use their own
rating season/pool. Completed human games and human rating models remain separate.
See [accounting and diagnostic retention](ai-storage-retention.md) before changing
TTL settings or interpreting a charge after a crash. Public chat uses the shared
[persistent room chat](room-chat.md) service.

## Production and verification

Follow [Yandex production configuration](../deploy/ai-production.md) or
[Codex production setup](../deploy/codex-production.md). Current code allows Codex
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
need a separately supervised live check. `src/ai/evaluate.ts` performs real paid
Yandex calls when invoked and is not part of the ordinary test suite.

Historical experiments, intermediate budgets and measured games are preserved in
[the September–October experiment notes](history/ai-experiment-2026-09-21-to-2026-10-03.md).
They are evidence for those dates, not current operational defaults.
