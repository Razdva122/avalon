<template>
  <main class="recovery-page">
    <v-card class="recovery-card" elevation="4">
      <h1>{{ $t(token ? 'passwordRecovery.newTitle' : 'passwordRecovery.title') }}</h1>
      <p v-if="checking" role="status">{{ $t('passwordRecovery.loading') }}</p>
      <v-alert v-if="error" ref="errorBox" tabindex="-1" type="error" variant="tonal" role="alert" class="mb-4">
        {{ $t('passwordRecovery.' + error) }}
      </v-alert>
      <v-alert v-if="sent || done" type="success" variant="tonal" role="status" class="mb-4">
        {{ $t(done ? 'passwordRecovery.done' : 'passwordRecovery.sent') }}
      </v-alert>
      <v-form v-if="enabled && !done && !sent" ref="form" @submit.prevent="submit">
        <template v-if="!token">
          <p class="mb-5">{{ $t('passwordRecovery.intro') }}</p>
          <TextField
            v-model="email"
            :label="$t('modal.email')"
            type="email"
            autocomplete="email"
            :rules="[validators.required, validators.email]"
            :disabled="pending"
          />
        </template>
        <template v-else>
          <PasswordField
            v-model="password"
            :label="$t('modal.newPassword')"
            autocomplete="new-password"
            :rules="[passwordRule]"
            :hint="$t('passwordRecovery.passwordHint')"
            :disabled="pending"
          />
          <PasswordField
            v-model="confirmation"
            :label="$t('passwordRecovery.confirm')"
            autocomplete="new-password"
            :rules="[confirmRule]"
            :disabled="pending"
          />
        </template>
        <v-btn type="submit" color="primary" block :loading="pending" :disabled="pending">
          {{ $t(token ? 'passwordRecovery.save' : 'passwordRecovery.send') }}
        </v-btn>
      </v-form>
      <v-btn
        v-if="(token || sent) && !done"
        class="mt-4"
        variant="text"
        color="text-primary"
        block
        :disabled="pending"
        @click="restart"
      >
        {{ $t('passwordRecovery.another') }}
      </v-btn>
      <v-btn class="mt-4" variant="text" color="text-primary" block :disabled="pending" @click="login">
        {{ $t('passwordRecovery.login') }}
      </v-btn>
    </v-card>
  </main>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import type { VForm } from 'vuetify/components';
import TextField from '@/components/modals/TextField.vue';
import PasswordField from '@/components/modals/PasswordField.vue';
import { validators } from '@/helpers/validators';
import eventBus from '@/helpers/event-bus';

const base = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
async function request(path: string, body?: object) {
  const response = await fetch(`${base}/api/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'unavailable');
  return result;
}

export default defineComponent({
  components: { TextField, PasswordField },
  data() {
    const initial = window as Window & { __avalonRecoveryToken?: string };
    const token = initial.__avalonRecoveryToken || window.location.hash.slice(1);
    delete initial.__avalonRecoveryToken;
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    return {
      token,
      email: '',
      password: '',
      confirmation: '',
      error: '',
      pending: false,
      sent: false,
      done: false,
      checking: true,
      enabled: false,
      validators,
    };
  },
  async mounted() {
    try {
      this.enabled = (await request('recovery')).enabled;
      if (!this.enabled) this.error = 'unavailable';
    } catch {
      this.error = 'unavailable';
    } finally {
      this.checking = false;
    }
  },
  watch: {
    '$route.hash'(hash: string) {
      if (!hash) return;
      // A mail link can open in a tab that is already on this page.
      this.restart();
      this.done = false;
      this.token = hash.slice(1);
      void this.$router.replace({ path: '/password-recovery/', hash: '', query: {} });
    },
  },
  methods: {
    passwordRule(value: string) {
      return (
        (value.length >= 8 && new TextEncoder().encode(value).length <= 72 && !/\s/.test(value)) ||
        this.$t('passwordRecovery.invalid_password')
      );
    },
    confirmRule(value: string) {
      return (!!value && value === this.password) || this.$t('passwordRecovery.mismatch');
    },
    async submit() {
      if (this.pending || !this.enabled) return;
      if (!(await (this.$refs.form as VForm).validate()).valid) return;
      this.pending = true;
      this.error = '';
      try {
        if (this.token) {
          await request('reset-password', { token: this.token, password: this.password });
          this.done = true;
          this.token = this.password = this.confirmation = '';
          this.$store.commit('clearUserProfile');
        } else {
          await request('forgot-password', { email: this.email, language: this.$i18n.locale });
          this.sent = true;
        }
      } catch (error) {
        const code = error instanceof Error ? error.message : '';
        this.error = ['invalid_email', 'invalid_password', 'invalid_token', 'rate_limited', 'invalid_request'].includes(
          code,
        )
          ? code
          : 'unavailable';
        await nextTick();
        (this.$refs.errorBox as { $el?: HTMLElement })?.$el?.focus();
      } finally {
        this.pending = false;
      }
    },
    restart() {
      this.token = this.password = this.confirmation = this.error = '';
      this.sent = false;
    },
    async login() {
      await this.$router.push('/');
      eventBus.emit('openAuthModal');
    },
  },
});
</script>

<style scoped lang="scss">
.recovery-page {
  width: 100%;
  padding: 80px 16px 32px;
}
.recovery-card {
  max-width: 440px;
  margin: 0 auto;
  padding: 28px;
  border-radius: 16px;
}
h1 {
  font-size: 26px;
  line-height: 1.25;
  margin-bottom: 24px;
  overflow-wrap: anywhere;
}
p {
  line-height: 1.6;
}
.v-btn {
  min-height: 44px;
  height: auto;
  padding-top: 12px;
  padding-bottom: 12px;
}
:deep(.v-btn__content) {
  white-space: normal;
}
@media (max-width: 400px) {
  .recovery-card {
    padding: 20px;
  }
}
</style>
