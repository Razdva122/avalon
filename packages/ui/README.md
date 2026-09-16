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

## Search and AI crawler visibility

The production build prerenders public pages, including localized rules and roles,
so their text, canonical links and JSON-LD are available without JavaScript.
`router/structuredData.ts` describes the website, each public page and the free
browser game. Wiki breadcrumbs have a separate JSON-LD element so navigation
cannot overwrite page metadata. Both are updated by the router, avoiding loss of
breadcrumbs when prerender hydration unmounts components. Private routes and the
404 page omit this graph.

`npm run build` checks the generated HTML, sitemap and structured data in every
supported locale, plus Chromium checks for metadata updates during navigation.
To check a running Nginx deployment, run:

```sh
SEO_BASE_URL=https://avalon-game.com npm run check:seo:http
```

This also probes public HTML with Googlebot, OAI-SearchBot and PerplexityBot
User-Agent headers. It does not authenticate crawler IPs or prove indexing.
If a CDN or firewall is added, verify its crawler policy separately. The existing
`robots.txt` allows all crawlers; no separate training policy is introduced here.

After deploying, inspect representative URLs in webmaster tools and monitor
crawler requests and referral traffic. Crawlability and structured data do not
guarantee inclusion in AI answers. Google does not require an `llms.txt` file or
special AI schema: https://developers.google.com/search/docs/appearance/ai-features
