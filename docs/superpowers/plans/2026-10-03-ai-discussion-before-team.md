# AI discussion before team selection

> Historical record: findings, measurements and plans describe their recorded date. For current setup and operations, use the [documentation index](../../README.md).

User-approved flow: before every proposal, each seat speaks clockwise starting with the leader. These turns express preferred teams, trust, answers and questions; they neither select players nor commit votes. The leader then chooses the final roster after reading the full circle, with an optional announcement. All seven binding votes are collected silently before any is applied. Later circles may discuss recorded votes and mission results. Proposal five still has a full circle and leader selection, then automatic acceptance.

Implementation:

1. Add internal request flags for public discussion and an optional leader announcement. Distinguish preferences from actual actions in private decision memory and public speaker context; retain public/private separation and all three languages.
2. Replace the room's combined speech/vote flow with resumable discussion, final selection and buffered voting. Preserve completed turns across budget/technical pauses and discard awaited answers after Stop.
3. Cover ordering, selection freedom, vote privacy, retrospectives, silent announcements, fifth proposals, pause/resume, cancellation and the maximum-length game with mocked model replies. Verify all AI tests, server type checking and lint.

Keep engine stages and socket contracts unchanged. Existing budgets still apply; the room request ceiling becomes 400 to accommodate the legal baseline of up to 371 asks.
