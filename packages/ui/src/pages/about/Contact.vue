<template>
  <main class="info-page-content trust-page">
    <h1 class="title">Contact Avalon Online</h1>
    <p>
      Avalon Online is a fan project for playing The Resistance: Avalon in a browser. For questions about the website,
      gameplay, your account, or a problem you encountered, reach the project through its
      <a href="https://discord.gg/DR9cEDDNdN" target="_blank" rel="noopener noreferrer">public Discord community</a>.
      This is the contact route already published on our About page.
    </p>
    <p>
      When reporting a problem, include the page address, what you were trying to do, and the time it happened. Avoid
      posting passwords, recovery links, private role information from an active game, or payment details in a public
      channel. If the matter is sensitive, ask the moderators how to contact the project privately before sharing it.
    </p>
    <p>
      For game rules and role explanations, visit the <router-link to="/wiki/rules/">rules</router-link> and
      <router-link to="/wiki/roles/">roles</router-link> pages. For information about the project and its independent
      fan status, see <router-link to="/about/">About</router-link>. Our
      <router-link to="/privacy/">privacy page</router-link> describes the categories of information used by the site.
      Avalon Online is not affiliated with the tabletop game's publishers.
    </p>
  </main>
</template>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
.trust-page {
  max-width: 960px;
}
.trust-page p {
  margin: 0 0 16px;
  line-height: 1.7;
}
</style>
