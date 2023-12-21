<template>
  <nav>
    <router-link to="/">Lobby</router-link>
  </nav>
  <router-view />
  <registration v-if="!isUserExist" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Registration from '@/components/Registration.vue';

export default defineComponent({
  components: {
    Registration,
  },
  computed: {
    isUserExist() {
      return this.$store.state.user;
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
