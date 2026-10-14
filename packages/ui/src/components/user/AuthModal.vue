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
      <v-btn :disabled="!formValid.loginForm" type="submit" color="primary" variant="elevated" class="submit-btn">{{
        $t('modal.loginButton')
      }}</v-btn>
      <v-btn variant="text" color="text-primary" class="mt-2" to="/password-recovery/" @click="closeAuthModal">
        {{ $t('passwordRecovery.forgot') }}
      </v-btn>
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
        :rules="[validators.required, validators.min8, validators.maxPasswordBytes, validators.spacesForbidden]"
        :label="$t('modal.password')"
        :hint="$t('validators.minCharacters', { count: 8 })"
        counter
      />
      <span class="mb-2">{{ $t('modal.usernameHint') }}</span>
      <TextField
        v-model="username"
        autocomplete="nickname"
        :rules="[validators.required, validators.name]"
        :label="$t('modal.username')"
      />
      <v-btn
        :disabled="!formValid.registrationForm"
        type="submit"
        color="primary"
        variant="elevated"
        class="submit-btn"
        >{{ $t('modal.registrationButton') }}</v-btn
      >
    </v-form>
  </BaseModal>
</template>

<script lang="ts">
import { defineComponent, unref, type PropType } from 'vue';
import { validators } from '@/helpers/validators';
import type { VForm } from 'vuetify/components';
import BaseModal from '@/components/user/BaseModal.vue';
import PasswordField from '@/components/modals/PasswordField.vue';
import TextField from '@/components/modals/TextField.vue';
import { consumePlayIntent, trackSignup } from '@/helpers/acquisition';
import { localizedPath } from '@/router/paths';

export default defineComponent({
  components: {
    BaseModal,
    PasswordField,
    TextField,
  },
  props: {
    modelValue: Boolean,
    continuation: Object as PropType<{ route: string; resume: () => void | Promise<void> } | null>,
  },
  emits: ['update:modelValue', 'registered'],
  computed: {
    overlay: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
      },
    },
  },
  data() {
    const { profile } = this.$store.state;

    return {
      mode: 'auth',
      authRequest: 0,
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
  watch: {
    modelValue(open: boolean) {
      if (!open) this.authRequest++;
    },
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
      const request = ++this.authRequest;
      const continuation = this.continuation;
      const route = this.$route.fullPath;
      const userOrError = await this.$store.dispatch('login', { loginOrEmail: this.login, password: this.password });
      if (request !== this.authRequest || continuation !== this.continuation || route !== this.$route.fullPath) return;

      if ('error' in userOrError) {
        this.error = userOrError.error;
      } else {
        await this.continueAfterAuth();
      }
    },
    async registerUser() {
      const request = ++this.authRequest;
      const continuation = this.continuation;
      const route = this.$route.fullPath;
      const userOrError = await this.$store.dispatch('registerUser', {
        email: this.email,
        password: this.password,
        name: this.username,
        login: this.login,
      });
      if (request !== this.authRequest || continuation !== this.continuation || route !== this.$route.fullPath) return;

      if ('error' in userOrError) {
        this.error = userOrError.error;
      } else {
        trackSignup();
        if (await this.continueAfterAuth()) return;
        await this.$router.push(localizedPath('/', unref(this.$i18n.locale)));
        this.$emit('registered');
      }
    },
    async continueAfterAuth(): Promise<boolean> {
      const resume = this.continuation?.route === this.$route.fullPath ? this.continuation?.resume : undefined;
      this.closeAuthModal();
      const hasPlayIntent = consumePlayIntent(this.$route.meta.id || this.$route.name);
      if (resume) {
        await resume();
        return true;
      }
      return hasPlayIntent;
    },
    closeAuthModal() {
      this.authRequest++;
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

  .v-btn {
    min-height: 44px;
  }
}
</style>
