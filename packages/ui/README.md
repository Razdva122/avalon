# @avalon/ui

This repository contains the user interface codebase for our application, built with Vue 3, Vuetify, and Vuex.

## Project Structure

- **api**: Contains all the logic for backend communication.
- **assets**: Houses static files such as images, icons, and global stylesheets.
- **components**: All reusable Vue components are stored here.
- **helpers**: Utility functions and common methods that can be used across components to perform various tasks. These could include date formatting, number manipulation, or custom logic.
- **pages**: Represents the application's pages. Each Vue file here corresponds to a route in the application, consisting of one or more components put together to form a complete page.
- **router**: This directory contains the Vue Router configurations, defining routes and linking them to the respective pages/components in the application.
- **store**: Contains the Vuex store, modules, and configurations. It's used for managing global state across the application.

## Technologies

- [Vue 3](https://vuejs.org/): The progressive JavaScript framework for building user interfaces.
- [Vuetify](https://vuetifyjs.com): A Vue UI Library with beautifully handcrafted Material Components.
- [Vuex](https://vuex.vuejs.org/): State management pattern + library for Vue.js applications.

## Getting Started

**Install dependencies:**

```
npm install
```

**Compiles and hot-reloads for development:**

```
npm run serve
```

**Compiles and minifies for production:**

```
npm run build
```
