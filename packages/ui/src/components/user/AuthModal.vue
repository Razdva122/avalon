<template>
  <v-overlay v-model="overlay" :persistent="true" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <v-tabs v-model="mode" class="tabs mb-4" align-tabs="center">
          <v-tab value="auth">{{ $t('modal.loginTab') }}</v-tab>
          <v-tab value="registration">{{ $t('modal.registrationTab') }}</v-tab>
        </v-tabs>
        <div v-if="error" class="error-message mb-2 ml-2">
          {{ $t('errors.' + error) }}
        </div>
        <v-form
          ref="emailForm"
          @input="updateFormValidity('emailForm')"
          @submit.prevent="loginInAccount"
          class="form"
          v-if="mode === 'auth' && loginType === 'email'"
        >
          <v-text-field
            v-model="email"
            autocomplete="email"
            :rules="[validators.required, validators.spacesForbidden]"
            :label="$t('modal.email')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-text-field
            v-model="password"
            autocomplete="password"
            :append-inner-icon="visiblePass ? 'visibility_off' : 'visibility'"
            :type="visiblePass ? 'text' : 'password'"
            :rules="[validators.required, validators.spacesForbidden]"
            :label="$t('modal.password')"
            class="w-100 mb-2"
            @click:append-inner="visiblePass = !visiblePass"
          ></v-text-field>
          <v-btn :disabled="!formValid.emailForm" type="submit">{{ $t('modal.loginButton') }}</v-btn>
        </v-form>
        <v-form
          ref="loginForm"
          @input="updateFormValidity('loginForm')"
          @submit.prevent="loginInAccount"
          class="form"
          v-if="mode === 'auth' && loginType === 'login'"
        >
          <v-text-field
            v-model="login"
            autocomplete="login"
            :rules="[validators.required, validators.spacesForbidden]"
            :label="$t('modal.login')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-text-field
            v-model="password"
            autocomplete="password"
            :append-inner-icon="visiblePass ? 'visibility_off' : 'visibility'"
            :type="visiblePass ? 'text' : 'password'"
            :rules="[validators.required, validators.spacesForbidden]"
            :label="$t('modal.password')"
            class="w-100 mb-2"
            @click:append-inner="visiblePass = !visiblePass"
          ></v-text-field>
          <v-btn :disabled="!formValid.loginForm" type="submit">{{ $t('modal.loginButton') }}</v-btn>
        </v-form>
        <v-form
          ref="registrationForm"
          @input="updateFormValidity('registrationForm')"
          @submit.prevent="registerUser"
          class="form"
          v-else
        >
          <span class="mb-2">{{ $t('modal.loginHint') }}</span>
          <v-text-field
            v-model="login"
            autocomplete="login"
            :rules="[validators.required, validators.spacesForbidden]"
            :label="$t('modal.login')"
            type="login"
            class="w-100 mb-2"
          ></v-text-field>
          <v-text-field
            v-model="email"
            autocomplete="email"
            :rules="[validators.required, validators.email, validators.spacesForbidden]"
            :label="$t('modal.email')"
            type="email"
            class="w-100 mb-2"
          ></v-text-field>
          <v-text-field
            v-model="password"
            autocomplete="password"
            :append-inner-icon="visiblePass ? 'visibility_off' : 'visibility'"
            :type="visiblePass ? 'text' : 'password'"
            :rules="[validators.required, validators.min8, validators.spacesForbidden]"
            :label="$t('modal.password')"
            :hint="$t('validators.minCharacters', { count: 8 })"
            class="w-100 mb-2"
            counter
            @click:append-inner="visiblePass = !visiblePass"
          ></v-text-field>
          <span class="mb-2">{{ $t('modal.usernameHint') }}</span>
          <v-text-field
            autocomplete="nickname"
            v-model="username"
            :rules="[validators.required]"
            :label="$t('modal.username')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-btn :disabled="!formValid.registrationForm" type="submit">{{ $t('modal.registrationButton') }}</v-btn>
        </v-form>
      </v-sheet>
      <v-btn @click="closeAuthModal" class="close" icon="close" variant="text" density="compact" />
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import eventBus from '@/helpers/event-bus';
import { validators } from '@/helpers/validators';
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
      error: '',
      login: '',
      loginType: 'email',
      validators,
      formValid: {
        loginForm: false,
        emailForm: false,
        registrationForm: false,
      },
    };
  },
  mounted() {
    eventBus.on('openAuthModal', () => {
      this.displayAuthModal();
    });
  },
  computed: {},
  watch: {
    mode() {
      this.error = '';
    },
  },
  methods: {
    async updateFormValidity(type: 'loginForm' | 'emailForm' | 'registrationForm') {
      this.error = '';

      const requiredFields = {
        loginForm: ['login', 'password'],
        emailForm: ['email', 'password'],
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
      const params =
        this.loginType === 'email'
          ? { loginOrEmail: this.email, type: this.loginType }
          : { loginOrEmail: this.login, type: this.loginType };
      const userOrError = await this.$store.dispatch('login', { ...params, password: this.password });

      if ('error' in userOrError) {
        this.error = userOrError.error;
      } else {
        this.closeAuthModal();
      }
    },
    async registerUser() {
      const userOrError = await this.$store.dispatch('registerUser', {
        email: this.email,
        password: this.password,
        name: this.username,
      });

      if ('error' in userOrError) {
        this.error = userOrError.error;
      } else {
        this.closeAuthModal();
      }
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

.error-message {
  color: rgb(var(--v-theme-error));
}
</style>
