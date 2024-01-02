<template>
  <v-overlay :model-value="true" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <v-form @submit.prevent="createUser" class="d-flex flex-column align-center justify-center">
          <span class="mb-2">Select your username for game</span>
          <v-text-field v-model="username" :rules="rules" label="Username" class="w-100 mb-2"></v-text-field>
          <v-btn type="submit">Submit</v-btn>
        </v-form>
      </v-sheet>
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  data() {
    return {
      overlay: true,
      username: '',
      rules: [
        (value: string | undefined) => {
          if (value) return true;

          return 'You must enter a username.';
        },
      ],
    };
  },
  methods: {
    createUser() {
      this.$store.commit('setUserData', { id: uuidv4(), name: this.username });
      document.location.reload();
    },
  },
});
</script>
