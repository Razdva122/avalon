# AI games: production configuration

[Documentation index](../docs/README.md)

Prepared configuration: [ai-production.env.example](ai-production.env.example).
Merge these variables into the **backend** service environment and supply the real
Yandex folder/API key from deployment secrets. `.env.local` is ignored in production.
Keep the existing database, application and mail configuration. Do not deploy local
secret files or import local users/tokens.

For the optional ChatGPT subscription provider, follow
[Codex production preparation](codex-production.md). Installing the CLI on the VM
alone does not put it inside the backend container.

## Limits and calendar

- `NODE_ENV=production`: 3,000 RUB per **30 consecutive calendar days**, 200 RUB per game.
- The first budget access or room creation establishes the first date, at midnight
  Europe/Moscow. End date is exclusive. Periods renew automatically; they are not
  calendar months and not a rolling window.
- Mongo collection `ai_experiment_budget`, document `avalon-ai-production-v1`, stores
  the anchor, per-period totals, lifetime total and current room spending. Historical room costs are moved to
  `ai_room_budgets`, and old period aggregates to `ai_budget_periods`; see
  [accounting and retention](../docs/ai-storage-retention.md).
  Reservations update room and period atomically in one document. Late responses
  settle against their reservation's original period. Restarts never reset totals.
- Local experiment remains `avalon-ai-v1`, 700 RUB lifetime / 100 RUB per game.
  Existing experimental spending is preserved, not imported into the production period.
- Admin panels show used/reserved funds, remaining amount, per-game ceiling and period dates.
  All budget requests re-read `isAdmin === true` from the database. Guests cannot access them.
- Production pacing remains 10 seconds; development remains 2 seconds.

## Release

1. Back up the production database. Keep the budget documents when rolling back.
2. Run backend AI tests and TypeScript check, then the standard UI production build.
3. Configure production secrets and variables; deploy backend and UI together when changing AI contracts. The UI uses `getAiBudget`.
4. Verify the intended administrator has `isAdmin: true` in the **production** database
   using a verified account ID. A username alone grants no privileges.
5. Check guest requests to `getAiBudget`, `getAiRoomCosts`, create/start/stop are denied.
   Check the admin sees 3,000 / 200 and the correct period. Role reveal stays AI-only.
6. Start one supervised game and verify reservations, settled costs, role toggle and pacing.

This guide describes configuration in the repository; verify the running VM version and
configuration independently.
Do not clear budget documents to work around a stopped game. After expiry a fresh period
becomes available automatically; an unfinished room still keeps its own 200 RUB ceiling.

## Model regression

From packages/backend:
`npx ts-node -r tsconfig-paths/register src/ai/evaluate.ts --last-game`

This is a paid, explicit regression check with an 8 RUB ceiling inside the development
experiment ledger. It exits nonzero on an unexpected choice. Cases: Percival approves
[3,5,6] after accounting for every Evil slot; Evil rejects a team with no allies.
Free regression tests cover truthful Good Lady announcements, sole legal mission cards,
public speech filtering, admin access, period rollover and concurrent reservations.

## Continuing a paused match

The initial production per-game default is 200 RUB. An administrator may explicitly
continue a budget-paused match with a doubled room limit (first continuation: 400 RUB).
Past spending remains charged and the shared 3000 RUB period cap is unchanged.
An environment value of `AI_MATCH_BUDGET_RUB=150` still lowers the default; update it
to 200 only when the deployment should use the current default.

Codex subscription usage is tracked separately from Yandex RUB costs. Choose the
[local-container or remote-worker configuration](codex-production.md) and keep
provider authentication on the corresponding host.
