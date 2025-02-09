<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('wiki.rolesTitle') }}</h1>
    <div>
      {{ $t('wiki.rolesInfo') }}
    </div>
    <div class="roles-container">
      <router-link class="role" :to="{ name: 'merlin' }">
        <h2>{{ $t('roles.merlin') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('merlin')" alt="merlin" />
      </router-link>
      <router-link class="role" :to="{ name: 'merlin_pure' }">
        <h2>{{ $t('roles.merlinPure') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('merlinPure')" alt="merlin pure" />
      </router-link>
      <router-link class="role" :to="{ name: 'guinevere' }">
        <h2>{{ $t('roles.guinevere') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('guinevere')" alt="guinevere" />
      </router-link>
      <router-link class="role" :to="{ name: 'percival' }">
        <h2>{{ $t('roles.percival') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('percival')" alt="percival" />
      </router-link>
      <router-link class="role" :to="{ name: 'lovers' }">
        <h2>{{ $t('roles.tristan') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('tristan')" alt="tristan" />
      </router-link>
      <router-link class="role" :to="{ name: 'lovers' }">
        <h2>{{ $t('roles.isolde') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('isolde')" alt="isolde" />
      </router-link>
      <router-link class="role" :to="{ name: 'cleric' }">
        <h2>{{ $t('roles.cleric') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('cleric')" alt="cleric" />
      </router-link>
      <router-link class="role" :to="{ name: 'troublemaker' }">
        <h2>{{ $t('roles.troublemaker') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('troublemaker')" alt="troublemaker" />
      </router-link>
      <router-link class="role" :to="{ name: 'servant' }">
        <h2>{{ $t('roles.servant') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('servant')" alt="servant" />
      </router-link>
      <router-link class="role" :to="{ name: 'lancelots' }">
        <h2>{{ $t('roles.goodLancelot') }}</h2>
        <img class="role-image" :src="calculateRoleUrl('goodLancelot')" alt="good lancelot" />
      </router-link>
      <router-link class="role" :to="{ name: 'lancelots' }">
        <h2>{{ $t('roles.evilLancelot') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('evilLancelot')" alt="evil lancelot" />
      </router-link>
      <router-link class="role" :to="{ name: 'mordred' }">
        <h2>{{ $t('roles.mordred') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('mordred')" alt="mordred" />
      </router-link>
      <router-link class="role" :to="{ name: 'trickster' }">
        <h2>{{ $t('roles.trickster') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('trickster')" alt="trickster" />
      </router-link>
      <router-link class="role" :to="{ name: 'morgana' }">
        <h2>{{ $t('roles.morgana') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('morgana')" alt="morgana" />
      </router-link>
      <router-link class="role" :to="{ name: 'oberon' }">
        <h2>{{ $t('roles.oberon') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('oberon')" alt="oberon" />
      </router-link>
      <router-link class="role" :to="{ name: 'witch' }">
        <h2>{{ $t('roles.witch') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('witch')" alt="witch" />
      </router-link>
      <router-link class="role" :to="{ name: 'lunatic' }">
        <h2>{{ $t('roles.lunatic') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('lunatic')" alt="lunatic" />
      </router-link>
      <router-link class="role" :to="{ name: 'brute' }">
        <h2>{{ $t('roles.brute') }}</h2>
        <img class="role-image evil-role" :src="calculateRoleUrl('brute')" alt="brute" />
      </router-link>
      <router-link class="role" :to="{ name: 'minion' }">
        <h2>{{ $t('roles.minion') }}</h2>
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
