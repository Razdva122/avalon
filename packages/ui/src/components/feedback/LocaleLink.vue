<template>
  <RouterLink :to="localizedTo"><slot /></RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter, RouteLocationRaw } from 'vue-router';
import { localizedPath, basePath, isNeutralPath } from '@/router/paths';

const props = defineProps<{ to: RouteLocationRaw }>();
const router = useRouter();
const { locale } = useI18n();
const localizedTo = computed(() => {
  const resolved = router.resolve(props.to);
  return {
    path: isNeutralPath(resolved.path) ? basePath(resolved.path) : localizedPath(resolved.path, locale.value),
    query: resolved.query,
    hash: resolved.hash,
  };
});
</script>
