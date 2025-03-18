<template>
  <header class="header">
    <div class="header-left-container d-flex align-center mr-4 ml-4">
      <v-btn class="mr-2" density="comfortable" variant="plain" color="invert" to="/" icon>
        <v-icon size="x-large">home</v-icon>
      </v-btn>
      <Socials class="mr-4" />
      <ConnectStatus class="connect-status" />
    </div>
    <div class="header-right-container d-flex align-center mr-2">
      <SpoilerEye v-if="currentRoute === 'room'" />
      <ThemeToggle />
      <Menu @profileClick="profileClick" />
    </div>
  </header>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Transition mode="out-in">
        <Suspense>
          <component :is="Component" class="page"></component>

          <template #fallback> {{ $t('mainPage.loading') }} </template>
        </Suspense>
      </Transition>
    </template>
  </RouterView>
  <AuthModal />
  <CredentialsModal />
  <InfoSnackbar />
  <Version class="version" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AuthModal from '@/components/user/AuthModal.vue';
import CredentialsModal from '@/components/user/CredentialsModal.vue';
import Menu from '@/components/header/Menu.vue';
import ConnectStatus from '@/components/feedback/ConnectStatus.vue';
import InfoSnackbar from '@/components/feedback/InfoSnackbar.vue';
import Version from '@/components/feedback/Version.vue';
import Socials from '@/components/feedback/Socials.vue';
import SpoilerEye from '@/components/feedback/SpoilerEye.vue';
import ThemeToggle from '@/components/feedback/ThemeToggle.vue';
import { isHolidays } from '@/helpers/utility';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  components: {
    AuthModal,
    ConnectStatus,
    InfoSnackbar,
    Version,
    Socials,
    Menu,
    SpoilerEye,
    ThemeToggle,
    CredentialsModal,
  },
  data() {
    return {
      currentLocale: this.$i18n.locale,
    };
  },
  computed: {
    currentRoute() {
      return this.$route.name;
    },
  },
  methods: {
    profileClick() {
      if (this.$store.state.profile) {
        this.$router.push({ name: 'profile' });
      } else {
        eventBus.emit('openAuthModal');
      }
    },
  },
  created() {
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
body {
  color: rgb(var(--v-theme-text-primary));
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
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
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  display: flex;
  justify-content: space-between;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(var(--v-theme-text-primary), 0.1);
}

.page {
  padding-top: 50px;
}

.connect-status {
  font-size: large;
}

.header-right-container {
  font-size: large;
}

.version {
  opacity: 30%;
  font-size: large;
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
  height: 100vh;
  background-image: getImagePathByID('core', 'holidays-background');
  background-attachment: fixed;
  background-size: cover;
  pointer-events: none;
  z-index: -1;
  opacity: 0.1;
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
</style>
