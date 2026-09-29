<template>
  <div class="language-links language-view" :aria-label="$t('profile.language')">
    <template v-for="language in languages" :key="language.code">
      <button
        v-if="neutral"
        type="button"
        :lang="language.code"
        :aria-pressed="currentLanguage === language.code"
        @click="$emit('select', language.code)"
      >
        {{ language.title }}<span v-if="currentLanguage === language.code" aria-hidden="true">✓</span>
      </button>
      <router-link
        v-else
        :to="{ path: language.path, query: $route.query, hash: $route.hash }"
        :hreflang="language.code"
        :lang="language.code"
        :class="{ selected: currentLanguage === language.code }"
        :aria-current="currentLanguage === language.code ? 'true' : undefined"
        @click="$emit('remember', $event, language.code)"
        >{{ language.title }}<span v-if="currentLanguage === language.code" aria-hidden="true">✓</span></router-link
      >
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { LanguageMap } from '@/helpers/i18n';
import { localizedPath } from '@/router/paths';
const route = useRoute();
const languages = computed(() =>
  Object.entries(LanguageMap).map(([code, title]) => ({ code, title, path: localizedPath(route.path, code) })),
);
defineProps<{
  currentLanguage: string;
  neutral: boolean;
}>();
defineEmits<{ (e: 'select', language: string): void; (e: 'remember', event: MouseEvent, language: string): void }>();
</script>
<style scoped lang="scss">
.language-links {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  padding: 12px 16px 20px;
  overflow-y: auto;
  a,
  button {
    min-height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    font-size: 15px;
    text-decoration: none;
    color: inherit;
  }
  a:hover,
  button:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
  .selected,
  [aria-pressed='true'] {
    background: rgb(var(--v-theme-support-button));
    color: rgb(var(--v-theme-support-accent));
  }
}
</style>
