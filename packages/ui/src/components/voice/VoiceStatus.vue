<template>
  <span class="voice-status-anchor" :class="{ 'on-table': table }">
    <v-tooltip v-if="interactive" :text="label" location="top" :open-delay="200" open-on-click>
      <template #activator="{ props: tooltip }">
        <button
          v-bind="tooltip"
          type="button"
          class="voice-status-target"
          :aria-label="accessibleLabel"
          @click.stop
          @pointerdown.stop
          @keydown.stop
        >
          <span class="voice-status-mark" :class="`is-${status}`"><VoiceIcon :name="icon" /></span>
        </button>
      </template>
    </v-tooltip>
    <span
      v-else
      class="voice-status-mark"
      :class="`is-${status}`"
      role="img"
      :aria-label="accessibleLabel"
      :title="label"
    >
      <VoiceIcon :name="icon" />
    </span>
  </span>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VoiceUserStatus } from '@/helpers/composables/useRoomVoice';
import VoiceIcon from './VoiceIcon.vue';
const props = defineProps<{
  status: VoiceUserStatus;
  name?: string;
  own?: boolean;
  interactive?: boolean;
  table?: boolean;
}>();
const { t } = useI18n();
const label = computed(() =>
  t(props.own && props.status === 'selfMuted' ? 'voice.statusSelfMutedOwn' : `voice.status_${props.status}`),
);
const accessibleLabel = computed(() => (props.name ? `${props.name}: ${label.value}` : label.value));
const icon = computed(
  () =>
    (
      ({
        speaking: 'micSpeaking',
        ready: 'mic',
        selfMuted: 'micOff',
        localMuted: 'micLocalOff',
        offline: 'voiceOffline',
        unknown: 'voiceUnknown',
      }) as const
    )[props.status],
);
</script>
<style scoped lang="scss">
.voice-status-anchor {
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}
.voice-status-target {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  padding: 0;
  border-radius: 50%;
  background: transparent;
  cursor: help;
}
.voice-status-target:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}
.voice-status-mark {
  display: inline-grid;
  place-items: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-inset));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.3);
  box-shadow: 0 2px 5px #0003;
  transition:
    color 140ms ease,
    background-color 140ms ease,
    box-shadow 140ms ease;
}
.is-speaking {
  color: #fff;
  background: #14734e;
  border-color: #62dca4;
  box-shadow: 0 0 0 3px #33c98733;
}
.is-selfMuted {
  color: #a32439;
  background: #fff0f2;
  border-color: #d9919c;
}
.is-localMuted {
  color: #854500;
  background: #fff1d6;
  border-color: #d4a85c;
}
.is-offline,
.is-unknown {
  color: rgb(var(--v-theme-text-primary));
  border-style: dashed;
  box-shadow: none;
}
:global(.v-theme--dark .voice-status-anchor:not(.on-table) .voice-status-mark.is-selfMuted) {
  color: #ffc3cd;
  background: #512732;
  border-color: #b97081;
}
:global(.v-theme--dark .voice-status-anchor:not(.on-table) .voice-status-mark.is-localMuted) {
  color: #ffd48e;
  background: #493715;
  border-color: #bc9857;
}
/* Counter the board's transform, so badges remain readable at every seat count. */
.on-table {
  --voice-scale: var(--board-scale, 1);
}
.on-table .voice-status-target {
  width: calc(44px / var(--voice-scale));
  height: calc(44px / var(--voice-scale));
}
.on-table .voice-status-mark {
  width: calc(24px / var(--voice-scale));
  height: calc(24px / var(--voice-scale));
  flex-basis: calc(24px / var(--voice-scale));
  border-width: calc(1px / var(--voice-scale));
  background: #243033;
  color: #e1e7e8;
  border-color: #819091;
  box-shadow: none;
}
.on-table .voice-status-mark :deep(svg) {
  width: calc(16px / var(--voice-scale));
  height: calc(16px / var(--voice-scale));
}
.on-table .is-speaking {
  background: #166349;
  color: #fff;
  border-color: #7be3ae;
  box-shadow: 0 0 0 calc(2px / var(--voice-scale)) #38bd8233;
}
.on-table .is-selfMuted {
  color: #ffb8c2;
  border-color: #aa717c;
}
.on-table .is-localMuted {
  color: #ffdb9e;
  border-color: #b99a68;
}
.on-table .is-offline,
.on-table .is-unknown {
  color: #aebabb;
  border-color: #728183;
}
@media (max-width: 359px) {
  .on-table .voice-status-target {
    width: calc(32px / var(--voice-scale));
    height: calc(32px / var(--voice-scale));
  }
}
@media (prefers-reduced-motion: reduce) {
  .voice-status-mark {
    transition: none;
  }
}
</style>
