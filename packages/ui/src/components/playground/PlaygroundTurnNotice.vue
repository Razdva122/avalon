<template>
  <div class="playground-turn-notice" role="alert">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" />
    </svg>
    <strong>{{ $t('menu.playgroundTurnTitle') }}</strong>
    <button type="button" class="playground-turn-return" @click="emit('return')">
      {{ $t('menu.playgroundReturn') }}
    </button>
  </div>
</template>
<script setup lang="ts">
const emit = defineEmits<{ (event: 'return'): void }>();
</script>
<style scoped>
.playground-turn-notice {
  --notice-surface: #fff2cd;
  --notice-border: #bf903a;
  --notice-ink: #5b3b0e;
  --notice-button: #75501d;
  --notice-button-ink: #fff6df;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-height: 54px;
  padding: 4px 8px;
  border: 1px solid var(--notice-border);
  border-radius: 12px;
  background: var(--notice-surface);
  color: var(--notice-ink);
  box-shadow: inset 3px 0 0 var(--notice-border);
}
.playground-turn-notice svg {
  width: 18px;
  height: 18px;
}
.playground-turn-notice strong {
  font-size: 13px;
  line-height: 1.3;
  font-weight: 750;
  overflow-wrap: anywhere;
}
.playground-turn-return {
  min-height: 44px;
  padding: 7px;
  border-radius: 8px;
  background: var(--notice-button);
  color: var(--notice-button-ink);
  font-size: 11px;
  line-height: 1.3;
  font-weight: 700;
  touch-action: manipulation;
}
.playground-turn-return:focus-visible {
  outline: 2px solid var(--notice-ink);
  outline-offset: 2px;
}
@media (hover: hover) and (pointer: fine) {
  .playground-turn-return:hover {
    box-shadow: inset 0 0 0 2px var(--notice-border);
  }
}
:global(.v-theme--darkTheme .playground-turn-notice) {
  --notice-surface: #3c321f;
  --notice-border: #b48e43;
  --notice-ink: #ffe2a3;
  --notice-button: #e5c17a;
  --notice-button-ink: #33240f;
}
</style>
