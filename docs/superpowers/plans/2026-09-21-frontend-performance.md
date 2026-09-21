# Frontend performance implementation

Approved scope: the six recommendations in `artifacts/performance-audit-2026-09-21/audit.md` and the user's request to implement all of them. Work in `codex/frontend-performance`; no deployment or infrastructure changes.

- [x] Generate small role/team/addon thumbnails with existing Sharp pipeline; keep large portraits and skins intact. Verify actual generated dimensions and file sizes.
- [x] Keep premium marketing text prerendered; delay gallery image sources until native details opens. Test closed/open/closed rendering.
- [x] Replace full Material Icons font/CSS with a reproducible checked-in subset; preserve aliases, dynamic names, pseudo classes and fixed boxes.
- [x] Capture one Create room click before hydration; show pending state and replay after Vue listeners/preferences are ready. Browser regression must fail against previous dist and pass against new build.
- [x] Split Lobby and account dialogs into lazy chunks; keep lightweight event subscriptions in App. Split achievement popup body, preserving its socket subscriptions.
- [x] Queue analytics immediately but defer SDK fetch/execution until after app readiness, with idle timeout and early-hidden-page fallback. Verify deduplication and recovery-page exclusion.
- [x] Complete production build, prerender, existing release checks and startup regression; compare local baseline/new build under equal throttling.
- [x] Review changes and document actual results and limits. Do not claim production metrics changed before deployment.

Dependency preload capture happens before the build-only SSR renderer import; otherwise the renderer would be unnecessarily fetched by visitors. CSS activation wait stays intact to preserve dialogs and navigation styling.
