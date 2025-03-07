<template>
  <v-overlay v-model="overlay" :persistent="true" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <v-tabs v-model="mode" class="tabs mb-4" align-tabs="center">
          <v-tab value="auth">{{ $t('authModal.loginTab') }}</v-tab>
          <v-tab value="registration">{{ $t('authModal.registrationTab') }}</v-tab>
        </v-tabs>
        <v-form
          ref="loginForm"
          @input="updateFormValidity('loginForm')"
          @submit.prevent="loginInAccount"
          class="form"
          v-if="mode === 'auth'"
        >
          <v-text-field
            v-model="email"
            autocomplete="email"
            :rules="[rules.required, rules.spacesForbidden]"
            :label="$t('authModal.email')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-text-field
            v-model="password"
            autocomplete="password"
            :append-inner-icon="visiblePass ? 'visibility_off' : 'visibility'"
            :type="visiblePass ? 'text' : 'password'"
            :rules="[rules.required, rules.spacesForbidden]"
            :label="$t('authModal.password')"
            class="w-100 mb-2"
            @click:append-inner="visiblePass = !visiblePass"
          ></v-text-field>
          <v-btn :disabled="!formValid.loginForm" type="submit">{{ $t('authModal.loginButton') }}</v-btn>
        </v-form>
        <v-form
          ref="registrationForm"
          @input="updateFormValidity('registrationForm')"
          @submit.prevent="registerUser"
          class="form"
          v-else
        >
          <span class="mb-2">{{ $t('authModal.emailHint') }}</span>
          <v-text-field
            v-model="email"
            autocomplete="email"
            :rules="[rules.required, rules.email, rules.spacesForbidden]"
            :label="$t('authModal.email')"
            type="email"
            class="w-100 mb-2"
          ></v-text-field>
          <v-text-field
            v-model="password"
            autocomplete="password"
            :append-inner-icon="visiblePass ? 'visibility_off' : 'visibility'"
            :type="visiblePass ? 'text' : 'password'"
            :rules="[rules.required, rules.min8, rules.spacesForbidden]"
            :label="$t('authModal.password')"
            :hint="$t('authModal.minCharacters', { count: 8 })"
            class="w-100 mb-2"
            counter
            @click:append-inner="visiblePass = !visiblePass"
          ></v-text-field>
          <span class="mb-2">{{ $t('authModal.usernameHint') }}</span>
          <v-text-field
            autocomplete="nickname"
            v-model="username"
            :rules="[rules.required]"
            :label="$t('authModal.username')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-btn :disabled="!formValid.registrationForm" type="submit">{{ $t('authModal.registrationButton') }}</v-btn>
        </v-form>
      </v-sheet>
      <v-btn @click="closeAuthModal" class="close" icon="close" variant="text" density="compact" />
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import eventBus from '@/helpers/event-bus';
import { LanguageMap, TLanguage } from '@/helpers/i18n';
import type { VForm } from 'vuetify/components';

export default defineComponent({
  data() {
    const { profile } = this.$store.state;

    return {
      overlay: false,
      mode: 'auth',
      username: profile?.name || '',
      visiblePass: false,
      password: '',
      email: '',
      availableLocales: this.$i18n.availableLocales.map((el) => ({
        value: el,
        title: LanguageMap[<TLanguage>el],
      })),
      rules: {
        required: (value: string) => {
          if (value) return true;

          return this.$t('authModal.requiredField');
        },
        min8: (value: string) => value.length >= 8 || this.$t('authModal.minCharacters', { count: 8 }),
        email: (value: string) => Boolean(value.match(/^\S+@\S+\.\S+$/)) || 'example@email.com',
        spacesForbidden: (value: string) => /^\S+$/.test(value) || this.$t('authModal.spacesForbidden'),
      },
      formValid: {
        loginForm: false,
        registrationForm: false,
      },
    };
  },
  mounted() {
    eventBus.on('openAuthModal', () => {
      this.displayAuthModal();
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
    availableThemes() {
      return [
        {
          value: 'light',
          title: this.$t('authModal.lightTheme'),
        },
        {
          value: 'dark',
          title: this.$t('authModal.darkTheme'),
        },
      ];
    },
  },
  methods: {
    async updateFormValidity(type: 'loginForm' | 'registrationForm') {
      const requiredFields = {
        loginForm: ['email', 'password'],
        registrationForm: ['password', 'email', 'username'],
      } as const;

      const allFieldsFilled = requiredFields[type].every((field) => Boolean(this[field]));

      if (!allFieldsFilled) {
        this.formValid[type] = false;
        return;
      }

      const form = this.$refs[type] as VForm;
      const { valid } = await form.validate();
      this.formValid[type] = valid;
    },
    async loginInAccount() {
      await this.$store.dispatch('login', { email: this.email, password: this.password });
      this.closeAuthModal();
    },
    async registerUser() {
      await this.$store.dispatch('registerUser', { email: this.email, password: this.password, name: this.username });
      this.closeAuthModal();
    },
    closeAuthModal() {
      this.overlay = false;
    },
    displayAuthModal() {
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

.tabs {
  border-radius: 8px;
}

.form {
  display: flex;
  flex-direction: column;
}
</style>
