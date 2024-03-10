<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Roles</h1>
    <div class="roles-container">
      <a class="role" @click="$router.push({ name: 'merlin' })">
        <h2>Merlin</h2>
        <img class="role-image" src="@/assets/roles/merlin.png" alt="merlin" />
      </a>
      <a class="role" @click="$router.push({ name: 'percival' })">
        <h2>Percival</h2>
        <img class="role-image" src="@/assets/roles/percival.png" alt="percival" />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.roles-container {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  h2 {
    text-align: center;
  }
}

.role {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 210px;
  max-width: 40%;
}

.role-image {
  width: 67%;
  border: 2px solid rgb(var(--v-theme-info));
}
</style>
