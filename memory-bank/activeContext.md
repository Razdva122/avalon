# Active Context

This file tracks the current focus of work, recent changes, and open questions/issues for the Avalon project.

## Current Focus

[12.04.2025 00:07:03] - **User Profile Loading Refactoring**

- Planning the refactoring of user profile data loading in UserStats.vue
- Creating a new UserProfileHeader component to standardize the approach
- Ensuring consistent use of useUserProfile composable across the application
- Detailed implementation plan created in memory-bank/implementation-plan.md

[11.04.2025 12:20:24] - **Plot Cards Implementation**

- Working on plot cards functionality and testing
- Implementing and testing various plot card types
- Ensuring proper integration with the game system

## Recent Changes

[12.04.2025 00:06:44] - **User Profile Loading Design Decision**

- Decided to create a UserProfileHeader component to standardize user profile data loading
- Component will use useUserProfile composable instead of direct store dispatch
- Will improve code consistency and maintainability

[06.04.2025 11:56:00] - **Implemented Portuguese Translation**

- Added Portuguese language support to the application
- Created translation files for all UI sections and content
- Added SEO translations for all pages and roles

[05.04.2025 10:49:10] - **Added TopRolePlayer to All Role Pages**

- Added the component to all role pages with appropriate positioning
- Implemented separate components for special roles like Lancelots and Lovers

[05.04.2025 10:13:56] - **Added Rating System Documentation**

- Added detailed documentation about the rating system
- Documented the rating calculation algorithm, models, and API endpoints

## Open Questions/Issues

[12.04.2025 00:07:03] - **User Profile Loading Implementation**

- Need to implement the UserProfileHeader component as designed
- Need to modify UserStats.vue to use the new component
- Need to test the changes to ensure everything works as expected

[11.04.2025 12:20:24] - **Memory Bank Activation**

- Ensuring memory bank is properly activated across all modes
- Creating required files for memory bank functionality

[11.04.2025 11:57:16] - **Plot Cards Implementation Progress**

- Implementing various plot card types (usable, instant, effect)
- Current cards include: Lead To Victory, Ambush, King Returns, Restore Honor, Charge, Show Nature, Are You The One, We Found You, Show Strength
- Frontend components for card display and interaction are in place
- Portuguese translations for all plot cards have been added
- Comprehensive documentation for adding new plot cards has been created
