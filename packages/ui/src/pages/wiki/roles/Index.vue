<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>{{ $t('wiki.rolesTitle') }}</h1>
    <div>
      {{ $t('wiki.rolesInfo') }}
    </div>
    <nav class="wiki-nav" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'rules' }">{{ $t('wiki.rules') }}</LocaleLink>
      <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.roles') }}</LocaleLink>
      <LocaleLink :to="{ name: 'expansions' }">{{ $t('wiki.addons') }}</LocaleLink>
    </nav>
    <div class="roles-container">
      <LocaleLink class="role" :to="{ name: 'merlin' }">
        <h2>{{ $t('roles.merlin') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('merlin')"
          :alt="$t('roles.merlin')"
          :description="$t('roles.merlin')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'merlin_pure' }">
        <h2>{{ $t('roles.merlinPure') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('merlinPure')"
          :alt="$t('roles.merlinPure')"
          :description="$t('roles.merlinPure')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'guinevere' }">
        <h2>{{ $t('roles.guinevere') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('guinevere')"
          :alt="$t('roles.guinevere')"
          :description="$t('roles.guinevere')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'percival' }">
        <h2>{{ $t('roles.percival') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('percival')"
          :alt="$t('roles.percival')"
          :description="$t('roles.percival')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lovers' }">
        <h2>{{ $t('roles.tristan') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('tristan')"
          :alt="$t('roles.tristan')"
          :description="$t('roles.tristan')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lovers' }">
        <h2>{{ $t('roles.isolde') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('isolde')"
          :alt="$t('roles.isolde')"
          :description="$t('roles.isolde')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'cleric' }">
        <h2>{{ $t('roles.cleric') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('cleric')"
          :alt="$t('roles.cleric')"
          :description="$t('roles.cleric')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'troublemaker' }">
        <h2>{{ $t('roles.troublemaker') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('troublemaker')"
          :alt="$t('roles.troublemaker')"
          :description="$t('roles.troublemaker')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'servant' }">
        <h2>{{ $t('roles.servant') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('servant')"
          :alt="$t('roles.servant')"
          :description="$t('roles.servant')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lancelots' }">
        <h2>{{ $t('roles.goodLancelot') }}</h2>
        <SchemaImage
          class="role-image"
          :src="calculateRoleUrl('goodLancelot')"
          :alt="$t('roles.goodLancelot')"
          :description="$t('roles.goodLancelot')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lancelots' }">
        <h2>{{ $t('roles.evilLancelot') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('evilLancelot')"
          :alt="$t('roles.evilLancelot')"
          :description="$t('roles.evilLancelot')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'mordred' }">
        <h2>{{ $t('roles.mordred') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('mordred')"
          :alt="$t('roles.mordred')"
          :description="$t('roles.mordred')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'morgana' }">
        <h2>{{ $t('roles.morgana') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('morgana')"
          :alt="$t('roles.morgana')"
          :description="$t('roles.morgana')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'oberon' }">
        <h2>{{ $t('roles.oberon') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('oberon')"
          :alt="$t('roles.oberon')"
          :description="$t('roles.oberon')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'trickster' }">
        <h2>{{ $t('roles.trickster') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('trickster')"
          :alt="$t('roles.trickster')"
          :description="$t('roles.trickster')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'witch' }">
        <h2>{{ $t('roles.witch') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('witch')"
          :alt="$t('roles.witch')"
          :description="$t('roles.witch')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'revealer' }">
        <h2>{{ $t('roles.revealer') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('revealer')"
          :alt="$t('roles.revealer')"
          :description="$t('roles.revealer')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lunatic' }">
        <h2>{{ $t('roles.lunatic') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('lunatic')"
          :alt="$t('roles.lunatic')"
          :description="$t('roles.lunatic')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'brute' }">
        <h2>{{ $t('roles.brute') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('brute')"
          :alt="$t('roles.brute')"
          :description="$t('roles.brute')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'minion' }">
        <h2>{{ $t('roles.minion') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          :src="calculateRoleUrl('minion')"
          :alt="$t('roles.minion')"
          :description="$t('roles.minion')"
        />
      </LocaleLink>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    SchemaImage,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';

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
  aspect-ratio: 1;
  overflow: hidden;

  :deep(.image-content) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
}

.evil-role {
  border: 2px solid rgb(var(--v-theme-error));
}
</style>
