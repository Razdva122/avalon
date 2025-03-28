# Memory Bank: Avalon Development Process

This document contains information about the development process of the Avalon project and recommendations for future work.

## Development Process

### Workflow

1. **Planning**

   - Defining requirements and functionality
   - Creating tasks in the project management system
   - Prioritizing tasks

2. **Development**

   - Creating a branch for new functionality
   - Implementing functionality
   - Writing tests
   - Local testing

3. **Code Review**

   - Creating a Pull Request
   - Code review by other developers
   - Making changes based on review results

4. **Testing**

   - Running automated tests
   - Manual testing
   - Fixing discovered bugs

5. **Deployment**
   - Merging changes into the main branch
   - Deploying to the test environment
   - Deploying to production

### Code Conventions

#### General Conventions

- Use TypeScript for all development
- Follow ESLint and Prettier settings
- Use meaningful variable and function names
- Write comments for complex code sections
- Document public APIs and interfaces

#### File Structure

- Follow the existing project structure
- Place files in appropriate directories
- Use meaningful file names that reflect their content

#### Naming

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_CASE for constants
- Use kebab-case for file names

#### Commits

- Use meaningful commit messages
- Follow the format: `[type]: brief description`
- Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat: added new Hunter role
fix: fixed voting error
docs: updated API documentation
```

### Local Development

#### Environment Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd avalon
```

2. Install dependencies:

```bash
npm install
```

3. Run in development mode:

```bash
# Run using Docker
docker-compose -f docker-compose.dev.yml up

# Or run without Docker
# Terminal 1: Run backend
cd packages/backend
npm run dev

# Terminal 2: Run frontend
cd packages/ui
npm run serve
```

#### Using Docker

The project is configured for development using Docker:

- `docker-compose.dev.yml` - configuration for local development
- `backend.Dockerfile` - Dockerfile for backend
- `ui.Dockerfile` - Dockerfile for frontend

Commands for working with Docker:

```bash
# Run in development mode
docker-compose -f docker-compose.dev.yml up

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Stop containers
docker-compose -f docker-compose.dev.yml down
```

## Development Recommendations

### General Recommendations

1. **Follow the project architecture**

   - Study the existing architecture before making changes
   - Maintain consistency with existing code
   - Discuss architectural changes with the team

2. **Write tests**

   - Cover new functionality with tests
   - Keep existing tests up to date
   - Use TDD when possible

3. **Document code**

   - Use JSDoc to document functions and classes
   - Update README.md when adding new features
   - Document complex algorithms and business logic

4. **Optimize performance**
   - Avoid unnecessary calculations and database queries
   - Use caching where appropriate
   - Profile code to identify bottlenecks

### Backend Recommendations

1. **Working with the database**

   - Use DBManager for all database operations
   - Create indexes for frequently used queries
   - Use transactions for atomic operations

2. **Error handling**

   - Use try/catch for exception handling
   - Log errors with context
   - Return clear error messages to the client

3. **Extending game logic**

   - Use the hook system to extend functionality
   - Follow the event pattern for state updates
   - Update game history when changing state

4. **Adding new roles**

   - Inherit from abstract classes in `/packages/backend/src/core/roles/abstract.ts`
   - Implement necessary methods and properties
   - Update types in `/packages/types/game/roles.ts`

5. **Adding new addons**
   - Create a new addon in `/packages/backend/src/core/game/addons/`
   - Add types for the addon in `/packages/types/game/addons/`
   - Register hooks for integration with the gameplay

### Frontend Recommendations

1. **Components**

   - Use Composition API for new components
   - Break down complex components into smaller ones
   - Use props for passing data down the hierarchy

2. **State management**

   - Use Vuex for global state
   - Use local state for component-specific data
   - Use computed properties for derived data

3. **Styling**

   - Use Vuetify for UI components
   - Follow the project's design system
   - Use SCSS for custom styles

4. **Localization**

   - Add new strings to all language files
   - Use parameters for dynamic strings
   - Test the interface in all supported languages

5. **Optimization**
   - Use lazy loading for components
   - Optimize rendering with `v-memo` and `v-once`
   - Minimize calculations in lifecycle hooks

### Type Recommendations

1. **Type definitions**

   - Use prefix `T` for types
   - Use interfaces for objects with methods
   - Use union types for enumerations

2. **Type organization**

   - Place types in appropriate files
   - Group related types together
   - Export types from appropriate files

3. **Using types**
   - Use strict typing
   - Avoid using `any`
   - Use generics for reusable types

## Troubleshooting Common Issues

### Socket Issues

1. **Connection breaks**

   - Check timeout settings
   - Ensure the client sends ping messages
   - Check for errors in the console

2. **Events don't reach the client**
   - Check the correctness of event subscriptions
   - Ensure events are sent with correct parameters
   - Check for errors in event handlers

### Database Issues

1. **Slow queries**

   - Check for indexes
   - Optimize queries
   - Use aggregation instead of multiple queries

2. **Connection errors**
   - Check connection settings
   - Ensure MongoDB is running
   - Check access rights

### Game Logic Issues

1. **Game hangs at a certain phase**

   - Check conditions for transitions between phases
   - Ensure all necessary actions are performed
   - Check for errors in event handlers

2. **Incorrect role distribution**
   - Check role distribution logic
   - Ensure game settings are correct
   - Check role balance

## Conclusion

By following the recommendations and conventions described in this document, you will ensure consistency and quality of the Avalon project code. Regularly update this document as the project evolves and new conventions and recommendations emerge.
