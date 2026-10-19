<template>
  <main class="info-page-content trust-page">
    <h1 class="title">Privacy and data handling</h1>
    <p>
      Avalon Online uses account information to let players sign in, join rooms, and keep their game history and
      profile. Registration asks for a login, email address, and password. The server stores a password hash rather than
      the password itself. An email address is also used for account recovery. Room and game records can include player
      actions, chat messages, ratings, and achievements. Some profile and game information is visible to other players.
    </p>
    <p>
      The browser stores settings needed for the interface and game session. The site also includes Google Analytics and
      Yandex Metrica, and sends limited category based usage events. If voice chat is enabled, the browser requests
      microphone access for that session; you can leave or mute it in the room. Support features process the information
      needed to show donations and optional public supporter names. Do not share sensitive personal information in
      public profiles, rooms, or chats.
    </p>
    <p>
      For questions about your data, including correction or deletion requests, use the
      <router-link to="/contact/">contact page</router-link>. The project has not published a verified legal operator
      name, postal address, or comprehensive retention schedule on this site. Those details require operator review
      before this overview can serve as a complete legal privacy notice. This page describes observable site behavior
      and will be updated when the operator confirms the outstanding details.
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
