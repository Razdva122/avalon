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
          role="merlin"
          :src="calculateRoleUrl('merlin')"
          :alt="$t('roles.merlin')"
          :description="$t('roles.merlin')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'merlin_pure' }">
        <h2>{{ $t('roles.merlinPure') }}</h2>
        <SchemaImage
          class="role-image"
          role="merlinPure"
          :src="calculateRoleUrl('merlinPure')"
          :alt="$t('roles.merlinPure')"
          :description="$t('roles.merlinPure')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'guinevere' }">
        <h2>{{ $t('roles.guinevere') }}</h2>
        <SchemaImage
          class="role-image"
          role="guinevere"
          :src="calculateRoleUrl('guinevere')"
          :alt="$t('roles.guinevere')"
          :description="$t('roles.guinevere')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'percival' }">
        <h2>{{ $t('roles.percival') }}</h2>
        <SchemaImage
          class="role-image"
          role="percival"
          :src="calculateRoleUrl('percival')"
          :alt="$t('roles.percival')"
          :description="$t('roles.percival')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lovers' }">
        <h2>{{ $t('roles.tristan') }}</h2>
        <SchemaImage
          class="role-image"
          role="tristan"
          :src="calculateRoleUrl('tristan')"
          :alt="$t('roles.tristan')"
          :description="$t('roles.tristan')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lovers' }">
        <h2>{{ $t('roles.isolde') }}</h2>
        <SchemaImage
          class="role-image"
          role="isolde"
          :src="calculateRoleUrl('isolde')"
          :alt="$t('roles.isolde')"
          :description="$t('roles.isolde')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'cleric' }">
        <h2>{{ $t('roles.cleric') }}</h2>
        <SchemaImage
          class="role-image"
          role="cleric"
          :src="calculateRoleUrl('cleric')"
          :alt="$t('roles.cleric')"
          :description="$t('roles.cleric')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'troublemaker' }">
        <h2>{{ $t('roles.troublemaker') }}</h2>
        <SchemaImage
          class="role-image"
          role="troublemaker"
          :src="calculateRoleUrl('troublemaker')"
          :alt="$t('roles.troublemaker')"
          :description="$t('roles.troublemaker')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'servant' }">
        <h2>{{ $t('roles.servant') }}</h2>
        <SchemaImage
          class="role-image"
          role="servant"
          :src="calculateRoleUrl('servant')"
          :alt="$t('roles.servant')"
          :description="$t('roles.servant')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lancelots' }">
        <h2>{{ $t('roles.goodLancelot') }}</h2>
        <SchemaImage
          class="role-image"
          role="goodLancelot"
          :src="calculateRoleUrl('goodLancelot')"
          :alt="$t('roles.goodLancelot')"
          :description="$t('roles.goodLancelot')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lancelots' }">
        <h2>{{ $t('roles.evilLancelot') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="evilLancelot"
          :src="calculateRoleUrl('evilLancelot')"
          :alt="$t('roles.evilLancelot')"
          :description="$t('roles.evilLancelot')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'mordred' }">
        <h2>{{ $t('roles.mordred') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="mordred"
          :src="calculateRoleUrl('mordred')"
          :alt="$t('roles.mordred')"
          :description="$t('roles.mordred')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'morgana' }">
        <h2>{{ $t('roles.morgana') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="morgana"
          :src="calculateRoleUrl('morgana')"
          :alt="$t('roles.morgana')"
          :description="$t('roles.morgana')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'oberon' }">
        <h2>{{ $t('roles.oberon') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="oberon"
          :src="calculateRoleUrl('oberon')"
          :alt="$t('roles.oberon')"
          :description="$t('roles.oberon')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'trickster' }">
        <h2>{{ $t('roles.trickster') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="trickster"
          :src="calculateRoleUrl('trickster')"
          :alt="$t('roles.trickster')"
          :description="$t('roles.trickster')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'witch' }">
        <h2>{{ $t('roles.witch') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="witch"
          :src="calculateRoleUrl('witch')"
          :alt="$t('roles.witch')"
          :description="$t('roles.witch')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'revealer' }">
        <h2>{{ $t('roles.revealer') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="revealer"
          :src="calculateRoleUrl('revealer')"
          :alt="$t('roles.revealer')"
          :description="$t('roles.revealer')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'lunatic' }">
        <h2>{{ $t('roles.lunatic') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="lunatic"
          :src="calculateRoleUrl('lunatic')"
          :alt="$t('roles.lunatic')"
          :description="$t('roles.lunatic')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'brute' }">
        <h2>{{ $t('roles.brute') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="brute"
          :src="calculateRoleUrl('brute')"
          :alt="$t('roles.brute')"
          :description="$t('roles.brute')"
        />
      </LocaleLink>
      <LocaleLink class="role" :to="{ name: 'minion' }">
        <h2>{{ $t('roles.minion') }}</h2>
        <SchemaImage
          class="role-image evil-role"
          role="minion"
          :src="calculateRoleUrl('minion')"
          :alt="$t('roles.minion')"
          :description="$t('roles.minion')"
        />
      </LocaleLink>
    </div>
    <WikiPlayCta />
  </div>
</template>

<script lang="ts">
import WikiPlayCta from '@/components/view/information/WikiPlayCta.vue';
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiPlayCta,
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
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0 40px;
}
.roles-container .role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 18px 12px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  color: inherit;
  h2 {
    font-size: 16px;
    text-align: center;
    margin: 0;
    min-height: 44px;
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
  }
  &:hover {
    border-color: rgb(var(--v-theme-support-accent));
    background: rgba(var(--v-theme-support-accent), 0.05);
  }
}
.role-image {
  width: min(100%, 132px);
  border: 2px solid rgb(var(--v-theme-info));
  border-radius: 12px;
  aspect-ratio: 1;
  overflow: hidden;
}
.evil-role {
  border-color: rgb(var(--v-theme-error));
}
@media (max-width: 900px) {
  .roles-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 650px) {
  .roles-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .roles-container .role {
    padding: 14px 8px;
  }
}
@media (max-width: 430px) {
  .roles-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
