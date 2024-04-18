<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Roles</h1>
    <div class="roles-container">
      <router-link class="role" :to="{ name: 'merlin' }">
        <h2>Merlin</h2>
        <img class="role-image" :src="calculateRoleUrl('merlin')" alt="merlin" />
      </router-link>
      <router-link class="role" :to="{ name: 'merlin_pure' }">
        <h2>Merlin Pure</h2>
        <img class="role-image" :src="calculateRoleUrl('merlinPure')" alt="merlin pure" />
      </router-link>
      <router-link class="role" :to="{ name: 'guinevere' }">
        <h2>Guinevere</h2>
        <img class="role-image" :src="calculateRoleUrl('guinevere')" alt="guinevere" />
      </router-link>
      <router-link class="role" :to="{ name: 'percival' }">
        <h2>Percival</h2>
        <img class="role-image" :src="calculateRoleUrl('percival')" alt="percival" />
      </router-link>
      <router-link class="role" :to="{ name: 'lovers' }">
        <h2>Tristan</h2>
        <img class="role-image" :src="calculateRoleUrl('tristan')" alt="tristan" />
      </router-link>
      <router-link class="role" :to="{ name: 'lovers' }">
        <h2>Isolde</h2>
        <img class="role-image" :src="calculateRoleUrl('isolde')" alt="isolde" />
      </router-link>
      <router-link class="role" :to="{ name: 'troublemaker' }">
        <h2>Troublemaker</h2>
        <img class="role-image" :src="calculateRoleUrl('troublemaker')" alt="troublemaker" />
      </router-link>
      <router-link class="role" :to="{ name: 'servant' }">
        <h2>Servant</h2>
        <img class="role-image" :src="calculateRoleUrl('servant')" alt="servant" />
      </router-link>
      <router-link class="role" :to="{ name: 'lancelots' }">
        <h2>Good Lancelot</h2>
        <img class="role-image" :src="calculateRoleUrl('goodLancelot')" alt="good lancelot" />
      </router-link>
      <router-link class="role" :to="{ name: 'lancelots' }">
        <h2>Evil Lancelot</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('evilLancelot')" alt="evil lancelot" />
      </router-link>
      <router-link class="role" :to="{ name: 'mordred' }">
        <h2>Mordred</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('mordred')" alt="mordred" />
      </router-link>
      <router-link class="role" :to="{ name: 'trickster' }">
        <h2>Trickster</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('trickster')" alt="trickster" />
      </router-link>
      <router-link class="role" :to="{ name: 'morgana' }">
        <h2>Morgana</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('morgana')" alt="morgana" />
      </router-link>
      <router-link class="role" :to="{ name: 'oberon' }">
        <h2>Oberon</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('oberon')" alt="oberon" />
      </router-link>
      <router-link class="role" :to="{ name: 'minion' }">
        <h2>Minion</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('minion')" alt="minion" />
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
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
    @include text-overflow(1);
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
