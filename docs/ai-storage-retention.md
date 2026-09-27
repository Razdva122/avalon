# AI accounting and diagnostic retention

AI spending is still enforced in one MongoDB document, so a standalone MongoDB is supported. A reservation and its request-ID receipt are written atomically. Settlement checks that receipt and records actual usage in the same update as the refund; repeating the same settlement cannot subtract money twice. A request with the same ID cannot reserve twice.

The client refunds failures and cancellations known to occur before HTTP dispatch. Before sending, it durably marks the receipt as potentially dispatched. If the process dies or MongoDB becomes unavailable before refunding an unsent request, the next successful claim after release/lease expiry refunds that unsent receipt. A crash after the dispatch marker is conservative: the complete reservation remains charged because the provider might have processed the request. Reconciling those ambiguous charges requires provider billing evidence; they are never automatically refunded.

On a new room claim, maintenance ownership blocks spending while historical room totals and limits are copied to `ai_room_budgets`, then removed from the shared ledger. A durable retirement barrier prevents an old room from reopening even if the maintenance lease expires before the copy finishes. Copy-before-remove is repeatable after a failure; the barrier remains until the archive exists. Archives have no TTL. The ledger retains the current room and at most 2048 identified request receipts; exceeding that request count pauses the match. Historical lifetime and monthly totals remain unchanged. The latest 24 period totals stay in the ledger, together with the current period and any older periods referenced by outstanding requests in the current room. Other historical totals are copied to `ai_budget_periods` before removal; their billing history never expires. The client cannot settle after ownership is lost or reopen an archived room; uncertain late charges retain the reserved amount. Do not run older backend versions concurrently with this accounting protocol: they do not honor maintenance ownership.

New diagnostic documents receive `expiresAt` and a TTL index:

- `AI_TRACE_RETENTION_DAYS` defaults to 30 days for private request/response traces.
- `AI_REQUEST_RETENTION_DAYS` defaults to 365 days for request logs with confirmed actual usage or completed status.

Both settings accept whole days from 1 through 36500. They affect new/updated records, not expiry timestamps already assigned. Unconfirmed request logs are retained for billing investigation. TTL affects diagnostic documents only; canonical aggregate spending, archived room costs, and replay records do not expire.

Existing diagnostic documents without `expiresAt` remain intact. Before applying retention retroactively, export any required research/billing evidence, choose the desired cutoff, and backfill expiry dates from `createdAt` for traces and `startedAt` for confirmed request costs. MongoDB's TTL monitor deletes expired documents asynchronously. Deleting traces can prevent recovery of missing model labels in very old replays; newer replays persist their model directly.
