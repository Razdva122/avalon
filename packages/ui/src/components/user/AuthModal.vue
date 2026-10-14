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
      <v-btn
        variant="text"
        color="text-primary"
        class="mt-2"
        to="/password-recovery/"
        @click="closeAuthModal('password_recovery')"
      >
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
import { consumePlayIntent, trackSignup, trackOnboarding, type AuthAction } from '@/helpers/acquisition';
import { localizedPath } from '@/router/paths';

export default defineComponent({
  components: {
    BaseModal,
    PasswordField,
    TextField,
  },
  props: {
    modelValue: Boolean,
    continuation: Object as PropType<{ route: string; resume: () => void | Promise<void>; action?: AuthAction } | null>,
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
    modelValue: {
      immediate: true,
      handler(open: boolean) {
        if (open) trackOnboarding('auth_open', this.analyticsContext());
        else this.authRequest++;
      },
    },
    mode() {
      this.error = '';
      if (this.modelValue) trackOnboarding('auth_tab', this.analyticsContext());
    },
    loginType() {
      this.error = '';
    },
  },
  methods: {
    analyticsContext() {
      return {
        page: this.$route.meta.id || this.$route.name,
        action: this.continuation?.action || 'account',
        mode: this.mode,
      };
    },
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
      const context = { ...this.analyticsContext(), mode: 'auth' };
      trackOnboarding('login_attempt', context);
      const userOrError = await this.$store.dispatch('login', { loginOrEmail: this.login, password: this.password });
      trackOnboarding('error' in userOrError ? 'login_error' : 'login', {
        ...context,
        ...('error' in userOrError ? { error: userOrError.error } : {}),
      });
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
      const context = { ...this.analyticsContext(), mode: 'registration' };
      trackOnboarding('sign_up_attempt', context);
      const userOrError = await this.$store.dispatch('registerUser', {
        email: this.email,
        password: this.password,
        name: this.username,
        login: this.login,
      });
      if ('error' in userOrError) trackOnboarding('sign_up_error', { ...context, error: userOrError.error });
      else {
        trackSignup();
        trackOnboarding('auth_result', { ...context, result: 'success' });
      }
      if (request !== this.authRequest || continuation !== this.continuation || route !== this.$route.fullPath) return;

      if ('error' in userOrError) {
        this.error = userOrError.error;
      } else {
        if (await this.continueAfterAuth(true)) return;
        await this.$router.push(localizedPath('/', unref(this.$i18n.locale)));
        this.$emit('registered');
      }
    },
    async continueAfterAuth(signup = false): Promise<boolean> {
      const resume = this.continuation?.route === this.$route.fullPath ? this.continuation?.resume : undefined;
      const context = this.analyticsContext();
      this.closeAuthModal('success');
      const hasPlayIntent = consumePlayIntent(this.$route.meta.id || this.$route.name);
      trackOnboarding('auth_continue', {
        ...context,
        result: resume || hasPlayIntent ? 'continued' : signup ? 'welcome' : 'stay',
      });
      if (resume) {
        await resume();
        return true;
      }
      return hasPlayIntent;
    },
    closeAuthModal(reason: 'dismiss' | 'success' | 'password_recovery' = 'dismiss') {
      if (reason !== 'success' && this.overlay)
        trackOnboarding('auth_dismiss', {
          ...this.analyticsContext(),
          reason: reason === 'password_recovery' ? reason : 'close',
        });
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
