<template>
  <header class="header">
    <div class="header-left-container d-flex align-center">
      <RouterLink class="home-link" :to="homePath" :aria-label="$t('menu.home')">
        <v-icon class="home-icon" size="20" icon="fa:fa-solid fa-house" aria-hidden="true" />
      </RouterLink>
      <ConnectStatus v-if="currentRoute === 'room'" class="connect-status" />
    </div>
    <nav class="header-navigation" :aria-label="$t('menu.menu')">
      <LocaleLink :to="{ name: 'community_group' }" :class="{ active: inSection('/community/') }">{{
        $t('playerBoards.findCompany')
      }}</LocaleLink>
      <LocaleLink class="desktop-navigation" :to="{ name: 'wiki' }" :class="{ active: inSection('/wiki/') }">{{
        $t('menu.rulesRoles')
      }}</LocaleLink>
    </nav>
    <div class="header-right-container d-flex align-center">
      <SpoilerEye v-if="currentRoute === 'room'" />
      <button
        type="button"
        class="header-account desktop-navigation"
        :aria-label="$t($store.state.profile ? 'menu.myProfile' : 'menu.signIn')"
        @click="profileClick"
      >
        <Avatar v-if="$store.state.profile" :avatarID="$store.state.profile.avatar" alt="" />
        <span v-else>{{ $t('menu.signIn') }}</span>
      </button>
      <Menu @profileClick="profileClick" />
    </div>
  </header>
  <p v-if="$store.state.connect === false" class="connection-warning" role="status">{{ $t('onlineStatus.error') }}</p>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Suspense>
        <component :is="Component" class="page"></component>

        <template #fallback> {{ $t('mainPage.loading') }} </template>
      </Suspense>
    </template>
  </RouterView>
  <LanguageSuggestion />
  <AuthModal v-if="authRequested" v-model="authOpen" />
  <CredentialsModal v-if="credentialsRequested" v-model="credentialsOpen" :mode="credentialsMode" />
  <InfoSnackbar />
  <AchievementPopupsContainer />
  <Version class="version" />
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, unref } from 'vue';
import { localizedPath } from '@/router/paths';
import LanguageSuggestion from '@/components/feedback/LanguageSuggestion.vue';
import Menu from '@/components/header/Menu.vue';
import ConnectStatus from '@/components/feedback/ConnectStatus.vue';
import InfoSnackbar from '@/components/feedback/InfoSnackbar.vue';
import Version from '@/components/feedback/Version.vue';
import SpoilerEye from '@/components/feedback/SpoilerEye.vue';
import Avatar from '@/components/user/Avatar.vue';
import { inNavigationSection } from '@/components/header/navigation';
import AchievementPopupsContainer from '@/components/achievements/AchievementPopupsContainer.vue';
import { isHolidays } from '@/helpers/utility';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  components: {
    AuthModal: defineAsyncComponent(
      () => import(/* webpackChunkName: 'auth-dialog' */ '@/components/user/AuthModal.vue'),
    ),
    LanguageSuggestion,
    ConnectStatus,
    InfoSnackbar,
    Version,
    Menu,
    SpoilerEye,
    Avatar,
    CredentialsModal: defineAsyncComponent(
      () => import(/* webpackChunkName: 'credentials-dialog' */ '@/components/user/CredentialsModal.vue'),
    ),
    AchievementPopupsContainer,
  },
  data() {
    return {
      currentLocale: this.$i18n.locale,
      authRequested: false,
      authOpen: false,
      credentialsRequested: false,
      credentialsOpen: false,
      credentialsMode: 'email' as 'email' | 'login' | 'password',
    };
  },
  computed: {
    homePath() {
      return localizedPath('/', unref(this.$i18n.locale));
    },
    currentRoute() {
      return this.$route.name;
    },
  },
  methods: {
    inSection(path: string) {
      return inNavigationSection(this.$route.path, path);
    },
    openAuthModal() {
      this.authRequested = true;
      this.authOpen = true;
    },
    openCredentialsModal(mode: 'email' | 'login' | 'password') {
      this.credentialsRequested = true;
      this.credentialsMode = mode;
      this.credentialsOpen = true;
    },
    profileClick() {
      if (this.$store.state.profile) {
        this.$router.push({ name: 'profile' });
      } else {
        eventBus.emit('openAuthModal');
      }
    },
  },
  beforeUnmount() {
    eventBus.off('openAuthModal', this.openAuthModal);
    eventBus.off('openCredentialsModal', this.openCredentialsModal);
  },
  created() {
    eventBus.on('openAuthModal', this.openAuthModal);
    eventBus.on('openCredentialsModal', this.openCredentialsModal);
    document.documentElement.lang = this.currentLocale;

    if (isHolidays()) {
      document.querySelector('#app')?.classList.add('holidays-active');
      document.querySelector('#overlay')?.classList.add('holidays-active');
    } else {
      document.querySelector('#app')?.classList.remove('holidays-active');
      document.querySelector('#overlay')?.classList.remove('holidays-active');
    }
  },
});
</script>

<style lang="scss">
.v-theme--lightTheme {
  --v-theme-text-secondary: 93, 105, 120;
  --v-theme-surface-border: 217, 224, 232;
}
.v-theme--darkTheme {
  --v-theme-text-secondary: 175, 189, 207;
  --v-theme-surface-border: 53, 66, 85;
}

body {
  color: rgb(var(--v-theme-text-primary));
}

#app {
  font-family:
    Avenir,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Noto Sans',
    Helvetica,
    Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

ul > li {
  list-style-type: none;
}

li {
  list-style-position: inside;
}

a {
  text-decoration: none;
  color: rgb(var(--v-theme-text-primary));
}

.header {
  height: 50px;
  width: 100%;
  background-color: rgb(var(--v-theme-bg-header));
  border-bottom: 1px solid rgb(var(--v-theme-surface-border));
  padding-inline: clamp(10px, 2vw, 28px);
  align-items: center;
  gap: 12px;
  display: flex;
  justify-content: space-between;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.025);
}

.page {
  padding-top: 50px;
}

.connect-status {
  font-size: 13px;
}

.header-right-container {
  font-size: large;
}

.version {
  opacity: 0.55;
  pointer-events: none;
  font-size: 11px;
  position: fixed;
  bottom: 5px;
  right: 10px;
}

body {
  background-color: rgb(var(--v-theme-bg-app));
}

.icon-swap {
  vertical-align: text-bottom;
}

#app.holidays-active {
  .player-crown {
    background-image: getImagePathByID('core', 'santa-hat');
    width: 90px;
    height: 90px;
    left: 20px;
  }
}

#overlay.holidays-active {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  min-height: 100vh;
  background-image: getImagePathByID('core', 'holidays-background');
  background-attachment: fixed;
  background-size: cover;
  pointer-events: none;
  z-index: -1;
  opacity: var(--v-holiday-background-opacity);
}

.v-data-table {
  background-color: rgb(var(--v-theme-bg-app)) !important;
  color: rgb(var(--v-theme-text-primary)) !important;
  font-size: 18px !important;

  .v-data-table__th:hover {
    color: rgb(var(--v-theme-text-primary)) !important;
  }
}

@media (max-width: 600px) {
  .v-data-table {
    font-size: 14px !important;
  }
}

.home-icon {
  width: 20px;
}

.header-left-container {
  font-size: 36px;
}

/* Override for skeleton loaders to have transparent background */
.v-skeleton-loader {
  background-color: transparent !important;
}
</style>

<style lang="scss">
.header-left-container {
  gap: 14px;
  min-width: 0;
}
.header-right-container {
  flex-shrink: 0;
}
.header .home-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 0 8px;
  min-height: 44px;
  text-transform: none;
  letter-spacing: 0;
}
.header-navigation {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.header-navigation a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 8px 14px;
  font-size: 14px;
  border-radius: 8px;
}
.header-navigation a:hover {
  background: rgb(var(--v-theme-inset-hover));
}
.header-navigation .active {
  color: rgb(var(--v-theme-support-accent));
  background: rgb(var(--v-theme-support-button));
}
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
:where(button, select, summary) {
  cursor: pointer;
}
:where(button, input, select, textarea):disabled {
  cursor: not-allowed;
}
.page :where(h1, h2, h3, h4) {
  text-wrap: pretty;
}
.page :where(input:not([type='checkbox']):not([type='radio']), select, textarea) {
  font-size: 16px;
}
.stats-page .v-data-table,
.leaderboard-page .v-data-table {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 14px;
  font-size: 15px !important;
  overflow: hidden;
}
.stats-page .v-data-table th,
.leaderboard-page .v-data-table th {
  color: rgb(var(--v-theme-text-secondary));
  font-weight: 600 !important;
  background: rgba(var(--v-theme-primary), 0.04);
}
.stats-page .v-table__wrapper,
.leaderboard-page .v-table__wrapper {
  scrollbar-width: thin;
}
@media (max-width: 760px) {
  .header .desktop-navigation {
    display: none;
  }
  .header-navigation {
    margin-left: 0;
    min-width: 0;
    flex: 1;
  }
  .header-navigation a {
    padding: 8px;
    font-size: 14px;
    line-height: 1.25;
  }
  .header-left-container .connect-status {
    display: none;
  }
  .header-left-container {
    gap: 10px;
  }
  .header {
    gap: 4px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

<style lang="scss">
.header-account {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 14px;
}
.header-account:hover {
  background: rgb(var(--v-theme-inset-hover));
}
.header-account img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.connection-warning {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 110;
  max-width: calc(100vw - 32px);
  padding: 10px 16px;
  border-radius: 8px;
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
  font-size: 14px;
}
</style>
