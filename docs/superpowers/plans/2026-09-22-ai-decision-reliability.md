# AI decision reliability implementation plan

Goal: address observed production errors while leaving strategy with Qwen and keeping existing budgets.
Design approved in conversation: prefer self on uninformed opening votes; distinguish authoritative game facts from model hypotheses; check current roster/threshold/identity; ground reviews in actual actions; evaluate reasoning modes on saved errors before changing the default.

1. Add regression tests for current-team facts, Good opening preference with self/private knowledge/fourth-proposal exceptions, memory isolation and demotion, and automatic proposal vs actual votes in reviews.
2. Extend existing context builders and prompts; retain raw traces, remove recycled free-form explanations from action memory, bound unverified hypotheses. No backend alignment solver.
3. Add saved production regression fixtures and extend the bounded evaluation command to compare reasoning modes with a fixed small local budget.
4. Run focused tests, TypeScript/lint checks, and the paid bounded regression experiment if local provider access is available. Document results honestly; deployment is a separate action.

## Validation results

- Added tests first and observed failures for missing action facts, unverified memory and review action IDs; implemented fixes.
- Full backend: 266 tests / 36 suites passed. Final affected-suite rerun: 43 tests passed. TypeScript, ESLint and diff whitespace checks passed.
- Independent read-only review found no introduced defects. Existing mandatory failed-mission accusations remain hard table policy, including on two-Fail missions; the new opening preference is soft model guidance.
- Initial six-position comparison: reasoning none 4/6 expected choices, default 5/6. Manual review found additional faulty rationales even for correct choices, so no blanket switch to none.
- Removed contradictory Merlin advice prohibiting a known Evil on two-Fail missions. Second default run: 5/6; safe one-Evil roster now approved but risky roster also approved.
- Added hidden-Mordred suspect-group guidance. Single-case retest rejected the risky roster, but the primary response truncated and the cheap retry still invented past participation in its explanation. This is NOT evidence of fully corrected reasoning. Keep this known limitation visible; do not equate choice-match with strategic correctness.
- Total paid verification: 17.8064 RUB. No production deployment or full live game was performed.
