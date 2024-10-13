<template>
  <v-overlay v-model="overlay" :persistent="true" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <v-form @submit.prevent="updateUser" class="d-flex flex-column align-center justify-center">
          <span class="mb-2">{{ $t('settings.usernameHint') }}</span>
          <v-text-field
            v-model="username"
            :rules="rules"
            :label="$t('settings.username')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-select
            :label="$t('settings.language')"
            :items="availableLocales"
            class="w-100 mb-2"
            v-model="locale"
          ></v-select>
          <v-select
            :label="$t('settings.colorTheme')"
            :items="availableThemes"
            class="w-100 mb-2"
            v-model="colorTheme"
          ></v-select>
          <v-checkbox
            v-if="isUserExist"
            v-model="hideSpoilers"
            :hide-details="true"
            :label="$t('settings.hideSpoilersHint')"
          >
          </v-checkbox>
          <v-checkbox
            v-if="isUserExist"
            v-model="hideIndexInHistory"
            :hide-details="true"
            :label="$t('settings.hideIndexHint')"
          >
          </v-checkbox>
          <v-checkbox v-if="isUserExist" v-model="style" :hide-details="true" :label="$t('settings.animeMode')">
          </v-checkbox>
          <v-btn :disabled="!username.length" type="submit">{{
            isUserExist ? $t('settings.update') : $t('settings.submit')
          }}</v-btn>
        </v-form>
      </v-sheet>
      <v-btn @click="closeSettings" class="close" icon="close" variant="text" density="compact" />
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import eventBus from '@/helpers/event-bus';
import { LanguageMap, TLanguage } from '@/helpers/i18n';

export default defineComponent({
  data() {
    const { user } = this.$store.state;

    return {
      overlay: false,
      username: user?.name || '',
      isUserExist: Boolean(user),
      availableLocales: this.$i18n.availableLocales.map((el) => ({
        value: el,
        title: LanguageMap[<TLanguage>el],
      })),
      rules: [
        (value: string | undefined) => {
          if (value) return true;

          return this.$t('settings.usernameRequired');
        },
      ],
    };
  },
  mounted() {
    eventBus.on('openSettings', () => {
      this.overlay = true;
    });
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
        return Boolean(this.$store.state.user?.settings?.hideIndexInHistory);
      },
      set(value: boolean) {
        this.$store.commit('updateUserSettings', { key: 'hideIndexInHistory', value });
      },
    },
    colorTheme: {
      get() {
        return this.$store.state.user?.settings?.colorTheme || 'light';
      },
      set(value: 'light' | 'dark') {
        this.$store.commit('updateUserSettings', { key: 'colorTheme', value });
        // @ts-ignore
        this.$vuetify.theme.global.name = value === 'dark' ? 'darkTheme' : 'lightTheme';
      },
    },
    style: {
      get() {
        return this.$store.state.user?.settings?.style === 'anime';
      },
      set(value: boolean) {
        this.$store.commit('updateUserSettings', { key: 'style', value: value ? 'anime' : 'default' });
      },
    },
    availableThemes() {
      return [
        {
          value: 'light',
          title: this.$t('settings.lightTheme'),
        },
        {
          value: 'dark',
          title: this.$t('settings.darkTheme'),
        },
      ];
    },
  },
  methods: {
    updateUser() {
      if (this.username !== this.$store.state.user?.name) {
        if (this.isUserExist) {
          this.$store.commit('updateUserName', this.username);
        } else {
          this.$store.commit('setUserData', { id: uuidv4(), name: this.username });
        }

        document.location.reload();
      }

      this.closeSettings();
    },
    closeSettings() {
      this.overlay = false;
    },
    displaySettings() {
      this.overlay = true;
    },
  },
});
</script>

<style scoped lang="scss">
.close {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
