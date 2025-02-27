<template>
  <v-menu :eager="true">
    <template v-slot:activator="{ props }">
      <v-btn color="white" size="large" variant="plain" v-bind="props">
        <template v-slot:append>
          <span class="material-icons"> menu </span>
        </template>
        {{ $t('menu.menu') }}
      </v-btn>
    </template>
    <nav>
      <router-link to="/">{{ $t('menu.home') }}</router-link>
      <div @click="$emit('profileClick')">{{ $t('menu.profile') }}</div>
      <router-link :to="{ name: 'wiki' }">{{ $t('menu.wiki') }}</router-link>
      <router-link :to="{ name: 'stats' }">{{ $t('menu.stats') }}</router-link>
      <router-link :to="{ name: 'about' }">{{ $t('menu.about') }}</router-link>
    </nav>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped lang="scss">
nav {
  background-color: rgb(var(--v-theme-bgHeader));
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
