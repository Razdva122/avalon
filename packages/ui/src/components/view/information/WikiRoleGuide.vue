<template>
  <div class="role-guide">
    <div class="role-overview">
      <SchemaImage
        class="role-portrait"
        :src="calculateRoleUrl(role)"
        :alt="$t(`roles.${role}`)"
        :description="$t(`roles.${role}`)"
      />
      <section class="wiki-panel">
        <h2>{{ $t('wiki.roleFacts') }}</h2>
        <dl>
          <div v-for="fact in facts" :key="fact.key" class="role-fact">
            <dt>{{ $t(`wiki.${fact.label}`) }}</dt>
            <dd><LocalizedTextWrapper :keypath="`${role}.${fact.key}`" /></dd>
          </div>
        </dl>
        <nav class="wiki-nav" :aria-label="$t('wiki.title')">
          <LocaleLink :to="{ name: 'rules' }">{{ $t('wiki.rules') }}</LocaleLink>
          <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.rolesTitle') }}</LocaleLink>
        </nav>
      </section>
    </div>
    <section class="role-scenarios">
      <h2>{{ $t('wiki.roleScenarios') }}</h2>
      <ul>
        <li v-for="number in 2" :key="number"><LocalizedTextWrapper :keypath="`${role}.seoScenario${number}`" /></li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import { calculateRoleUrl } from '@/helpers/styles';
defineProps({ role: { type: String as PropType<'percival' | 'mordred' | 'morgana' | 'oberon'>, required: true } });
const facts = [
  { label: 'roleTeam', key: 'seoTeam' },
  { label: 'roleAbility', key: 'seoAbility' },
  { label: 'roleLimit', key: 'seoLimit' },
];
</script>

<style scoped lang="scss">
.role-overview {
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  margin: 28px 0 36px;
}
.role-portrait {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 1;
}
.wiki-panel {
  padding: 24px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}
h2 {
  font-size: 27px;
  line-height: 1.35;
  margin: 0 0 16px;
}
dt {
  font-weight: 700;
  margin-top: 12px;
}
dd {
  margin: 4px 0 16px;
}
.role-fact + .role-fact {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 10px;
}
.wiki-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.wiki-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}
a:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}
a:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}
.role-scenarios {
  margin-bottom: 32px;
}
.role-scenarios ul {
  padding-inline-start: 24px;
}
.role-scenarios li {
  margin-bottom: 14px;
}
@media (max-width: 700px) {
  .role-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .role-portrait {
    width: 140px;
    justify-self: center;
  }
  .wiki-panel {
    padding: 18px;
  }
  h2 {
    font-size: 23px;
  }
}
</style>
