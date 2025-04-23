# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-04-23 14:53:00 - Log of updates made.

-

## Current Focus

- Implementing a new team balancing approach for TrueSkill rating calculations
- Simplifying the TrueSkill algorithm implementation by removing complex normalization
- Addressing the inherent team size imbalance in Avalon (evil team is always smaller than good team)

## Recent Changes

- Created detailed implementation plan for TrueSkill team balancing in [trueskill-team-balancing-implementation.md](./trueskill-team-balancing-implementation.md)
- Updated decision log with the rationale and implementation details for the new approach
- Designed a solution that adds fake players to the evil team with average ratings of real evil players

## Open Questions/Issues

- How will the new balancing approach affect rating changes compared to the current normalization?
- Should we maintain any aspects of the current adjustment system in the future if needed?
- Will this approach provide more intuitive and fair rating changes for players?
