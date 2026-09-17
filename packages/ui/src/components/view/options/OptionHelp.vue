<template>
  <v-menu :close-on-content-click="false" location="bottom" max-width="320">
    <template #activator="{ props }">
      <button
        v-bind="props"
        type="button"
        class="help-trigger"
        :aria-label="`${label}: ${$t('options.details')}`"
        :title="`${label}: ${$t('options.details')}`"
      >
        <slot><span class="material-icons" aria-hidden="true">info_outline</span></slot>
      </button>
    </template>
    <v-card class="option-help">
      <h3>{{ label }}</h3>
      <p v-if="hint" class="help-requirement">{{ hint }}</p>
      <p>{{ content }}</p>
      <LocaleLink v-if="route" :to="{ name: route }" target="_blank" rel="noopener noreferrer">
        {{ $t('options.fullRules') }}
        <span class="material-icons" aria-hidden="true">open_in_new</span>
        <span class="sr-only">{{ $t('options.newTab') }}</span>
      </LocaleLink>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
defineProps<{ label: string; content: string; route?: string; hint?: string }>();
</script>

<style scoped lang="scss">
.help-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  color: inherit;
  border-radius: 5px;
  cursor: pointer;
}
.help-trigger:hover {
  background: rgba(var(--v-theme-text-primary), 0.08);
}
.help-trigger:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
.help-trigger > .material-icons {
  font-size: 18px;
}
.option-help {
  padding: 16px;
  color: rgb(var(--v-theme-text-primary));
  font-size: 14px;
  line-height: 1.5;
}
.option-help h3 {
  font-size: 16px;
  line-height: 1.4;
  margin: 0 0 8px;
}
.option-help p {
  margin: 0 0 8px;
}
.help-requirement {
  font-weight: 600;
}
.option-help a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  color: inherit;
  text-decoration: underline;
}
.option-help a .material-icons {
  font-size: 16px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
