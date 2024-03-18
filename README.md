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

This project serves as a unique platform for fans of "Avalon: The Resistance", allowing them to enjoy their favorite game in an online format.
