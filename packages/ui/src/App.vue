<template>
  <nav>
    <router-link to="/">Lobby</router-link> |
    <router-link to="/room/1">Room</router-link>
  </nav>
  <router-view />
  <v-overlay v-model="isUserNotExist" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <v-form @submit.prevent="createUser" class="d-flex flex-column align-center justify-center">
          <span class="mb-2">Select your username for game</span>
          <v-text-field v-model="username" :rules="rules" label="Username" class="w-100 mb-2"></v-text-field>
          <v-btn type="submit" rounded="lg" variants="tonal">Submit</v-btn>
        </v-form>
      </v-sheet>
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
  computed: {
    isUserNotExist() {
      return !this.$store.state.user;
    },
  },
  methods: {
    createUser() {
      this.$store.commit('setUserData', { id: crypto.randomUUID(), username: this.username });
    },
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
