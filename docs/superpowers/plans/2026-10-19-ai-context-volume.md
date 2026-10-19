# AI context volume implementation plan

Goal: reduce duplicate and irrelevant input while preserving decision facts, legal choices, role secrecy and useful strategy.

Scope: existing backend AI request assembly; no deployment or model changes. User authorized implementation and read-only export of six specified production traces. Preserve unrelated working-tree changes.

1. Freeze before prompts/schemas on six selected positions from four games, restoring original notes. Use actual decisionPipeline and compactRequest on reconstructed observer-only requests. Assert original votes, mission cards and legal choices remain available.
2. Add failing checks for side-specific private strategy, one personality copy, matching output limits, lossless recent chat and nonduplicated human testimony. Keep vote arithmetic, safety heuristics, private knowledge and bounded model memory.
3. Remove duplicate personality prose; scope Evil advice to Evil players; omit impossible claim guidance; omit constant fields from model input only. Preserve historical review constraints. Align decision schema and parser at 240 private characters and three changed notes, retaining standalone/review limits.
4. Preserve complete chat messages within the server's 2000-character limit; keep historical human statements outside the recent window without duplicate recent text. Maintain early/recent human evidence coverage and event order.
5. Run targeted tests and type/lint checks. Compare before/after on six real positions with two samples per arm, plus local decisive regressions; inspect reasons and public secrecy, not only action matches. If a quality regression appears, investigate and retain the safer variant.
6. Run full backend tests with local-port permission on the first run, obtain read-only review, and record volume, usage, decisions and limitations. Do not claim a win-rate guarantee from a diagnostic sample.

Completed: all six steps. The user separately approved the 24 model calls. Results and limitations: [context-volume evaluation](../../ai-evaluations/2026-10-19-context-volume/README.md). All 1137 backend tests passed; type/lint checks and read-only review completed. No deployment performed.
