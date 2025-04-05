# Memory Bank: Table of Contents

This document serves as an entry point for all Memory Bank files of the Avalon project. Here you will find links to all sections of the documentation.

## Contents

1. [General Project Information](memory-bank.md)

   - Project Architecture
   - Key Business Processes
   - Technical Stack
   - Code Conventions
   - Process for Adding New Features
   - Localization
   - Testing
   - Docker

2. [Database Structure](memory-bank-db.md)

   - General Information
   - Key Data Models
   - Database Interaction
   - DBManager
   - Migrations
   - Queries
   - Database Interaction Schema
   - Rating System

   - Database Recommendations

3. [Game Logic](memory-bank-game.md)

   - General Game Information
   - Key Game Logic Components
   - Roles
   - Game Phases
   - Missions
   - Voting
   - Addons (Game Extensions)
   - Game History
   - Game Hooks
   - Frontend Interaction
   - Game Logic Recommendations
   - [Adding Plot Cards](adding-plot-cards.md)

4. [Frontend](memory-bank-frontend.md)

   - General Information
   - Project Structure
   - Key Components
   - API and Backend Interaction
   - Components
   - Pages
   - Store (Vuex)
   - Routing
   - Localization
   - Helper Functions
   - Game Interface
   - Responsive Design
   - Game State Management
   - Styles and Themes
   - Frontend Recommendations

5. [Development Process](memory-bank-development.md)

   - Development Process
   - Workflow
   - Code Conventions
   - Troubleshooting Common Issues

6. [Progress Log](progress.md)

   - Updates and Changes

   - Local Development
   - Development Recommendations
   - Troubleshooting Common Issues

## How to Use Memory Bank

Memory Bank is designed to facilitate the development and maintenance of the Avalon project. It contains structured information about various aspects of the project that will help you navigate the codebase more quickly and follow established conventions.

### For New Developers

If you're just starting with the project:

1. Begin with [general project information](memory-bank.md)
2. Familiarize yourself with the [development process](memory-bank-development.md)
3. Study the [database structure](memory-bank-db.md)
4. Dive into the [game logic](memory-bank-game.md)
5. Explore the [frontend](memory-bank-frontend.md)

### For Experienced Developers

Use Memory Bank as a reference when working on specific tasks:

- Adding a new role? Refer to the sections on [roles](memory-bank-game.md) and the [process for adding new features](memory-bank.md)
- Extending the database? Study the [database structure](memory-bank-db.md) and [recommendations for working with it](memory-bank-db.md)
- Creating a new interface component? Check the [frontend recommendations](memory-bank-frontend.md)

## Maintaining Memory Bank

Memory Bank is a living document that should be updated as the project evolves. If you make significant changes to the architecture, add new components, or change existing conventions, please update the relevant sections of Memory Bank.

This will help keep the documentation up-to-date and make work easier for the entire team.
