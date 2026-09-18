<template>
  <svg class="network-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
    <template v-if="network === 'btc'">
      <circle cx="16" cy="16" r="16" fill="#f7931a" />
      <text
        x="16"
        y="24"
        text-anchor="middle"
        fill="white"
        font-size="25"
        font-weight="bold"
        font-family="Arial, sans-serif"
        transform="rotate(12 16 16)"
      >
        ₿
      </text>
    </template>
    <template v-else-if="network === 'tron'">
      <circle cx="16" cy="16" r="16" fill="#ef0027" />
      <path
        d="M8 7 25 11 15 27Zm0 0 9 9 8-5M17 16l-2 11"
        fill="none"
        stroke="white"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </template>
    <template v-else-if="network === 'eth'">
      <circle cx="16" cy="16" r="16" fill="#627eea" />
      <path d="m16 4-7 12 7 4 7-4Z" fill="white" />
      <path d="m16 4 7 12-7 4Z" fill="#c0cbff" />
      <path d="m9 18 7 10 7-10-7 4Z" fill="white" />
      <path d="m16 22 7-4-7 10Z" fill="#c0cbff" />
    </template>
    <template v-else-if="network === 'bsc'">
      <circle cx="16" cy="16" r="16" fill="#f0b90b" />
      <path
        d="m16 5 6 6-3 3-3-3-3 3-3-3Zm-8 8 3 3-3 3-3-3Zm16 0 3 3-3 3-3-3Zm-8 0 3 3-3 3-3-3Zm-3 5 3 3 3-3 3 3-6 6-6-6Z"
        fill="#171a1f"
      />
    </template>
  </svg>
</template>
<script setup lang="ts">
defineProps<{ network: string }>();
</script>
<style scoped>
.network-icon {
  flex-shrink: 0;
}
</style>
