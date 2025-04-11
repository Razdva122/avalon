# Decision Log

This file tracks significant architectural decisions, technology choices, and design decisions for the Avalon project.

## Architectural Decisions

[12.04.2025 00:06:44] - **User Profile Loading Refactoring**

- Decision: Create a UserProfileHeader component to standardize user profile data loading
- Rationale: Currently, UserStats.vue uses a different approach for loading user profile data compared to other components
- Implementation: New component will use useUserProfile composable instead of direct store dispatch
- Implications: Improved code consistency, better maintainability, and automatic handling of uuid changes

[11.04.2025 12:20:57] - **Memory Bank Structure**

- Decision: Created standardized memory bank files to ensure consistent activation across all modes
- Rationale: The memory bank was not activating properly due to missing expected files
- Implications: Improved context retention and knowledge sharing across different assistant modes

[11.04.2025 11:57:40] - **Plot Cards Implementation**

- Decision: Implemented plot cards as modular, pluggable components with three distinct types (usable, instant, effect)
- Rationale: Allows for easy addition of new card types and effects while maintaining a consistent interface
- Implementation: Created a comprehensive addon system with standardized lifecycle hooks
- Implications: More flexible game mechanics, enhanced gameplay variety, and simplified process for adding new cards

## Technology Choices

[11.04.2025 12:20:57] - **Vue.js for Frontend**

- Decision: Using Vue.js as the frontend framework
- Rationale: Component-based architecture, reactive data binding, and good performance
- Implications: Structured frontend development with reusable components

[11.04.2025 12:20:57] - **Node.js for Backend**

- Decision: Using Node.js for the backend server
- Rationale: JavaScript/TypeScript consistency across stack, good WebSocket support
- Implications: Unified language across frontend and backend, easier developer onboarding

[11.04.2025 12:20:57] - **TypeScript for Type Safety**

- Decision: Using TypeScript throughout the codebase
- Rationale: Strong typing prevents runtime errors and improves code quality
- Implications: Better IDE support, self-documenting code, fewer bugs

## Design Decisions

[06.04.2025 11:56:00] - **Portuguese Language Support**

- Decision: Added Portuguese as a supported language
- Rationale: Expand accessibility to Portuguese-speaking players
- Implications: Increased user base in Portuguese-speaking regions, additional translation maintenance

[11.04.2025 12:20:57] - **Rating System Implementation**

- Decision: Implemented a role-specific rating system
- Rationale: Provides players with feedback on their performance with specific roles
- Implications: Enhanced player engagement and progression tracking

[11.04.2025 12:20:57] - **Internationalization Approach**

- Decision: Implemented full internationalization with multiple language support
- Rationale: Expand the game's accessibility to non-English speaking players
- Implications: Increased maintenance for translations, broader user base
