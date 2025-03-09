<template>
  <div class="info-page-content profile-page">
    <div class="profile-section">
      <h2>{{ $t('profile.profile') }}</h2>
      <v-btn class="mb-4 w-100" size="large" @click="goToStats">
        <template v-slot:prepend>
          <span class="material-icons"> insert_chart_outlined </span>
        </template>
        {{ $t('profile.stats') }}
      </v-btn>
      <div class="mb-2">Email: {{ $store.state.profile?.email }}</div>
      <v-text-field
        hide-details="auto"
        v-model="username"
        :label="$t('profile.username')"
        class="w-100 mb-2"
      ></v-text-field>
      <div class="d-flex justify-space-between">
        <v-btn :disabled="!updateAvailable" @click="update">{{ $t('profile.update') }}</v-btn>
        <v-btn @click="logout">{{ $t('profile.logout') }}</v-btn>
      </div>
    </div>
    <div class="section-settings">
      <h2>{{ $t('profile.settings') }}</h2>
      <v-select
        :label="$t('profile.language')"
        :items="availableLocales"
        class="w-100 mb-4"
        v-model="locale"
        hide-details="auto"
      ></v-select>
      <v-select
        :label="$t('profile.colorTheme')"
        :items="availableThemes"
        class="w-100 mb-4"
        v-model="colorTheme"
        hide-details="auto"
      ></v-select>
      <v-checkbox v-model="hideSpoilers" :hide-details="true" :label="$t('profile.hideSpoilersHint')"> </v-checkbox>
      <v-checkbox v-model="hideIndexInHistory" :hide-details="true" :label="$t('profile.hideIndexHint')"> </v-checkbox>
      <v-checkbox v-model="style" :hide-details="true" :label="$t('profile.animeMode')"> </v-checkbox>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LanguageMap, TLanguage } from '@/helpers/i18n';
import { store } from '@/store';
import eventBus from '@/helpers/event-bus';
import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';

export default defineComponent({
  name: 'Profile',
  components: {},
  data() {
    const { profile } = this.$store.state;

    return {
      username: profile?.name || '',
      availableLocales: this.$i18n.availableLocales.map((el) => ({
        value: el,
        title: LanguageMap[<TLanguage>el],
      })),
    };
  },
  computed: {
    hideSpoilers: {
      get() {
        return this.$store.state.hideSpoilers;
      },
      set(value: boolean) {
        this.$store.commit('updateHideSpoilers', value);
      },
    },
    locale: {
      get() {
        return LanguageMap[<TLanguage>(<unknown>this.$i18n.locale)];
      },
      set(value: string) {
        this.$store.commit('updateUserSettings', { key: 'locale', value: { value, isDefault: false } });
        (<unknown>this.$i18n.locale) = value;
        document.documentElement.lang = value;
      },
    },
    hideIndexInHistory: {
      get() {
        return Boolean(this.$store.state.settings?.hideIndexInHistory);
      },
      set(value: boolean) {
        this.$store.commit('updateUserSettings', { key: 'hideIndexInHistory', value });
      },
    },
    colorTheme: {
      get() {
        return this.$store.state.settings?.colorTheme || 'light';
      },
      set(value: 'light' | 'dark') {
        this.$store.commit('updateUserSettings', { key: 'colorTheme', value });
        // @ts-ignore
        this.$vuetify.theme.global.name = value === 'dark' ? 'darkTheme' : 'lightTheme';
      },
    },
    style: {
      get() {
        return this.$store.state.settings?.style === 'anime';
      },
      set(value: boolean) {
        this.$store.commit('updateUserSettings', { key: 'style', value: value ? 'anime' : 'default' });
      },
    },
    updateAvailable() {
      return this.username !== '' && this.$store.state.profile?.name !== this.username;
    },
    availableThemes() {
      return [
        {
          value: 'light',
          title: this.$t('profile.lightTheme'),
        },
        {
          value: 'dark',
          title: this.$t('profile.darkTheme'),
        },
      ];
    },
  },
  methods: {
    logout() {
      this.$store.commit('clearUserProfile');
      this.$router.push({ name: 'lobby' });
    },
    goToStats() {
      this.$router.push({ name: 'user_stats', params: { uuid: this.$store.state.profile!.id } });
    },
    update() {
      this.$store.dispatch('updateUserName', { name: this.username });
    },
  },
  beforeRouteEnter(_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) {
    if (!store.state.profile) {
      next({ name: 'lobby' });
      eventBus.emit('openAuthModal');
    } else {
      next();
    }
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.profile-page {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}

@media (max-width: 600px) {
  .profile-page {
    flex-direction: column;
  }
}

@media (min-width: 600px) {
  .profile-section,
  .section-settings {
    min-width: 45%;
  }
}
</style>
