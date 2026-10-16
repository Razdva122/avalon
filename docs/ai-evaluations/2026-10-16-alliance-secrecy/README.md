# Evil alliance secrecy: saved-position comparison

16 October 2026. `evilTeamAdvice` now checks public grounds for the actual move,
repeated selective ally support and recorded coalition support. It asks Evil to
compare changing a revealing action while preserving decisive sabotage priority.

Six saved observer positions were compared using `gpt-6.1-sol`, medium: one
sample per variant per position, 12 completed calls. Only `evilTeamAdvice`
changed; all six pairs used identical observer contexts. The mission-card
instructions were identical and served as a negative control. Private game data
was sent to OpenAI only after explicit user consent.

## Observed model behavior

| Saved position           | Before    | After     | Interpretation                                                                              |
| ------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------- |
| Opening ally preference  | `2, 4`    | `2, 7`    | Both avoid ally 3; the new choice retains sabotage access through own seat 7                |
| Repeated ally preference | `3, 4`    | `4, 6`    | New choice stops promoting ally 3 without public grounds and accepts an early cover success |
| Opening ally vote        | `approve` | `approve` | Both retain the already-public commitment; the new advice does not force ally rejection     |
| Winning two-Fail roster  | `approve` | `approve` | Preserves the immediate winning opportunity through two deduced Evil participants           |
| Winning one-Fail roster  | `approve` | `approve` | Preserves the immediate winning opportunity through an ally                                 |
| Winning Mordred card     | `fail`    | `fail`    | Immediate victory retained; unchanged instructions make this a negative control             |

The clearest observed improvement is the repeated-preference position: the old
reply acknowledged exposure but retained the ally based on probable supporters;
the new reply changed the action and cited the absence of distinguishing public
evidence. The opening preference also kept a sabotage route without promoting
the ally. The voting position deliberately retains its original history: it
still includes the earlier ally proposals. These independent replays are not a
simulation where the new preferences have already changed subsequent history.

All three winning targets passed after the change. Five existing backend suites
passed (67 tests), and the changed source passed ESLint. Default backend
TypeScript checking still encounters the existing TS6059 UI-helper import in
`player-boards/routes.test.ts`.

Measured usage for the 12 completed calls: 175,429 input tokens, zero cached,
2,461 output tokens, including 1,191 reasoning tokens. An initial restricted
CLI attempt failed without measured usage and is excluded; its usage is unknown.

One sample per variant cannot establish reliability, full-game concealment or
win rates. The three early cover positions came from one all-bot match; the last
two winning positions came from mixed games. Raw private evidence remains
outside the repository. The one-off replay script, old-advice snapshot and JSON
summary were removed during YAGNI cleanup after retaining these findings.
