<template>
  <v-overlay :model-value="overlay" :persistent="!isUserExist" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <v-form @submit.prevent="updateUser" class="d-flex flex-column align-center justify-center">
          <span class="mb-2">Select your username for game</span>
          <v-text-field v-model="username" :rules="rules" label="Username" class="w-100 mb-2"></v-text-field>
          <v-btn type="submit">{{ isUserExist ? 'Update' : 'Submit' }}</v-btn>
        </v-form>
      </v-sheet>
      <v-btn v-if="isUserExist" @click="closeSettings" class="close" icon="close" variant="text" density="compact" />
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  data() {
    const { user } = this.$store.state;

    return {
      overlay: !user,
      username: user?.name || '',
      isUserExist: Boolean(user),
      rules: [
        (value: string | undefined) => {
          if (value) return true;

          return 'You must enter a username.';
        },
      ],
    };
  },
  methods: {
    updateUser() {
      if (this.isUserExist) {
        this.$store.commit('updateUserName', this.username);
      } else {
        this.$store.commit('setUserData', { id: uuidv4(), name: this.username });
      }

      document.location.reload();
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
