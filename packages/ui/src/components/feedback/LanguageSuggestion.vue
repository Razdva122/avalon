<template>
  <aside v-if="visible" class="language-suggestion" :lang="preferred" :aria-label="copy.message">
    <span>{{ copy.message }}</span>
    <RouterLink :to="target" @click="accept">{{ copy.action }}</RouterLink>
    <button type="button" @click="dismiss">{{ copy.dismiss }}</button>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { languageSuggestions } from '@/i18n/suggestions';
import { useStore } from '@/store';
import { preferredLanguage } from '@/helpers/i18n/policy';
import { rememberLanguage } from '@/helpers/i18n/preference';
import { localizedPath } from '@/router/paths';

const route = useRoute();
const store = useStore();
const ready = ref(false);
const dismissed = ref<string[]>([]);
const storageKey = '__language-suggestion-dismissed__';
const preferred = computed(() => preferredLanguage(store.state.settings, navigator.languages));
const pair = computed(() => `${route.meta.lang}:${preferred.value}`);
const visible = computed(
  () =>
    ready.value &&
    route.meta.lang &&
    !route.meta.skipSiteMap &&
    route.meta.lang !== preferred.value &&
    !dismissed.value.includes(pair.value),
);
const target = computed(() => ({
  path: localizedPath(route.path, preferred.value),
  query: route.query,
  hash: route.hash,
}));
const copy = computed(() => languageSuggestions[preferred.value]);

onMounted(() => {
  // Never bake a build machine's browser-language suggestion into public HTML.
  if ('__AVALON_PRERENDER__' in window) return;
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (Array.isArray(value)) dismissed.value = value.filter((item) => typeof item === 'string');
  } catch {
    /* Session storage may be disabled. Dismissal still works in memory. */
  }
  ready.value = true;
});

function accept(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    rememberLanguage(preferred.value);
  }
}

function dismiss() {
  dismissed.value.push(pair.value);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(dismissed.value));
  } catch {
    /* Optional persistence. */
  }
}
</script>

<style scoped lang="scss">
.language-suggestion {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  width: max-content;
  max-width: calc(100vw - 24px);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  font-size: 15px;
  a {
    text-decoration: underline;
    font-weight: 600;
  }
  button {
    padding: 4px 8px;
    text-decoration: underline;
  }
}
</style>
