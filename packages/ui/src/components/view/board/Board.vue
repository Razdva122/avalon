<template>
  <div class="board-and-timer">
    <div class="wrapper">
      <div ref="boardRef" class="board-container" :class="'view-mode-' + stateManager.viewMode.value">
        <div class="game-board" alt="board" :class="'game-end-' + (assassinationActive ? '' : gameResult)"></div>
        <slot name="content">
          <div class="timer" v-if="timerDuration > 0">
            <Timer :key="visibleHistoryIndex" @timerEnd="clearHistoryElement" :duration="timerDuration" />
          </div>
          <div
            class="actions-container d-flex flex-column justify-center"
            :class="{ 'during-assassination': assassinationActive }"
          >
            <template v-if="roomState.stage !== 'started'">
              <div class="options-panel mb-4">
                <div class="options-title">{{ $t('game.rolesAndAddons') }}</div>
                <OptionsPreview
                  :roles="roomState.options.roles"
                  :addons="roomState.options.addons"
                  :max-view="10"
                  class="options-preview"
                />
              </div>
              <div class="button-panel d-flex flex-column align-center">
                <StartPanel :room-state="roomState" />
              </div>
            </template>
            <template v-else>
              <template v-if="shouldShowAnnounceLoyalty">
                <AnnounceLoyalty />
              </template>
              <Game
                v-else
                :inGamePanel="Boolean(playerInGame)"
                :visible-history="visibleHistory"
                :mission-animation-active="missionAnimationActive"
                :pending-mission="pendingMission"
              >
                <template v-slot:restart>
                  <slot name="restart"></slot>
                </template>
              </Game>
            </template>
          </div>
        </slot>
        <div
          class="player-container"
          v-for="(player, i) in players"
          :style="{ transform: calculateRotate(i) }"
          :key="player.id"
        >
          <Player
            :data-player-id="player.id"
            :player-state="player"
            :loyalty-badge="loyaltyBadges[player.id]"
            :badge-hidden="activeLoyaltyTarget === player.id"
            :thinking="roomState.ai?.status === 'running' && roomState.ai.thinkingPlayerID === player.id"
            :voice-side="Math.sin((2 * Math.PI * i) / players.length + Math.PI) > 0.75 ? 'left' : 'right'"
            :private-decision="
              roomState.ai && !playerInGame && spectatorRoles[player.id]
                ? spectatorDecisions.find((d) => d.playerID === player.id)
                : undefined
            "
            :spectator-role="roomState.ai && !playerInGame ? spectatorRoles[player.id] : undefined"
            :display-kick="userIsLeader"
            :display-index="roomState.stage === 'started' ? gameState.features.displayIndex : false"
            :visible-history="visibleHistory"
            :current-stage="roomState.stage === 'started' ? gameState.stage : undefined"
            :style="{ transform: calculateRotate(i, true), translate: '0 -50%' }"
            @player-click="onPlayerClick"
          />
        </div>
        <div ref="loyaltyEffectRef" class="board-event-effects" aria-hidden="true"></div>
        <div ref="missionEffectRef" class="board-event-effects" aria-hidden="true"></div>
        <div ref="cardEffectRef" class="board-card-effect" aria-hidden="true"></div>
      </div>
    </div>

    <div class="room-toolbar">
      <div
        v-if="gameTimer && (gameTimer.active || gameTimer.isCustom) && stateManager.viewMode.value === 'live'"
        class="game-timer"
      >
        <GameTimer
          @timerEnd="onGameTimerEnd"
          @addMinute="addTimerMinute"
          :canAdjust="userIsLeader && gameTimer.isCustom"
          :endTime="gameTimer.endTime || Date.now()"
          :isCustom="gameTimer.isCustom"
          :active="gameTimer.active"
        >
          <template v-slot:timer-controls>
            <CustomTimerControls
              v-if="userIsLeader && gameTimer.isCustom"
              :roomID="roomState.roomID"
              :leaderID="roomState.leaderID"
            />
          </template>
        </GameTimer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, watch, ref, PropType, toRefs, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Player from '@/components/view/board/modules/Player.vue';
import Timer from '@/components/feedback/Timer.vue';
import GameTimer from '@/components/feedback/GameTimer.vue';
import Game from '@/components/view/board/game/Game.vue';
import StartPanel from '@/components/view/panels/StartPanel.vue';
import OptionsPreview from '@/components/view/information/OptionsPreview.vue';
import AnnounceLoyalty from '@/components/view/board/game/modules/AnnounceLoyalty.vue';
import CustomTimerControls from '@/components/view/board/modules/CustomTimerControls.vue';
import eventBus from '@/helpers/event-bus';
import { THistoryResults, AiSpectatorDecision, TRoles, VisualGameState } from '@avalon/types';
import { hasActiveCard, useHaveActiveLoyaltyCard, isAdjacentPlayer, isPlayerOnMission } from '@/helpers/plot-cards';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { gameStateKey, stateManagerKey, TPageRoomState } from '@/helpers/game-state-manager';
import {
  calculateVisualElement,
  createLiveEventTracker,
  assassinationReveal,
  loyaltyBadge,
  missionReveal,
  missionSceneLayout,
  excaliburReveal,
} from '@/components/view/board/helpers';
import { getThumbnailPathByID } from '@/helpers/images';
import { calculateRoleUrl } from '@/helpers/styles';
import {
  renderAssassination,
  renderPairAssassination,
  renderLoyalty,
  renderMission,
  renderExcalibur,
  ASSASSINATION_REVEAL_DURATION,
  LOYALTY_REVEAL_DURATION,
} from './animations/render';
import './animations/style.scss';

export default defineComponent({
  name: 'Board',
  emits: ['assassination-active'],
  components: {
    Player,
    Game,
    StartPanel,
    Timer,
    GameTimer,
    AnnounceLoyalty,
    OptionsPreview,
    CustomTimerControls,
  },
  props: {
    spectatorDecisions: { type: Array as PropType<AiSpectatorDecision[]>, default: () => [] },
    spectatorRoles: { type: Object as PropType<Record<string, TRoles>>, default: () => ({}) },
    roomState: {
      type: Object as PropType<TPageRoomState>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const router = useRouter();
    const { roomState } = toRefs(props);
    const gameState = inject(gameStateKey)!;
    const stateManager = inject(stateManagerKey)!;
    const store = useStore();
    const visibleHistory = ref<THistoryResults>();
    const visibleHistoryIndex = ref(-1);
    const timerDuration = ref(0);
    const boardRef = ref<HTMLElement>();
    const missionEffectRef = ref<HTMLElement>();
    const missionAnimationActive = ref(false);
    const pendingMission = ref<number>();
    const cardEffectRef = ref<HTMLElement>();
    const loyaltyEffectRef = ref<HTMLElement>();
    const assassinationActive = ref(false);
    watch(assassinationActive, (active) => emit('assassination-active', active), { immediate: true });
    const activeReveal = ref<ReturnType<typeof assassinationReveal>>();
    const activeLoyaltyTarget = ref<string>();
    const maskedPlayers = ref<VisualGameState['players']>();
    let beforeAttack: VisualGameState['players'] | undefined;
    let cleanupAnimation: (() => void) | undefined;
    let effectTimer: ReturnType<typeof setTimeout> | undefined;
    let effectGeneration = 0;
    const liveGame = computed(() => (roomState.value.stage === 'started' ? roomState.value.game : undefined));
    const eventTracker = createLiveEventTracker(liveGame.value);
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clearEffect = () => {
      effectGeneration++;
      if (effectTimer) clearTimeout(effectTimer);
      effectTimer = undefined;
      cleanupAnimation?.();
      cleanupAnimation = undefined;
      missionAnimationActive.value = false;
      pendingMission.value = undefined;
      assassinationActive.value = false;
      activeReveal.value = undefined;
      activeLoyaltyTarget.value = undefined;
      maskedPlayers.value = undefined;
    };
    onUnmounted(clearEffect);

    const playerName = (id: string) => {
      const user = store.state.users[id];
      return user?.status === 'ready' ? user.profile.name : '…';
    };
    // Public profiles can arrive after the animation starts, especially for AI players.
    watch(
      () =>
        activeReveal.value
          ? {
              selected: playerName(activeReveal.value.selectedID),
              survivor: playerName(activeReveal.value.targetID),
              ...Object.fromEntries((activeReveal.value.cards ?? []).map((card) => [card.id, playerName(card.id)])),
            }
          : undefined,
      (names) => {
        if (!names) return;
        cardEffectRef.value?.querySelectorAll<HTMLElement>('[data-card-owner]').forEach((label) => {
          const name = (names as Record<string, string>)[label.dataset.cardOwner ?? ''] ?? '…';
          label.textContent = name;
          label.title = name;
        });
      },
      { flush: 'post' },
    );

    const loyaltyBadges = computed(() => {
      const badges: Record<string, { team: 'good' | 'evil'; sourceName: string }> = {};
      const badge = loyaltyBadge(visibleHistory.value);
      if (badge) {
        const source = store.state.users[badge.sourceID];
        badges[badge.targetID] = {
          team: badge.team,
          sourceName: source?.status === 'ready' ? source.profile.name : '…',
        };
      }
      return badges;
    });

    const playerGeometry = (id: string) => {
      const board = boardRef.value;
      const seat = Array.from(board?.querySelectorAll<HTMLElement>('[data-player-id]') ?? []).find(
        (node) => node.dataset.playerId === id,
      );
      const frame = seat?.querySelector('.player-frame');
      if (!board || !frame) return;
      const area = board.getBoundingClientRect();
      const portrait = frame.getBoundingClientRect();
      const scale = area.width / board.offsetWidth;
      return {
        x: (portrait.x + portrait.width / 2 - area.x) / scale,
        y: (portrait.y + portrait.height / 2 - area.y) / scale,
        radius: portrait.width / (2 * scale),
      };
    };

    const playVisibleEvent = async () => {
      if (stateManager.viewMode.value !== 'live' || !liveGame.value) return;
      const game = liveGame.value;
      const reveal =
        gameState.value?.stage === 'end' || (game.stage === 'assassinate' && gameState.value?.stage === 'assassinate')
          ? assassinationReveal(game)
          : undefined;
      const event = reveal ? game.history[game.history.length - 1] : visibleHistory.value;
      const badge = loyaltyBadge(event);
      const mission = missionReveal(event);
      const excalibur = excaliburReveal(event);
      if (!reveal && !badge && !mission && !excalibur) return;
      const index = reveal ? game.history.length - 1 : visibleHistoryIndex.value;
      if (!eventTracker.take(index)) return;
      clearEffect();
      const generation = effectGeneration;
      if (mission) {
        missionAnimationActive.value = true;
        pendingMission.value = mission.index;
      }
      if (reveal) {
        assassinationActive.value = true;
        activeReveal.value = reveal;
        maskedPlayers.value = reveal.pending ? undefined : beforeAttack;
      } else if (badge && !reducedMotion()) activeLoyaltyTarget.value = badge.targetID;
      await nextTick();
      if (generation !== effectGeneration || stateManager.viewMode.value !== 'live') return;
      if (reveal && cardEffectRef.value) {
        cleanupAnimation =
          reveal.cards && reveal.variant
            ? renderPairAssassination(cardEffectRef.value, {
                variant: reveal.variant,
                hitLabel: t('assassinate.verdictHit'),
                missLabel: t('assassinate.verdictMiss'),
                cards: reveal.cards.map((card) => ({
                  id: card.id,
                  roleImage: calculateRoleUrl(card.role),
                  playerName: playerName(card.id),
                  hit: card.hit,
                })),
                reducedMotion: reducedMotion(),
              })
            : renderAssassination(cardEffectRef.value, {
                roleImage: calculateRoleUrl(reveal.role),
                playerName: playerName(reveal.selectedID),
                survivorImage: calculateRoleUrl(reveal.targetRole),
                survivorName: playerName(reveal.targetID),
                hit: reveal.hit,
                reducedMotion: reducedMotion(),
              });
        effectTimer = setTimeout(clearEffect, reveal.pending ? 2000 : ASSASSINATION_REVEAL_DURATION);
      } else if (excalibur && loyaltyEffectRef.value && boardRef.value) {
        const source = playerGeometry(excalibur.sourceID);
        const target = excalibur.targetID ? playerGeometry(excalibur.targetID) : undefined;
        if (!source || (excalibur.targetID && !target)) {
          clearEffect();
          return;
        }
        cleanupAnimation = renderExcalibur(loyaltyEffectRef.value, {
          source,
          target,
          width: boardRef.value.offsetWidth,
          height: boardRef.value.offsetHeight,
          reducedMotion: reducedMotion(),
        });
        effectTimer = setTimeout(clearEffect, excalibur.targetID ? 3000 : 2000);
      } else if (mission && missionEffectRef.value && boardRef.value) {
        const board = boardRef.value;
        const token = board.querySelector<HTMLElement>(`[data-mission-index="${mission.index}"]`);
        if (!token) {
          clearEffect();
          return;
        }
        const rect = board.getBoundingClientRect();
        const target = token.getBoundingClientRect();
        const scale = rect.width / board.offsetWidth;
        const vote = board.querySelector<HTMLElement>('.vote-stage')?.getBoundingClientRect();
        const footer = board.querySelector<HTMLElement>('.meta-info')?.getBoundingClientRect();
        const scene =
          vote && footer
            ? missionSceneLayout(board.offsetWidth, (vote.bottom - rect.y) / scale, (footer.top - rect.y) / scale)
            : { left: 120, top: 250, scale: 1 };
        cleanupAnimation = renderMission(missionEffectRef.value, {
          ...mission,
          scene,
          witchImage: calculateRoleUrl('witch'),
          successImage: getThumbnailPathByID('core', 'blue_team_no_background'),
          failImage: getThumbnailPathByID('core', 'red_team_no_background'),
          successLabel: t('mission.cardSuccess'),
          failLabel: t('mission.cardFail'),
          target: {
            x: (target.x + target.width / 2 - rect.x) / scale,
            y: (target.y + target.height / 2 - rect.y) / scale,
            size: target.width / scale,
          },
          reducedMotion: reducedMotion(),
          onReveal: () => {
            if (generation === effectGeneration) pendingMission.value = undefined;
          },
        });
        effectTimer = setTimeout(clearEffect, 10000);
      } else if (badge && loyaltyEffectRef.value && boardRef.value) {
        const source = playerGeometry(badge.sourceID);
        const target = playerGeometry(badge.targetID);
        if (!source || !target) {
          clearEffect();
          return;
        }
        cleanupAnimation = renderLoyalty(loyaltyEffectRef.value, {
          teamImage: getThumbnailPathByID(
            'core',
            badge.team === 'good' ? 'blue_team_no_background' : 'red_team_no_background',
          ),
          ladyImage: getThumbnailPathByID('features', 'lady_of_lake'),
          source,
          target,
          width: boardRef.value.offsetWidth,
          height: boardRef.value.offsetHeight,
          reducedMotion: reducedMotion(),
        });
        effectTimer = setTimeout(clearEffect, reducedMotion() ? 0 : LOYALTY_REVEAL_DURATION);
      } else clearEffect();
    };

    // Replay generation can mutate oldGame.history; cache its length as a primitive watch source.
    watch(
      [liveGame, () => liveGame.value?.history.length, stateManager.snapshotRevision, stateManager.viewMode],
      ([game, length, revision, mode], [oldGame, oldLength, oldRevision, oldMode]) => {
        const reset = revision !== oldRevision || mode !== oldMode;
        if (reset || game?.uuid !== oldGame?.uuid) clearEffect();
        if (
          !reset &&
          mode === 'live' &&
          game &&
          oldGame &&
          game.uuid === oldGame.uuid &&
          length === (oldLength ?? 0) + 1
        ) {
          const event = game.history[game.history.length - 1];
          if (
            event.type === 'assassinate' &&
            ((['merlin', 'guinevere', 'cleric'].includes(event.assassinateType) && event.killedIDs.length === 1) ||
              (event.assassinateType === 'lovers' && event.killedIDs.length === 2))
          ) {
            clearEffect();
            beforeAttack = oldGame.players.map((player) => ({ ...player, features: { ...player.features } }));
            assassinationActive.value = true;
            maskedPlayers.value = beforeAttack;
          }
        }
        eventTracker.observe(game, mode, reset, true);
        if (game?.stage === 'end' && assassinationActive.value && !assassinationReveal(game)) clearEffect();
        void playVisibleEvent();
      },
    );
    watch(
      [visibleHistory, () => gameState.value?.stage],
      () => {
        void playVisibleEvent();
      },
      { flush: 'post' },
    );

    const playerInGame = computed(() => {
      if (roomState.value.stage !== 'started') return undefined;
      return gameState.value?.players.find((player) => player.id === store.state.profile?.id);
    });

    const players = computed(() => {
      if (roomState.value.stage === 'started') {
        return maskedPlayers.value ?? gameState.value.players;
      }

      return roomState.value.players;
    });

    const userIsLeader = computed(() => {
      return !roomState.value.ai && store.state.profile?.id === roomState.value.leaderID;
    });

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / players.value.length) * i + 180}deg)`;
    };

    const clearHistoryElement = () => {
      if (missionAnimationActive.value || visibleHistory.value?.type === 'switchResult') clearEffect();
      visibleHistory.value = undefined;
      visibleHistoryIndex.value = -1;
      timerDuration.value = 0;
      stateManager.moveToNextStage();
    };

    const gameTimer = computed(() => {
      if (
        roomState.value.stage === 'started' &&
        gameState.value.stage !== 'end' &&
        gameState.value?.timer &&
        !visibleHistory.value
      ) {
        return gameState.value.timer;
      }
      return null;
    });

    const addTimerMinute = () => {
      if (!userIsLeader.value || !gameTimer.value?.isCustom || stateManager.viewMode.value !== 'live') return;
      socket.emit(gameTimer.value.active ? 'addCustomTimerTime' : 'startCustomTimer', roomState.value.roomID, 60);
    };

    const onGameTimerEnd = () => {
      // Timer ended, backend will handle the timeout
    };

    const navigateToUserStats = (uuid: string) => {
      router.push({ name: 'user_stats', params: { uuid } });
    };

    const kickPlayer = (uuid: string) => {
      socket.emit('kickPlayer', roomState.value.roomID, uuid);
    };

    const canUserSelectPlayer = (targetPlayerID: string) => {
      if (!playerInGame.value) return false;

      const { stage } = gameState.value;
      const features = playerInGame.value.features;
      const playerID = playerInGame.value.id;

      // Special case for areYouTheOne card - can only select adjacent players
      if (stage === 'checkLoyalty' && hasActiveCard(gameState.value, playerID, 'areYouTheOne')) {
        return isAdjacentPlayer(gameState.value, playerID, targetPlayerID);
      }

      if (
        (stage === 'weFoundYou' && hasActiveCard(gameState.value, playerID, 'weFoundYou')) ||
        (stage === 'useExcalibur' && features.excalibur) ||
        (stage === 'ambush' && hasActiveCard(gameState.value, playerID, 'ambush'))
      ) {
        return isPlayerOnMission(gameState.value, targetPlayerID);
      }

      return (
        (stage === 'selectTeam' && features.isLeader) ||
        (stage === 'giveExcalibur' && features.isLeader) ||
        (stage === 'assassinate' && features.isAssassin) ||
        (stage === 'checkLoyalty' && (features.ladyOfLake === 'active' || features.ladyOfSea === 'active')) ||
        (stage === 'checkLoyalty' && features.witchLoyalty === 'active') ||
        (stage === 'giveCard' && features.isLeader) ||
        (stage === 'leadToVictory' && hasActiveCard(gameState.value, playerID, 'leadToVictory')) ||
        (stage === 'restoreHonor' && hasActiveCard(gameState.value, playerID, 'restoreHonor')) ||
        (stage === 'revealLoyalty' && hasActiveCard(gameState.value, playerID, 'showNature')) ||
        (stage === 'revealLoyalty' && hasActiveCard(gameState.value, playerID, 'showStrength'))
      );
    };

    const onPlayerClick = (uuid: string) => {
      if (roomState.value.stage === 'started' && roomState.value.game.stage === 'end') {
        navigateToUserStats(uuid);
        return;
      }

      if (roomState.value.stage !== 'started') {
        userIsLeader.value ? kickPlayer(uuid) : navigateToUserStats(uuid);
        return;
      }

      if (canUserSelectPlayer(uuid)) {
        socket.emit('selectPlayer', gameState.value.uuid, uuid);
      }
    };

    const gameHistoryLength = computed(() => {
      if (gameState.value) {
        return gameState.value.history.length;
      }
    });

    const lastVisibleElement = computed(() => {
      return calculateVisualElement(gameState.value.history);
    });

    watch(gameHistoryLength, (newLength) => {
      if (!newLength || stateManager.viewMode.value === 'history') {
        return;
      }

      if (lastVisibleElement.value.element && lastVisibleElement.value.timeout > 0) {
        const element = lastVisibleElement.value.element;
        const index = gameState.value.history.length - 1;
        const timeout = lastVisibleElement.value.timeout;
        nextTick(() => {
          visibleHistory.value = element;
          visibleHistoryIndex.value = index;
          timerDuration.value = timeout;
        });
      } else {
        stateManager.moveToNextStage();
      }
    });

    const playerWaitForActionState = computed(() => {
      if ('game' in roomState.value) {
        return roomState.value.game.players.find((player) => player.id === store.state.profile?.id)?.features
          .waitForAction;
      }
    });

    watch(playerWaitForActionState, () => {
      if (playerWaitForActionState && stateManager.viewMode.value === 'history') {
        eventBus.emit('infoMessage', t('infoMessage.waitForAction'));
      }
    });

    const gamePointer = computed(() => {
      if (roomState.value.stage !== 'started') {
        return 0;
      }

      return roomState.value.pointer;
    });

    watch(gamePointer, (pointer) => {
      if (stateManager.viewMode.value === 'live') {
        return;
      }

      if (lastVisibleElement.value.element) {
        visibleHistory.value = lastVisibleElement.value.element;
        visibleHistoryIndex.value = gameState.value.history.length - 1;
      } else {
        visibleHistory.value = undefined;
        visibleHistoryIndex.value = -1;
      }

      if (stateManager.state.value.stage === 'started') {
        if (pointer === stateManager.state.value.gameStates.length - 1) {
          visibleHistory.value = undefined;
          visibleHistoryIndex.value = -1;
        }
      }
    });

    watch(stateManager.viewMode, (newViewMode) => {
      if (newViewMode === 'live') {
        nextTick(() => {
          timerDuration.value = 0;
          visibleHistory.value = undefined;
          visibleHistoryIndex.value = -1;
        });
      }
    });

    const gameResult = computed(() => {
      if (roomState.value.stage === 'started') {
        return gameState.value.result?.winner;
      }
    });

    const playerID = computed(() => playerInGame.value?.id);

    const isUserLoyaltyAnnouncer = computed(() => {
      if (!playerInGame.value) {
        return false;
      }

      return (
        playerInGame.value.features.ladyOfLake === 'active' ||
        playerInGame.value.features.ladyOfSea === 'active' ||
        playerInGame.value.features.witchLoyalty === 'active' ||
        (useHaveActiveLoyaltyCard(gameState, playerID) && playerInGame.value.features.waitForAction === true)
      );
    });

    const shouldShowAnnounceLoyalty = computed(() => {
      if (gameState.value.stage !== 'announceLoyalty') {
        return false;
      }
      if (stateManager.viewMode.value !== 'live' || visibleHistory.value?.type === 'announceLoyalty') {
        return false;
      }

      return isUserLoyaltyAnnouncer.value;
    });

    return {
      boardRef,
      missionEffectRef,
      missionAnimationActive,
      pendingMission,
      cardEffectRef,
      loyaltyEffectRef,
      assassinationActive,
      activeLoyaltyTarget,
      loyaltyBadges,
      roomState,
      gameState,
      players,
      playerInGame,
      visibleHistory,
      stateManager,
      gameResult,
      userIsLeader,
      shouldShowAnnounceLoyalty,

      timerDuration,
      visibleHistoryIndex,
      clearHistoryElement,

      calculateRotate,
      onPlayerClick,
      gameTimer,
      onGameTimerEnd,
      addTimerMinute,
    };
  },
});
</script>

<style lang="scss">
.board-event-effects {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.board-card-effect {
  position: absolute;
  width: 380px;
  height: 290px;
  top: 155px;
  left: 110px;
  z-index: 4;
  pointer-events: none;
}
.during-assassination {
  visibility: hidden;
}
@mixin gameEndShadow($color) {
  box-shadow:
    rgba($color, 0.4) 8px 8px,
    rgba($color, 0.3) 16px 16px,
    rgba($color, 0.2) 24px 24px,
    rgba($color, 0.1) 32px 32px,
    rgba($color, 0.05) 40px 40px;
}

@mixin scaleFromSize($size) {
  $value: $size;

  @while $value > 300px {
    $newValue: calc($value - 50px);

    @media screen and (max-width: $value) and (min-width: $newValue) {
      .board-container {
        --board-scale: #{calc(($newValue + 40px) / $size)};
        transform: scale(var(--board-scale));
      }

      .wrapper {
        width: $newValue;
        height: $newValue;
      }
    }

    @media screen and (max-height: $value) and (min-height: $newValue) {
      .board-container {
        --board-scale: #{calc(($newValue - 50px) / $size)};
        transform: scale(var(--board-scale));
      }

      .wrapper {
        width: $newValue;
        height: $newValue;
      }
    }

    $value: $newValue;
  }
}

.board-container {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 120px 100px;
  color: white;
  overflow: visible;
  --board-scale: 1;
  transform: scale(var(--board-scale));
}

@include scaleFromSize(840px);

.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-container {
  top: 120px;
  height: 340px;
  z-index: 1;
  position: absolute;
}

.game-board {
  background-image: getImagePathByID('core', 'board');
  width: 600px;
  height: 600px;
  background-position: center;
  border-radius: 50%;
  background-size: 137%;
}

.game-end-evil {
  @include gameEndShadow(rgb(255, 25, 25));
}

.game-end-good {
  @include gameEndShadow(rgb(0, 85, 184));
}

.player-container {
  user-select: none;
  pointer-events: none;
  display: flex;
  justify-content: center;
  position: absolute;
  top: -10px;
  width: 620px;
  height: 620px;
  transition: transform 0.5s;
}

.button-panel button,
.button-panel .v-btn {
  width: 200px;
}

.options-panel {
  padding: 6px;
  border-radius: 12px;
}

.options-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.options-title {
  text-align: center;
  font-size: 24px;
}

.view-mode-history {
  .timer {
    display: none;
  }
}

.timer {
  text-align: center;
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  min-width: 60px;
}

.board-and-timer {
  max-width: 100%;
  overflow-x: clip;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.room-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  max-width: calc(100vw - 16px);
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12;
  margin-top: 0;
}
.game-timer {
  min-width: 0;
}
</style>
