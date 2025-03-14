<template>
  <BaseModal v-model="overlay" :error="error" :width="300" @close="closeModal">
    <template #header>
      <h2 class="modal-header mb-2">{{ $t('modal.change' + mode) }}</h2>
    </template>
    <v-form
      ref="emailForm"
      @input="updateFormValidity('emailForm')"
      @submit.prevent="updateEmail"
      class="form"
      v-if="mode === 'email'"
    >
      <PasswordField
        v-model="password"
        :rules="[validators.required, validators.spacesForbidden]"
        :label="$t('modal.password')"
      />
      <TextField
        v-model="email"
        autocomplete="email"
        :rules="[validators.required, validators.spacesForbidden, validators.email]"
        :label="$t('modal.newEmail')"
      />
      <v-btn :disabled="!formValid.emailForm" type="submit">{{ $t('modal.changeButton') }}</v-btn>
    </v-form>

    <v-form
      ref="loginForm"
      @input="updateFormValidity('loginForm')"
      @submit.prevent="updateLogin"
      class="form"
      v-else-if="mode === 'login'"
    >
      <PasswordField
        v-model="password"
        :rules="[validators.required, validators.spacesForbidden]"
        :label="$t('modal.password')"
      />
      <TextField
        v-model="login"
        autocomplete="login"
        :rules="[validators.required, validators.spacesForbidden]"
        :label="$t('modal.login')"
      />
      <v-btn :disabled="!formValid.loginForm" type="submit">{{ $t('modal.changeButton') }}</v-btn>
    </v-form>

    <v-form
      ref="passwordForm"
      @input="updateFormValidity('passwordForm')"
      @submit.prevent="updatePassword"
      class="form"
      v-else
    >
      <PasswordField
        v-model="password"
        :rules="[validators.required, validators.min8, validators.spacesForbidden]"
        :label="$t('modal.password')"
        :hint="$t('validators.minCharacters', { count: 8 })"
        counter
      />
      <PasswordField
        v-model="newPassword"
        autocomplete="new-password"
        :rules="[validators.required, validators.min8, validators.spacesForbidden]"
        :label="$t('modal.newPassword')"
        :hint="$t('validators.minCharacters', { count: 8 })"
        counter
      />
      <v-btn :disabled="!formValid.passwordForm" type="submit">{{ $t('modal.changeButton') }}</v-btn>
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
    return {
      mode: 'email',
      overlay: false,
      password: '',
      newPassword: '',
      email: '',
      login: '',
      error: '',
      validators,
      formValid: {
        emailForm: false,
        passwordForm: false,
        loginForm: false,
      },
    };
  },
  mounted() {
    eventBus.on('openCredentialsModal', (type) => {
      this.displayModal();
      this.mode = type;
    });
  },
  watch: {
    mode() {
      this.error = '';
    },
  },
  methods: {
    async updateFormValidity(type: 'emailForm' | 'passwordForm' | 'loginForm') {
      this.error = '';

      const requiredFields = {
        emailForm: ['password', 'email'],
        loginForm: ['password', 'login'],
        passwordForm: ['password', 'newPassword'],
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
    async updatePassword() {
      const result = await this.$store.dispatch('updateUserPassword', {
        password: this.password,
        newPassword: this.newPassword,
      });

      if (result === true) {
        this.closeModal();
      } else {
        this.error = result.error;
      }
    },
    async updateEmail() {
      const result = await this.$store.dispatch('updateUserEmail', { email: this.email, password: this.password });

      if (result === true) {
        this.closeModal();
      } else {
        this.error = result.error;
      }
    },
    async updateLogin() {
      const result = await this.$store.dispatch('updateUserLogin', { login: this.login, password: this.password });

      if (result === true) {
        this.closeModal();
      } else {
        this.error = result.error;
      }
    },
    closeModal() {
      this.overlay = false;
    },
    displayModal() {
      this.overlay = true;
    },
  },
});
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
}

.modal-header {
  text-align: center;
}
</style>
