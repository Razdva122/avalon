<template>
  <div v-if="eligible" class="bot-rematch">
    <v-btn color="primary" class="restart-button" :disabled="busy || !canRestart" :loading="busy" @click="restart">
      {{ $t('room.restartGame') }}
    </v-btn>
    <WeeklyBotGameNotice
      v-if="largeTableRequired && !canPlayLargeTables && !existingRoom"
      :weekly="weeklyLargeGame"
      launch
    />
    <p v-if="error" role="alert" class="text-error">{{ error }}</p>
    <p
      v-else-if="
        !canRestart && accessStatus === 'ready' && (!largeTableRequired || largeTableAccess || !weeklyLargeGame)
      "
      role="status"
    >
      {{ $t(botsBusy ? 'aiArena.botBusy' : 'aiArena.setupAllUnavailable') }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { openRoomRoute } from '@/helpers/open-room-route';
import { lobbyAiSizes, needsLargeBotGameAccess } from '@avalon/types/room/lobby-ai';
import WeeklyBotGameNotice from '@/components/view/panels/WeeklyBotGameNotice.vue';
import type { TPageRoomState } from '@/helpers/game-state-manager';

const props = defineProps<{ room: TPageRoomState }>();
const { t } = useI18n();
const router = useRouter();
const store = useStore();
const {
  canPlay,
  canPlayLargeTables,
  weeklyLargeGame,
  largeTableAccess,
  markWeeklyGameUsed,
  accessStatus,
  botModes,
  botsBusy,
  ownRoomID,
  refresh,
} = useAiAccess();
const busy = ref(false);
const error = ref('');
let active = true;
onBeforeUnmount(() => {
  active = false;
});
const existingRoom = computed(() =>
  ownRoomID.value && ownRoomID.value !== props.room.roomID ? ownRoomID.value : undefined,
);
const eligible = computed(() =>
  Boolean(
    props.room.ai &&
    (props.room.ai.publicBotGame || props.room.ai.botDifficulty) &&
    props.room.ai.humanPlayerID === store.state.profile?.id &&
    props.room.leaderID === store.state.profile?.id &&
    props.room.stage === 'started' &&
    props.room.game.stage === 'end' &&
    (!props.room.archived || existingRoom.value),
  ),
);
const humanCount = computed(() => props.room.ai?.humanPlayerIDs?.length ?? 1);
const playerCount = computed(() => props.room.ai?.playerCount ?? props.room.players?.length ?? 5);
const validTable = computed(() =>
  lobbyAiSizes(humanCount.value, true).some((size) => size.playerCount === playerCount.value),
);
const largeTableRequired = computed(() =>
  needsLargeBotGameAccess(playerCount.value, humanCount.value, props.room.ai?.arenaSetup),
);
const canRestart = computed(
  () =>
    accessStatus.value === 'ready' &&
    canPlay.value &&
    Boolean(
      existingRoom.value ||
      (validTable.value &&
        botModes.value[props.room.ai?.beginner ? 'beginner' : 'regular'] &&
        (!largeTableRequired.value || largeTableAccess.value)),
    ),
);
async function restart() {
  if (!active || !eligible.value || !canRestart.value || busy.value) return;
  const origin = props.room.roomID;
  const isActive = () => active && props.room.roomID === origin;
  busy.value = true;
  error.value = '';
  try {
    const result = existingRoom.value
      ? { roomID: existingRoom.value }
      : await socket.timeout(30000).emitWithAck('restartHumanAiRoom', origin);
    if (!isActive()) return;
    if ('error' in result) {
      if (result.error === 'weeklyLargeGameUsed' && result.resetsAt !== undefined) {
        markWeeklyGameUsed(result.resetsAt, result.weeklyLargeGame);
      } else error.value = t('aiArena.botPlayError');
      void refresh();
      return;
    }
    if (!(await openRoomRoute(router, result.roomID, isActive)) && isActive())
      error.value = t('aiArena.connectionError');
  } catch {
    if (isActive()) {
      error.value = t('aiArena.connectionError');
      void refresh();
    }
  } finally {
    if (isActive()) busy.value = false;
  }
}
</script>
<style scoped>
.bot-rematch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.bot-rematch p {
  max-width: 280px;
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
}
</style>
