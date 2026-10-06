# Weekly lifetime Premium giveaway

Every Sunday at 20:00 Asia/Yekaterinburg (15:00 UTC), one eligible solo listing and one eligible recruiting listing can win lifetime Premium. Each listing has one ticket. The recruiting ticket is selected uniformly first; one eligible registered member is then selected uniformly. A recruiting listing with no explicit members uses its author. Explicit members that are all ineligible do not trigger the author fallback. The solo recipient cannot receive the recruiting prize in the same draw.

Eligibility uses currently published, active, unmoderated, unblocked listings whose creation and latest bump are at or before the cutoff and whose expiry is strictly after the cutoff. Authors must have an existing account and no board publication ban. Recipients must have an existing account, no board publication ban, and no Premium entitlement from either finished non-sandbox donations totaling $10 or a previous lifetime grant. A Premium author may still enter a recruiting listing with eligible members. An empty category completes with no winner.

Optional `memberIDs` accepts up to ten distinct registered accounts and cannot exceed `groupSize`. Solo listings accept an empty list only. Omitted IDs normalize to an empty list, including old listings. Public listing `members` contains only existing public names and avatars; deleted members are omitted. Authenticated `GET /api/player-boards/members?query=...` accepts 2–80 characters, escapes regex syntax, performs case-insensitive name prefix matching, returns at most ten profiles, and limits query execution to two seconds. Search never exposes login, email or account secrets.

## Persistence and rollout

Backend startup explicitly creates giveaway indexes and the existing unique user-feature index, then initializes the singleton schedule exactly once. The first cutoff is the Sunday strictly after initialization; if startup occurs exactly at Sunday 20:00, the first draw is the following Sunday. Restarts retain that cutoff and never backfill weeks before launch. No environment variables or payment networks are required.

The worker runs immediately and polls every 15 seconds without overlapping its own calls. It processes at most ten overdue weeks per poll. Each ISO cutoff is a unique draw `_id`; concurrent instances compete for a five-minute processing lease. Selected winner public profiles and group name are saved before any grant. Failures retain the selection, release the current lease, and retry the same recipients. Process crashes recover when the lease expires. An expired processor cannot replace a selection or finalize a draw after another processor acquires the lease. Repeated grants are idempotent, retain the original grant timestamp, and update only `premiumGrantedAt` and `premiumGrantReason: 'weekly-giveaway'`. Donations and privacy settings are unchanged. A crash after completion but before schedule advancement is repaired on the next poll.

There is no HTTP mutation endpoint for draws. `GET /api/support/giveaway` is public, independent of payments and authentication, and returns `{nextDrawAt,timeZone:'Asia/Yekaterinburg',latestDraw}`. `latestDraw` is null before the first successful completion, otherwise `{drawAt,solo,group}`, with null for empty categories. Winner DTOs contain `{userID,name,avatar}` and recruiting winners add `groupName`. Results are visible only after all grants succeed; dates identify the latest completed draw even when it is stale. Before startup initialization completes, the API reports a safe unavailable response.

## Operational inspection

Read-only Mongo shell checks:

```js
db.premiumgiveawayschedules.findOne({ _id: 'weekly-premium' });
db.premiumgiveawaydraws.find({ status: { $ne: 'completed' } }, { drawAt: 1, status: 1, leaseUntil: 1 });
db.premiumgiveawaydraws.find({ status: 'completed' }, { drawAt: 1, solo: 1, group: 1 }).sort({ drawAt: -1 }).limit(5);
db.userfeatures.find({ premiumGrantReason: 'weekly-giveaway' }, { userID: 1, premiumGrantedAt: 1 });
```

Keep the initialized schedule and selected draws during restarts, rollback or restoration. Deleting the schedule would establish a new launch boundary; deleting selected draws could cause another selection. Never clear them as a retry mechanism. Diagnose overdue cutoffs, expired leases and database errors first. The worker logs a generic retry diagnostic without database credentials.

## Constraints

Cutoffs use date filters and current publication/moderation state at processing time. There is no historical snapshot reconstruction: edits, hides, moderation and bumps during downtime can change the eligible pool. Once persisted, recipients are retained even if listing state or account membership later changes, so recovery cannot silently redraw a partly awarded week. Genuine recruiting intent cannot be proved from publication alone; existing reporting, moderation, recruiting-game eligibility and one listing slot per account remain the protections. If a selected account is later deleted, its recorded grant and public winner snapshot are retained; the worker never silently replaces it.

The implementation materializes the weekly candidate pool in memory and queries existing public profiles, bans, features and donation totals in batches. Reservoir sampling can replace this if board volume makes the weekly scan costly. No transactions, new dependencies, external notifications, production deployment or demo winners are introduced.
