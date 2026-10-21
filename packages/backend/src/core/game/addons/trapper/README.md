# Trapper

Optional addon for 8–10 players, mutually exclusive with Plot Cards.
Every mission sends one additional participant without changing its failure threshold.

Resolution: all cards → Excalibur (use or skip) → leader excludes exactly one card → Witch → final mission result.
The leader commits the target before learning its current value. Their own card and a card changed by Excalibur are valid targets. Exclusion does not undo the holder's earlier use of Excalibur.

`discardMissionCard` is the leader-only stage and socket action. Its timer waits for the Excalibur result scene, then makes one random legal exclusion on timeout. `discarded` marks the retained action; only remaining actions count toward failures. `excludedPlayerID` preserves the public exclusion marker when hidden history omits actions.

The history entry exposes target and leader publicly; only the leader receives its result during play. All viewers receive it after game end. The leader's private dialog uses this filtered snapshot, supports reconnects and respects Spoiler mode.

Checks:

- `npm test --workspace=packages/backend -- --runInBand src/core/game/test/addons/trapper`
- `node --test packages/ui/scripts/trapper-result.test.cjs packages/ui/scripts/game-options.test.cjs`
- `node packages/ui/scripts/check-trapper.cjs` (requires Puppeteer Chrome or `PUPPETEER_EXECUTABLE_PATH`)
