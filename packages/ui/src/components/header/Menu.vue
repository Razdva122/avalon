<template>
  <v-menu :eager="true">
    <template v-slot:activator="{ props }">
      <v-btn color="white" size="large" variant="plain" v-bind="props">
        <template v-slot:append>
          <span class="material-icons"> menu </span>
        </template>
        Menu
      </v-btn>
    </template>
    <nav>
      <router-link to="/">Home</router-link>
      <div @click="$emit('profileClick')">Profile</div>
      <router-link :to="{ name: 'wiki' }">Wiki</router-link>
      <router-link :to="{ name: 'about' }">About</router-link>
    </nav>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped lang="scss">
nav {
  background-color: #2c3e50;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  font-size: 20px;
  display: flex;
  align-items: center;
  flex-direction: column;

  * {
    padding: 5px;
    cursor: pointer;
    color: white;
    text-decoration: none;

    &.router-link-exact-active {
      color: skyblue;
    }
  }
}
</style>
