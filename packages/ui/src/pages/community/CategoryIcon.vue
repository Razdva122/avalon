<template>
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="type === 'voice'">
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
    </template>
    <template v-else-if="type === 'text'">
      <path d="M21 11a8 8 0 0 1-8 8H7l-5 3 1-6a8 8 0 0 1-1-4V9a7 7 0 0 1 7-7h5a7 7 0 0 1 7 7z" />
      <path d="M7 8h9M7 12h6" />
    </template>
    <template v-else-if="type === 'either'">
      <rect x="3" y="3" width="5" height="10" rx="2.5" />
      <path
        d="M1 10v1a4.5 4.5 0 0 0 9 0v-1M5.5 15.5V20M3 20h5M13 4h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3l-4 3V8M16 8h3M16 11h3"
      />
    </template>
    <path v-else-if="type === 'experienced'" d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    <template v-else><path d="M12 22V12M12 16C5 16 3 12 3 6c6 0 9 3 9 8M12 11c0-6 3-9 9-9 0 6-3 9-9 9" /></template>
  </svg>
</template>
<script setup lang="ts">
defineProps<{ type: 'beginner' | 'experienced' | 'voice' | 'text' | 'either' }>();
</script>
<style scoped>
svg {
  flex-shrink: 0;
}
</style>
