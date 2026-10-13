<template>
  <v-btn
    class="bot-room-button"
    :color="color || 'secondary'"
    variant="flat"
    size="large"
    :elevation="0"
    :disabled="busy || !!disabled"
    :loading="busy"
    @click="openRoom"
  >
    <v-icon v-if="!hideIcon" icon="smart_toy" size="20" class="mr-2" aria-hidden="true" />
    <slot>{{ $t('aiArena.botPlay') }}</slot>
  </v-btn>
  <BotGameSetup
    v-if="setupOpen"
    v-model="setupOpen"
    :beginner="beginner"
    :with-friend="withFriend"
    @busy="setBusy"
    @opened="$emit('opened')"
  />
</template>
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { openRoomRoute } from '@/helpers/open-room-route';
const BotGameSetup = defineAsyncComponent(() => import(/* webpackChunkName: "bot-game-setup" */ './BotGameSetup.vue'));
const props = defineProps<{
  beginner?: boolean;
  withFriend?: boolean;
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
const { canPlay, accessStatus, botModes, ownRoomID } = useAiAccess();
const busy = ref(false);
const setupOpen = ref(false);
let active = true;
onBeforeUnmount(() => {
  active = false;
});
const availability = computed(() =>
  canPlay.value &&
  (ownRoomID.value ||
    (props.beginner
      ? botModes.value.beginner
      : botModes.value.smart || botModes.value.regular || botModes.value.beginner))
    ? 'available'
    : accessStatus.value === 'ready'
      ? 'unavailable'
      : accessStatus.value,
);
watch(availability, (value) => emit('availability', value), { immediate: true });
function setBusy(value: boolean) {
  busy.value = value;
  emit('busy', value);
}
async function openRoom() {
  if (!active || busy.value || props.disabled) return;
  if (!ownRoomID.value) {
    setupOpen.value = true;
    return;
  }
  setBusy(true);
  try {
    if (await openRoomRoute(router, ownRoomID.value, () => active)) emit('opened');
  } finally {
    if (active) setBusy(false);
  }
}
</script>
<style scoped>
.bot-room-button {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
</style>
