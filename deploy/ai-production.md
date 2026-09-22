# AI games: production configuration

Prepared configuration: [ai-production.env.example](ai-production.env.example).
Merge these variables into the **backend** service environment and supply the real
Yandex folder/API key from deployment secrets. `.env.local` is ignored in production.
Keep the existing database, application and mail configuration. Do not deploy local
secret files or import local users/tokens.

## Limits and calendar

- `NODE_ENV=production`: 3,000 RUB per **30 consecutive calendar days**, 150 RUB per game.
- The first budget access or room creation establishes the first date, at midnight
  Europe/Moscow. End date is exclusive. Periods renew automatically; they are not
  calendar months and not a rolling window.
- Mongo collection `ai_experiment_budget`, document `avalon-ai-production-v1`, stores
  the anchor, per-period totals, lifetime total and lifetime per-room spending.
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
3. Configure production secrets and variables; deploy backend and UI together because
   the UI now calls `getAiBudget`.
4. Verify the intended administrator has `isAdmin: true` in the **production** database
   using a verified account ID. A username alone grants no privileges.
5. Check guest requests to `getAiBudget`, `getAiRoomCosts`, create/start/stop are denied.
   Check the admin sees 3,000 / 150 and the correct period. Role reveal stays AI-only.
6. Start one supervised game and verify reservations, settled costs, role toggle and pacing.

No production deployment or production database change has been performed by this preparation.
Do not clear budget documents to work around a stopped game. After expiry a fresh period
becomes available automatically; an unfinished room still keeps its own 150 RUB ceiling.

## Model regression

From packages/backend:
`npx ts-node -r tsconfig-paths/register src/ai/evaluate.ts --last-game`

This is a paid, explicit two-position check with an 8 RUB ceiling inside the development
experiment ledger. It exits nonzero on an unexpected choice. Cases: Percival approves
[3,5,6] after accounting for every Evil slot; Evil rejects a team with no allies.
Free regression tests cover truthful Good Lady announcements, sole legal mission cards,
public speech filtering, admin access, period rollover and concurrent reservations.
