<template>
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>
<script setup lang="ts">
const paths = {
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v3 M5 13H3v7h4v-7H5 M19 13h2v7h-4v-7h2',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5 M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',
  micOff: 'M3 3l18 18 M9 9v3a3 3 0 0 0 5 2 M9 5a3 3 0 0 1 6 0v4 M5 10v2a7 7 0 0 0 12 5 M19 10v2 M12 19v3 M8 22h8',
  micSpeaking: 'M8 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5 M4 10v2a7 7 0 0 0 14 0v-2 M11 19v3 M7 22h8 M20 6q3 4 0 8',
  micLocalOff:
    'M5 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5 M2 10v1a6 6 0 0 0 10 4 M8 17v4 M4 21h6 M23 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M16 17h4',
  voiceOffline: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5 M5 10v2a7 7 0 0 0 7 7 M12 19v3 M8 22h5 M17 18l5 5 M22 18l-5 5',
  voiceUnknown:
    'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5 M5 10v2a7 7 0 0 0 7 7 M12 19v3 M8 22h5 M17 16a2 2 0 1 1 3 2c-1 0-1 1-1 2 M19 23h.01',
  volume: 'M11 4 6 8H2v8h4l5 4V4 M15 8a6 6 0 0 1 0 8 M18 5a10 10 0 0 1 0 14',
  volumeOff: 'M11 4 6 8H2v8h4l5 4V4 M16 9l6 6 M22 9l-6 6',
  close: 'M6 6l12 12 M18 6 6 18',
  chevronUp: 'm6 14 6-6 6 6',
  chevronDown: 'm6 10 6 6 6-6',
  settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  leave: 'M9 3H4v18h5 M13 7l5 5-5 5 M8 12h13',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 11v6 M12 7h.01',
};
defineProps<{ name: keyof typeof paths }>();
</script>
