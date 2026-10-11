<template>
  <v-btn
    v-if="available || busy || canPlay || accessStatus !== 'ready' || unavailableText"
    class="bot-room-button"
    :class="{ 'bot-room-button--unavailable': !available && !busy && availability !== 'loading' }"
    :color="available || busy || availability === 'loading' ? color || 'secondary' : 'text-secondary'"
    :variant="available || busy || availability === 'loading' ? 'flat' : 'tonal'"
    size="large"
    :elevation="0"
    :loading="busy || availability === 'loading'"
    :disabled="busy || !!disabled || !available || accessStatus !== 'ready'"
    :aria-busy="busy || availability === 'loading'"
    @click="openRoom"
  >
    <v-icon v-if="!hideIcon" icon="fa:fa-solid fa-robot" size="20" class="mr-2" aria-hidden="true" />
    <template v-if="!available && (unavailableText || availability === 'unavailable')">{{ statusText }}</template>
    <slot v-else>{{ $t(ownRoomID ? 'aiArena.botContinue' : 'aiArena.botPlay') }}</slot>
  </v-btn>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { openRoomRoute } from '@/helpers/open-room-route';

const { t, locale } = useI18n();
const props = defineProps<{
  unavailableText?: string;
  busyText?: string;
  loadingText?: string;
  errorText?: string;
  disabled?: boolean;
  color?: string;
  hideIcon?: boolean;
  inlineErrors?: boolean;
}>();
const emit = defineEmits<{
  (event: 'opened'): void;
  (event: 'busy', value: boolean): void;
  (event: 'availability', value: 'available' | 'loading' | 'unavailable' | 'error'): void;
  (event: 'error', message: string): void;
}>();
const router = useRouter();
const { canPlay, botsBusy, accessStatus, botModes, botWaitHours, ownRoomID, refresh } = useAiAccess();
const available = computed(() => canPlay.value && (ownRoomID.value || botModes.value.smart || botModes.value.regular));
const busy = ref(false);
let active = true;
onBeforeUnmount(() => {
  active = false;
});
const availability = computed(() =>
  available.value ? 'available' : accessStatus.value === 'ready' ? 'unavailable' : accessStatus.value,
);
const statusText = computed(() =>
  availability.value === 'loading'
    ? props.loadingText || t('aiArena.botChecking')
    : availability.value === 'error'
      ? props.errorText || t('aiArena.connectionError')
      : botsBusy.value
        ? props.busyText || t('aiArena.botBusy')
        : Object.keys(botWaitHours.value).length
          ? t('aiArena.botAvailableIn', {
              hours: new Intl.NumberFormat(locale.value.replace('_', '-')).format(
                Math.min(...Object.values(botWaitHours.value).filter((hours): hours is number => hours !== undefined)),
              ),
            })
          : props.unavailableText || t('aiArena.botUnavailable'),
);
watch(availability, (value) => emit('availability', value), { immediate: true });

function reportError(key: string) {
  if (!active) return;
  const message = t(key);
  if (props.inlineErrors) emit('error', message);
  else eventBus.emit('infoMessage', message);
}

async function openRoom() {
  if (!active || busy.value || props.disabled || !available.value || accessStatus.value !== 'ready') return;
  busy.value = true;
  emit('busy', true);
  try {
    if (ownRoomID.value) {
      const opened = await openRoomRoute(router, ownRoomID.value, () => active);
      if (opened) emit('opened');
      return;
    }
    const result = await socket.timeout(30000).emitWithAck('createHumanAiRoom');
    if (!active) return;
    if ('error' in result) {
      reportError('aiArena.botPlayError');
      void refresh();
    } else {
      const opened = await openRoomRoute(router, result.roomID, () => active);
      if (opened) emit('opened');
    }
  } catch {
    reportError('aiArena.connectionError');
    if (active) void refresh();
  } finally {
    busy.value = false;
    emit('busy', false);
  }
}
</script>

<style scoped>
.bot-room-button {
  min-height: 44px;
  max-width: 100%;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.bot-room-button--unavailable {
  opacity: 1;
}
</style>
