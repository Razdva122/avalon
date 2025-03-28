# Web Service for Avalon: The Resistance Game

Welcome to the repository for the web service of "Avalon: The Resistance" game. This interactive application is designed for online gameplay of "Avalon" allowing players to interact and compete in real-time.

## [Live Version Available at avalon-game.com](http://avalon-game.com/)

## Development

To start development, clone the repository and execute the following commands to install dependencies and launch the project in development mode:

```bash
npm install
npm run dev
```

## Project Structure

The project is organized as an [NPM mono-repository](https://docs.npmjs.com/cli/v7/using-npm/workspaces), facilitating convenient management of both front-end and back-end components within a single project.

### Backend

This section contains all the server-side logic. The main technologies used are:

- [ts-node](https://github.com/TypeStrong/ts-node) for server-side TypeScript.
- [RxJS](https://rxjs.dev/) for game stage system.
- [express](https://expressjs.com/) – a popular framework for web applications on Node.js.
- [socket.io](https://socket.io/) for real-time data exchange between clients and the server.

### Types

Shared types for front-end and back-end interaction. These enhance integration and code reliability through strict typing.

### User Interface (UI)

The front-end part of the project responsible for the visual presentation of the web service. The stack includes:

- [Vue 3](https://vuejs.org/) – a progressive framework for building user interfaces.
- [Vuex](https://vuex.vuejs.org/) – a library for state management.
- [Vuetify](https://vuetifyjs.com) – a material component framework for Vue.js.
- [socket.io](https://socket.io/) – for implementing real-time interaction with the server.

## Memory Bank

The project includes a comprehensive Memory Bank - a structured documentation that helps developers understand the project architecture, components, and development processes.

### Memory Bank Structure

- [Memory Bank Index](memory-bank-index.md) - Main entry point with links to all sections
- [General Project Information](memory-bank.md) - Overview of the project architecture and key concepts
- [Database Structure](memory-bank-db.md) - Information about database models and interactions
- [Game Logic](memory-bank-game.md) - Details about game mechanics, roles, and addons
- [Frontend Architecture](memory-bank-frontend.md) - Information about UI components and state management
- [Development Process](memory-bank-development.md) - Guidelines and recommendations for development

### How to Use Memory Bank

The Memory Bank is designed to help both new and experienced developers:

- **For new developers**: Start with the [Memory Bank Index](memory-bank-index.md) to get a comprehensive overview of the project.
- **For experienced developers**: Use specific sections as a reference when working on particular features.

Please keep the Memory Bank updated when making significant changes to the project architecture or adding new features.

### AI-Assisted Development with Memory Bank

This project is configured to use Memory Bank with AI assistants for more effective development:

1. **Automatic Context Loading**: The project includes a `.clinerules` file that automatically loads Memory Bank files into the context when working with AI assistants like Cline.

2. **How It Works**:

   - When you start a new conversation with an AI assistant in this project, the Memory Bank files are automatically loaded as context.
   - This allows the AI to have comprehensive knowledge about the project structure, architecture, and conventions.
   - The AI can provide more accurate and project-specific assistance based on the information in Memory Bank.

3. **Benefits**:

   - More consistent code that follows project conventions
   - Faster onboarding for new developers
   - Better understanding of complex project components
   - More accurate assistance with debugging and feature development

4. **Updating Context**:
   - If you make significant changes to the project, update the Memory Bank files accordingly.
   - The AI will automatically use the updated information in future conversations.

This integration ensures that AI assistance is tailored specifically to this project, making development more efficient and consistent.

This project serves as a unique platform for fans of "Avalon: The Resistance", allowing them to enjoy their favorite game in an online format.
