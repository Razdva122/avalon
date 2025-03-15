<template>
  <BaseModal v-model="overlay" :error="error" :width="300" :persistent="true" @close="closeAuthModal">
    <template #header>
      <v-tabs v-model="mode" class="tabs mb-4" color="text-primary" align-tabs="center">
        <v-tab value="auth">{{ $t('modal.loginTab') }}</v-tab>
        <v-tab value="registration">{{ $t('modal.registrationTab') }}</v-tab>
      </v-tabs>
    </template>

    <v-form
      ref="loginForm"
      @input="updateFormValidity('loginForm')"
      @submit.prevent="loginInAccount"
      class="form"
      v-if="mode === 'auth'"
    >
      <TextField
        v-model="login"
        autocomplete="login"
        :rules="[validators.required, validators.spacesForbidden]"
        :label="$t('modal.email') + '/' + $t('modal.login')"
      />
      <PasswordField
        v-model="password"
        :rules="[validators.required, validators.spacesForbidden]"
        :label="$t('modal.password')"
      />
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
      <TextField
        v-model="login"
        autocomplete="login"
        :rules="[validators.required, validators.spacesForbidden, validators.login]"
        :label="$t('modal.login')"
        type="login"
      />
      <TextField
        v-model="email"
        autocomplete="email"
        :rules="[validators.required, validators.email, validators.spacesForbidden]"
        :label="$t('modal.email')"
        type="email"
      />
      <PasswordField
        v-model="password"
        :rules="[validators.required, validators.min8, validators.spacesForbidden]"
        :label="$t('modal.password')"
        :hint="$t('validators.minCharacters', { count: 8 })"
        counter
      />
      <span class="mb-2">{{ $t('modal.usernameHint') }}</span>
      <TextField
        v-model="username"
        autocomplete="nickname"
        :rules="[validators.required]"
        :label="$t('modal.username')"
      />
      <v-btn :disabled="!formValid.registrationForm" type="submit">{{ $t('modal.registrationButton') }}</v-btn>
    </v-form>
  </BaseModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import eventBus from '@/helpers/event-bus';
import { validators } from '@/helpers/validators';
import type { VForm } from 'vuetify/components';
import BaseModal from '@/components/user/BaseModal.vue';
import PasswordField from '@/components/modals/PasswordField.vue';
import TextField from '@/components/modals/TextField.vue';

export default defineComponent({
  components: {
    BaseModal,
    PasswordField,
    TextField,
  },
  data() {
    const { profile } = this.$store.state;

    return {
      overlay: false,
      mode: 'auth',
      username: profile?.name || '',
      password: '',
      email: '',
      error: '',
      login: '',
      validators,
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
  watch: {
    mode() {
      this.error = '';
    },
    loginType() {
      this.error = '';
    },
  },
  methods: {
    async updateFormValidity(type: 'loginForm' | 'registrationForm') {
      this.error = '';

      const requiredFields = {
        loginForm: ['login', 'password'],
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
      const userOrError = await this.$store.dispatch('login', { loginOrEmail: this.login, password: this.password });

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
        login: this.login,
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
.tabs {
  border-radius: 8px;
}

.form {
  display: flex;
  flex-direction: column;
}
</style>
