# Pair assassination animations

Goal: integrate approved shared-cut Lovers and verdict Cleric +1 concepts.
Architecture: extend assassinationReveal with optional multi-card metadata; preserve existing Merlin/Guinevere output. Render multi-card scenes with the existing scene lifecycle, assets, flip and escaping conventions. Play the public first Cleric reveal during assassination and the final combined verdict after end roles arrive.
Stack: Vue, TypeScript, Web Animations API, SCSS, existing node:test fixtures.
Constraints: player names on cards; no bottom result text; reduced-motion static state; no autoplay from archives/reconnect; no secret-role leaks; no new dependencies.

- [x] Add helper and Board regression tests covering pairs, first-stage Cleric, misses, delayed profiles and transition to end.
- [x] Extend helper and Board routing/cleanup without changing single-card behavior.
- [x] Add shared-cut and verdict renderer and styles, with static reduced-motion and cleanup tests.
- [x] Run UI tests, type/build checks and review diff.
