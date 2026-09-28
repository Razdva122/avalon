<template>
  <v-dialog v-model="open" :fullscreen="smAndDown" class="host-dialog" :aria-label="$t('hostMenu.hostPanel')">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        class="host-trigger"
        :class="{ 'host-trigger--game': started }"
        color="info"
        :variant="started ? 'text' : 'flat'"
        :icon="started ? 'settings' : undefined"
        :aria-label="$t(started ? 'hostMenu.manage' : 'startPanel.options')"
        :title="$t(started ? 'hostMenu.manage' : 'startPanel.options')"
      >
        <v-icon v-if="started" icon="settings" />
        <template v-else
          ><span class="material-icons" aria-hidden="true">tune</span>{{ $t('startPanel.options') }}</template
        >
      </v-btn>
    </template>
    <section class="host-console">
      <header class="host-header">
        <div>
          <h2>{{ $t(started ? 'hostMenu.hostPanel' : 'startPanel.options') }}</h2>
        </div>
        <v-btn icon="close" variant="text" :aria-label="$t('hostMenu.close')" @click="open = false" />
      </header>
      <div v-if="confirmation" class="host-body host-confirm" role="alert">
        <span class="material-icons host-confirm-icon" aria-hidden="true">how_to_vote</span>
        <h3>{{ $t(confirmation === 'endGame' ? 'hostMenu.endGame' : 'hostMenu.restartGame') }}?</h3>
        <p>{{ $t('hostMenu.endRestartGameHint') }}</p>
        <p>{{ $t('hostMenu.confirmHint') }}</p>
        <v-btn block color="error" size="large" :disabled="!canVote" @click="confirmAction">{{
          $t('hostMenu.startVote')
        }}</v-btn>
        <v-btn block variant="text" size="large" @click="confirmation = null">{{ $t('hostMenu.back') }}</v-btn>
      </div>
      <template v-else>
        <div class="host-body">
          <div class="host-overview">
            <span class="host-status"><span class="host-status-dot"></span>{{ $t(`hostMenu.${status}`) }}</span>
            <span class="host-count"
              ><strong>{{ roomState.players.length }}</strong> / 10 {{ $t('hostMenu.players') }}</span
            >
          </div>
          <section v-if="!started" class="host-section">
            <div class="host-section-heading">
              <h3>{{ $t('hostMenu.access') }}</h3>
            </div>
            <button class="host-access" type="button" @click="emitAction('lockRoom')">
              <span class="material-icons host-tile-icon" aria-hidden="true">{{ locked ? 'lock' : 'lock_open' }}</span>
              <span class="host-access-copy"
                ><strong>{{ $t(locked ? 'startPanel.unlockGame' : 'startPanel.lockGame') }}</strong
                ><small>{{ $t(locked ? 'hostMenu.lockedHint' : 'hostMenu.openHint') }}</small></span
              >
              <span class="material-icons" aria-hidden="true">chevron_right</span>
            </button>
          </section>
          <section v-if="!started" class="host-section">
            <div class="host-section-heading">
              <h3>{{ $t('startPanel.options') }}</h3>
            </div>
            <p class="host-description">{{ $t('hostMenu.settingsHint') }}</p>
            <div class="host-settings">
              <Options
                v-for="section in ['roles', 'addons', 'features'] as const"
                :key="section"
                :section="section"
                :roles="options.roles"
                :addons="options.addons"
                :features="options.features"
                :playerCount="roomState.players.length"
                :buttonText="$t(`options.${section}`)"
                @apply="applyOptions"
              />
              <TimerButton :features="options.features" @update:features="updateFeatures" />
            </div>
          </section>
          <section class="host-section">
            <div class="host-section-heading">
              <h3>{{ $t('hostMenu.seats') }}</h3>
            </div>
            <details class="host-players">
              <summary>
                <span>{{ $t('hostMenu.playerList') }}</span
                ><span>{{ roomState.players.length }} <span aria-hidden="true">⌄</span></span>
              </summary>
              <ol>
                <li v-for="(player, index) in roomState.players" :key="player.id">
                  <span class="host-seat-number">{{ index + 1 }}</span
                  ><UserPreview :userID="player.id" size="small" /><span
                    v-if="player.id === roomState.leaderID"
                    class="material-icons host-crown"
                    :aria-label="$t('hostMenu.host')"
                    role="img"
                    >stars</span
                  >
                </li>
              </ol>
            </details>
            <v-btn
              v-if="!started"
              class="host-shuffle"
              color="text-primary"
              block
              variant="outlined"
              :disabled="roomState.players.length < 2"
              @click="emitAction('shuffle')"
              ><span class="material-icons" aria-hidden="true">shuffle</span>{{ $t('hostMenu.shuffle') }}</v-btn
            >
            <p v-if="!started" class="host-description">{{ $t('hostMenu.shuffleHint') }}</p>
          </section>
          <section v-if="manualTimer && !gameEnded" class="host-section">
            <h3>{{ $t('options.timer') }}</h3>
            <CustomTimerControls :roomID="roomState.roomID" :leaderID="roomState.leaderID" />
          </section>
          <section v-if="started && !gameEnded" class="host-section host-danger">
            <div class="host-section-heading">
              <h3>{{ $t('hostMenu.gameActions') }}</h3>
            </div>
            <p class="host-description">
              {{ $t(roomState.vote ? 'hostMenu.votePending' : 'hostMenu.endRestartGameHint') }}
            </p>
            <v-btn block variant="outlined" :disabled="!canVote" @click="confirmation = 'endAndRestartGame'">{{
              $t('hostMenu.restartGame')
            }}</v-btn>
            <v-btn block variant="text" color="error" :disabled="!canVote" @click="confirmation = 'endGame'">{{
              $t('hostMenu.endGame')
            }}</v-btn>
          </section>
          <p v-if="gameEnded" class="host-description" role="status">{{ $t('hostMenu.finishedHint') }}</p>
        </div>
        <footer class="host-footer">
          <template v-if="!started">
            <p class="host-start-hint">
              {{
                $t(!enoughPlayers ? 'hostMenu.needPlayers' : !locked ? 'hostMenu.lockBeforeStart' : 'hostMenu.ready')
              }}
            </p>
            <v-btn block size="large" class="host-start" color="success" :disabled="!canStart" @click="startGame"
              ><span class="material-icons" aria-hidden="true">play_arrow</span>{{ $t('startPanel.startGame') }}</v-btn
            >
          </template>
          <v-btn v-else block size="large" variant="outlined" @click="open = false">{{
            $t('hostMenu.backToGame')
          }}</v-btn>
        </footer>
      </template>
    </section>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import type { GameOptionsFeatures } from '@avalon/types';
import type { TPageRoomState } from '@/helpers/game-state-manager';
import { socket } from '@/api/socket';
import Options from '@/components/view/options/Options.vue';
import TimerButton from '@/components/view/options/TimerButton.vue';
import CustomTimerControls from '@/components/view/board/modules/CustomTimerControls.vue';
import UserPreview from '@/components/user/UserPreview.vue';
import { useRoomOptions } from '@/components/view/options/room-options';

export default defineComponent({
  components: { Options, TimerButton, UserPreview, CustomTimerControls },
  props: {
    roomState: { type: Object as PropType<TPageRoomState>, required: true },
    gameEnded: { type: Boolean, default: false },
  },
  setup(props) {
    const open = ref(false);
    const confirmation = ref<'endGame' | 'endAndRestartGame' | null>(null);
    const { smAndDown } = useDisplay();
    const started = computed(() => props.roomState.stage === 'started');
    const manualTimer = computed(() => props.roomState.stage === 'started' && props.roomState.game?.timer?.isCustom);
    const locked = computed(() => props.roomState.stage === 'locked');
    const enoughPlayers = computed(() => props.roomState.players.length >= 5 && props.roomState.players.length <= 10);
    const canStart = computed(() => locked.value && enoughPlayers.value);
    const canVote = computed(() => started.value && !props.gameEnded && !props.roomState.vote);
    const status = computed(() =>
      props.gameEnded ? 'finished' : started.value ? 'inGame' : locked.value ? 'locked' : 'open',
    );
    const { options, applyOptions } = useRoomOptions(
      () => props.roomState.options,
      (next) => {
        if (!started.value) socket.emit('updateOptions', props.roomState.roomID, next);
      },
    );
    const updateFeatures = (features: GameOptionsFeatures) => applyOptions({ ...options.value, features });
    function emitAction(action: 'lockRoom' | 'shuffle') {
      if (!started.value) socket.emit(action, props.roomState.roomID);
    }
    function startGame() {
      if (!canStart.value) return;
      socket.emit('startGame', props.roomState.roomID);
      open.value = false;
    }
    function confirmAction() {
      if (!canVote.value || !confirmation.value) return;
      socket.emit(confirmation.value, props.roomState.roomID);
      open.value = false;
    }
    watch(open, () => {
      confirmation.value = null;
    });
    watch(
      () => props.roomState.stage,
      () => {
        confirmation.value = null;
      },
    );
    return {
      open,
      confirmation,
      smAndDown,
      started,
      manualTimer,
      locked,
      enoughPlayers,
      canStart,
      canVote,
      status,
      options,
      applyOptions,
      updateFeatures,
      emitAction,
      startGame,
      confirmAction,
    };
  },
});
</script>

<style lang="scss" scoped>
.host-trigger {
  min-height: 40px;
}
.host-trigger--game {
  width: 44px;
  height: 44px;
  min-height: 44px;
}
.host-trigger:not(.host-trigger--game) .material-icons {
  margin-right: 8px;
  font-size: 22px;
}
.host-dialog :deep(.v-overlay__content) {
  margin: 16px;
  width: 460px;
  max-width: calc(100% - 32px);
  right: 16px;
  max-height: calc(100dvh - 32px);
}
.host-console {
  --ink: rgb(var(--v-theme-text-primary));
  --muted: rgb(var(--v-theme-text-primary));
  --line: rgb(var(--v-theme-inset-hover));
  --accent: rgb(var(--v-theme-primary));
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  background: rgb(var(--v-theme-inset));
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px #0003;
}
.host-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--line);
}
.host-header :deep(.v-btn),
.host-footer :deep(.v-btn--variant-outlined),
.host-danger :deep(.v-btn--variant-outlined) {
  color: var(--ink) !important;
}
.host-header h2 {
  font-size: 20px;
  line-height: 1.2;
  font-weight: 600;
}
.host-body {
  padding: 20px 24px;
  overflow-y: auto;
  min-height: 0;
  overscroll-behavior: contain;
}
.host-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 22px;
}
.host-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
}
.host-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
}
.host-count {
  font-size: 13px;
  color: var(--muted);
}
.host-count strong {
  color: var(--ink);
  font-size: 18px;
}
.host-section + .host-section {
  margin-top: 24px;
}
.host-section-heading {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 12px;
}
.host-section h3 {
  font-size: 16px;
  font-weight: 700;
}
.host-description {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
  margin: 8px 0 12px;
}
.host-access {
  display: flex;
  text-align: left;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgb(var(--v-theme-bg-app));
  color: var(--ink);
}
.host-access:hover {
  filter: brightness(0.97);
}
.host-access-copy {
  flex: 1;
}
.host-access-copy strong {
  display: block;
  font-size: 14px;
}
.host-access-copy small {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.45;
}
.host-tile-icon {
  color: var(--accent);
}
.host-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.host-settings :deep(.v-btn),
.host-shuffle {
  margin: 0 !important;
  min-height: 48px;
  border: 1px solid var(--line);
  text-transform: none;
  letter-spacing: 0;
  font-size: 13px;
}
.host-players {
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  margin-bottom: 12px;
}
.host-players summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  font-size: 14px;
  cursor: pointer;
  list-style: none;
}
.host-players summary::-webkit-details-marker {
  display: none;
}
.host-players ol {
  list-style: none;
  padding: 0 0 8px;
}
.host-players li {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 48px;
}
.host-seat-number {
  color: var(--muted);
  font-size: 12px;
  min-width: 16px;
}
.host-players :deep(.user-preview) {
  flex: 1;
  min-width: 0;
  margin: 0;
}
.host-crown {
  color: var(--accent);
  font-size: 18px;
}
.host-shuffle .material-icons {
  margin-right: 8px;
  font-size: 19px;
}
.host-footer {
  flex-shrink: 0;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--line);
  background: rgb(var(--v-theme-inset));
}
.host-start-hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 10px;
  text-align: center;
}
.host-start {
  letter-spacing: 0;
  text-transform: none;
  font-weight: 700;
}
.host-start .material-icons {
  margin-right: 8px;
}
.host-danger :deep(.v-btn) {
  margin-top: 8px;
  min-height: 48px;
  letter-spacing: 0;
  text-transform: none;
}
.host-confirm {
  padding-block: 32px;
}
.host-confirm-icon {
  font-size: 36px;
  color: var(--accent);
  margin-bottom: 16px;
}
.host-confirm h3 {
  font-size: 22px;
}
.host-confirm p {
  margin: 14px 0;
  color: var(--muted);
  line-height: 1.6;
}
.host-confirm :deep(.v-btn) {
  margin-top: 12px;
}
.host-console :deep(button:focus-visible),
.host-players summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}
@media (max-width: 959px) {
  .host-dialog :deep(.v-overlay__content) {
    right: 0;
    margin: 0;
    width: 100%;
    max-width: 100%;
    max-height: 100dvh;
  }
  .host-console {
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: 0;
  }
  .host-body {
    flex: 1;
  }
  .host-header {
    padding-top: max(20px, env(safe-area-inset-top));
  }
  .host-footer {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}
@media (prefers-reduced-motion: reduce) {
  .host-dialog :deep(*) {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
