# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-04-23 16:06:00 - Log of updates made.

-

## Current Focus

- Improving the TrueSkill rating system to make rating changes more intuitive and proportional to player ratings
- Balancing teams in TrueSkill calculations by adding fake players to the evil team
- Ensuring fair rating adjustments based on player skill relative to team average

## Recent Changes

- Implemented a new team balancing approach for TrueSkill by adding fake players to the evil team
- Reintroduced a simplified adjustment factor (30% influence) to make rating changes more proportional to player ratings
- Made higher-rated players lose more points when losing and gain fewer points when winning
- Made lower-rated players lose fewer points when losing and gain more points when winning
- Removed detailed logging that was used for debugging

## Open Questions/Issues

- How will the new adjustment factor affect rating changes in practice?
- Is the 30% influence factor appropriate, or should it be adjusted based on player feedback?
- Should we consider additional factors beyond relative skill when adjusting rating changes?
- How will these changes affect player perception of the fairness of the rating system?
