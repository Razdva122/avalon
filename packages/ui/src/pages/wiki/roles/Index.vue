<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Roles</h1>
    <div class="roles-container">
      <router-link class="role" :to="{ name: 'merlin' }">
        <h2>Merlin</h2>
        <img class="role-image" src="@/assets/roles/merlin.webp" alt="merlin" />
      </router-link>
      <router-link class="role" :to="{ name: 'merlin_pure' }">
        <h2>Merlin Pure</h2>
        <img class="role-image" src="@/assets/roles/merlin_pure.webp" alt="merlin pure" />
      </router-link>
      <router-link class="role" :to="{ name: 'percival' }">
        <h2>Percival</h2>
        <img class="role-image" src="@/assets/roles/percival.webp" alt="percival" />
      </router-link>
      <router-link class="role" :to="{ name: 'lovers' }">
        <h2>Tristan</h2>
        <img class="role-image" src="@/assets/roles/tristan.webp" alt="tristan" />
      </router-link>
      <router-link class="role" :to="{ name: 'lovers' }">
        <h2>Isolde</h2>
        <img class="role-image" src="@/assets/roles/isolde.webp" alt="isolde" />
      </router-link>
      <router-link class="role" :to="{ name: 'servant' }">
        <h2>Servant</h2>
        <img class="role-image" src="@/assets/roles/servant.webp" alt="servant" />
      </router-link>
      <router-link class="role" :to="{ name: 'mordred' }">
        <h2>Mordred</h2>
        <img class="role-image evil-role" src="@/assets/roles/mordred.webp" alt="mordred" />
      </router-link>
      <router-link class="role" :to="{ name: 'morgana' }">
        <h2>Morgana</h2>
        <img class="role-image evil-role" src="@/assets/roles/morgana.webp" alt="morgana" />
      </router-link>
      <router-link class="role" :to="{ name: 'oberon' }">
        <h2>Oberon</h2>
        <img class="role-image evil-role" src="@/assets/roles/oberon.webp" alt="oberon" />
      </router-link>
      <router-link class="role" :to="{ name: 'minion' }">
        <h2>Minion</h2>
        <img class="role-image evil-role" src="@/assets/roles/minion.webp" alt="minion" />
      </router-link>
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

  h2 {
    text-align: center;
  }
}

.role {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 170px;
  max-width: 20%;
}

.role-image {
  width: 67%;
  border: 2px solid rgb(var(--v-theme-info));
}

.evil-role {
  border: 2px solid rgb(var(--v-theme-error));
}
</style>
