# AI evaluation records

Completed experiments retain their findings and measurement limits in Markdown.
One-off runners and JSON/JSONL exports were removed during YAGNI cleanup on
16 October 2026. They are not part of the maintained test or deployment tools.

- [Alliance secrecy](2026-10-16-alliance-secrecy/README.md): six saved positions, before/after choices and winning-sabotage checks.
- [Lady cover and Mordred exposure](2026-10-17-lady-cover/README.md): six saved positions, two samples per variant, target choices and announcement limits.
- [Expanded Mordred Lady study](2026-10-17-mordred-lady-expanded/README.md): 14 saved decisions, linked announcements and explicit truthful-Evil plan comparisons.
- [Mordred predictability](2026-10-17-mordred-predictability/README.md): paired Lady continuations, historical-control limits and current-rule winning checks.
- [Decisive Good-player choices](2026-10-15-decisive/README.md): retained backend regression fixture and evaluator.
- [Voting-summary ablation](2026-10-19-voting-summaries/README.md): 36 paired-condition replies on six selected positions from four games, with and without server-derived voting summaries.
- [Context volume](2026-10-19-context-volume/README.md): conditional advice, duplicate removal, lossless accepted chat and matching response limits; six saved positions.
- [Merlin early-vote cover](2026-10-20-merlin-cover/README.md): 32 final-comparison replies on eight saved votes; early cover approvals and two-failure controls.
- [Optional Percival claims](2026-10-21-percival-claims/README.md): 32 paired replies on eight saved positions; explicit claim tradeoffs, Merlin-cover counterclaims and no observed increase in declarations.
- [Reactions to Percival disclosures](2026-10-21-percival-reactions/README.md): 140 paired recipient votes on the same eight positions; helpful and harmful persuasion, fixed-roster safety and conditional coalition support.
- [Prompt duplication](2026-10-15-prompt-dedup/README.md): measured text reduction.
- [Prompt caching](2026-10-15-prompt-cache/README.md): transport comparison and cache limits.
- [Initial Codex prototype](2026-10-01-codex/README.md): historical incomplete game and format diagnosis.

Production request costs and game traces remain private in MongoDB. Maintained
AI behavior checks and fixtures are in `packages/backend/src/ai`; operational
reporting is documented in the deployment guide.
