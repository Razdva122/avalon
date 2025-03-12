<template>
  <v-overlay v-model="overlay" :persistent="true" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <div v-if="error" class="error-message mb-2 ml-2">
          {{ $t('errors.' + error) }}
        </div>
        <v-form
          ref="emailForm"
          @input="updateFormValidity('emailForm')"
          @submit.prevent="updateEmail"
          class="form"
          v-if="mode === 'email'"
        >
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
          <v-text-field
            v-model="email"
            autocomplete="email"
            :rules="[validators.required, validators.spacesForbidden, validators.email]"
            :label="$t('modal.newEmail')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-btn :disabled="!formValid.emailForm" type="submit">{{ $t('modal.updateButton') }}</v-btn>
        </v-form>
        <v-form
          ref="loginForm"
          @input="updateFormValidity('loginForm')"
          @submit.prevent="updateLogin"
          class="form"
          v-if="mode === 'login'"
        >
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
          <v-text-field
            v-model="login"
            autocomplete="login"
            :rules="[validators.required, validators.spacesForbidden]"
            :label="$t('modal.login')"
            class="w-100 mb-2"
          ></v-text-field>
          <v-btn :disabled="!formValid.emailForm" type="submit">{{ $t('modal.updateButton') }}</v-btn>
        </v-form>
        <v-form
          ref="passwordForm"
          @input="updateFormValidity('passwordForm')"
          @submit.prevent="updatePassword"
          class="form"
          v-else
        >
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
          <v-text-field
            v-model="newPassword"
            autocomplete="new-password"
            :append-inner-icon="visiblePass ? 'visibility_off' : 'visibility'"
            :type="visiblePass ? 'text' : 'password'"
            :rules="[validators.required, validators.min8, validators.spacesForbidden]"
            :label="$t('modal.newPassword')"
            :hint="$t('validators.minCharacters', { count: 8 })"
            class="w-100 mb-2"
            counter
            @click:append-inner="visiblePass = !visiblePass"
          ></v-text-field>
          <v-btn :disabled="!formValid.passwordForm" type="submit">{{ $t('modal.updateButton') }}</v-btn>
        </v-form>
      </v-sheet>
      <v-btn @click="closeModal" class="close" icon="close" variant="text" density="compact" />
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
    return {
      mode: 'email',
      overlay: false,
      visiblePass: false,
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
.close {
  position: absolute;
  top: 4px;
  right: 4px;
}

.form {
  display: flex;
  flex-direction: column;
}

.error-message {
  color: rgb(var(--v-theme-error));
}
</style>
