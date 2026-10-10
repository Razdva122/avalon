# AI games: Codex-only production configuration

[Documentation index](../docs/README.md)

AI Arena uses only Codex authenticated with ChatGPT. The paid model registry,
HTTP inference transport and RUB budget controls have been removed. The backend
rejects other provider identifiers before claiming a room, even if an obsolete
client still offers them. Historical replays remain readable.

Use [ai-production.env.example](ai-production.env.example) and choose the local
or remote setup in [Codex production](codex-production.md). Enable both
`AI_ROOMS_ENABLED=true` and `AI_CODEX_ENABLED=true` only after verifying the worker.
Keep application, database, mail, storage and voice secrets independent of AI.
Remove obsolete inference credentials from every deployment source, including
VM metadata, Compose environment/env_file and local environment files.

## Rollout

1. Run the backend AI tests, backend type check, UI tests and production UI build.
2. Back up the database and preserve existing replays, diagnostic records and historical accounting.
3. Wait for human and AI games to finish; recreation discards live games held in memory.
4. Deploy backend and UI together: the previous RUB budget socket endpoints no longer exist.
5. Confirm an authenticated database administrator sees Codex only; a guest cannot create/manage games.
6. Confirm Codex model discovery and account quota reads work before a supervised game.
7. Verify the persistent configuration source contains no paid inference credentials, so reboot cannot re-enable them.

Production messages retain ten-second pacing; development uses two seconds.
The subscription quota is account-wide. A technical interruption pauses the game;
the existing retry resumes its current state without repeating completed speech.
There is no pay-per-token fallback when Codex fails or reaches its quota.

See [AI Arena](../docs/ai-rooms.md) and [diagnostic retention](../docs/ai-storage-retention.md).
Repository state does not prove which release is running on a VM; inspect production separately.
