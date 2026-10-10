<template>
  <div
    class="player-container"
    :class="[playerClasses, { 'ai-thinking': thinking, 'player-premium-assassin': showPremiumAssassin }]"
    @click="privateDecision ? (showUserCardDialog = true) : $emit('playerClick', player.id)"
    ref="playerRef"
  >
    <Teleport to="body">
      <span
        v-if="thinking || isOwnDiscussionTurn"
        ref="statusElement"
        class="ai-player-status"
        :class="statusThemeClasses"
        :style="statusStyles"
        role="status"
        aria-atomic="true"
        :aria-label="`${player.name}: ${$t(statusKey)}`"
      >
        <span v-if="thinking && !isOwnDiscussionTurn" class="thinking-dots" aria-hidden="true"
          ><i></i><i></i><i></i
        ></span>
        {{ $t(statusKey) }}
      </span>
    </Teleport>
    <v-tooltip
      :open-delay="privateDecision ? 300 : 2500"
      :close-delay="0"
      location="top"
      :disabled="!player.id || isMobileDevice || showUserCardDialog"
      max-width="350"
      content-class="user-hover-tooltip"
      v-model="tooltipOpen"
    >
      <template v-slot:activator="{ props: tooltip }">
        <div
          v-bind="tooltip"
          class="player-content"
          :tabindex="privateDecision ? 0 : undefined"
          :role="privateDecision ? 'button' : undefined"
          :aria-label="privateDecision ? `${player.name} · ${$t('aiArena.lastDecision')}` : undefined"
          @keydown.enter.prevent="privateDecision && (showUserCardDialog = true)"
          @keydown.space.prevent="privateDecision && (showUserCardDialog = true)"
        >
          <span
            v-if="playerClasses['player-feature-waitForAction'] || playerClasses['player-feature-isAssassin']"
            class="player-pulse-aura"
            aria-hidden="true"
          ></span>
          <span v-if="showPremiumAssassin" class="player-assassin-fire" aria-hidden="true">
            <span class="player-assassin-spark"></span>
            <span class="player-assassin-spark"></span>
            <span class="player-assassin-spark"></span>
          </span>
          <img class="player-frame" alt="frame" :src="getImagePathByID('core', 'player-frame')" />
          <div class="player-icon"></div>
          <Avatar
            v-if="displayUserAvatar && userState.status === 'ready'"
            class="role-container"
            :avatarID="userState.profile.avatar"
          />
          <PlayerIcon v-if="'role' in player" class="role-container" :icon="player.role" />
          <span
            v-if="loyaltyBadge && !badgeHidden"
            class="player-loyalty-badge"
            :class="'team-' + loyaltyBadge.team"
            role="img"
            :aria-label="`${$t('announceLoyalty.announceInfo', { announcer: loyaltyBadge.sourceName, target: player.name })}: ${$t('game.' + loyaltyBadge.team)}`"
            :title="`${$t('announceLoyalty.announceInfo', { announcer: loyaltyBadge.sourceName, target: player.name })}: ${$t('game.' + loyaltyBadge.team)}`"
            ><img
              :src="
                getThumbnailPathByID(
                  'core',
                  loyaltyBadge.team === 'good' ? 'blue_team_no_background' : 'red_team_no_background',
                )
              "
              alt=""
          /></span>
          <div
            v-if="stickerReaction"
            class="player-sticker"
            role="img"
            :aria-label="`${player.name}: ${$t(`stickers.${stickerReaction.stickerID}`)}`"
          >
            <StickerImage :id="stickerReaction.stickerID" aria-hidden="true" />
          </div>
          <span v-if="playerClasses['player-feature-isSent']" class="player-mission-arc" aria-hidden="true"></span>
          <span
            v-if="playerClasses['player-feature-isSent']"
            class="player-state-badge player-mission-flag"
            role="img"
            :aria-label="$t('game.mission')"
            :title="$t('game.mission')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V3m0 1c4-3 8 3 14 0v10c-6 3-10-3-14 0" /></svg>
          </span>
          <span
            v-if="playerClasses['player-feature-isSelected']"
            class="player-state-badge player-selection-check"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
          </span>
          <span
            v-if="playerClasses['player-feature-isAssassin']"
            class="player-state-badge player-assassin-badge"
            role="img"
            :aria-label="$t('game.assassinate')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 17 11-13 3-1-1 4-11 12M4 15l7 7M7 18l-4 4" /></svg>
          </span>
          <div class="player-crown" alt="crown"></div>
          <div class="player-actions-features" v-if="'features' in player">
            <img
              v-for="addon in ['lady-of-lake', 'lady-of-sea', 'excalibur']"
              :class="addon"
              :alt="addon"
              :src="getImagePathByID('features', toSnakeCase(addon))"
            />
            <template v-for="card in playerCards" :key="card.name">
              <PlotCard
                :displayTooltip="true"
                class="plot-card"
                :class="`plot-card-${card.stage}`"
                :cardName="card.name"
              />
            </template>
          </div>
          <i class="material-icons action-icon close text-error"></i>
          <i class="material-icons action-icon check"></i>
          <div class="switch-image">
            <div class="icon-good-mission"></div>
            <i class="material-icons icon-switch arrow_forward"></i>
            <div class="icon-evil-mission"></div>
          </div>
          <Teleport to="body">
            <div
              v-if="chatMessage?.message"
              ref="messageElement"
              class="player-message-preview"
              :style="messageStyles"
              :data-placement="messagePlacement"
            >
              <span ref="messageArrow" class="message-arrow" :style="messageArrowStyles" aria-hidden="true"></span>
              <span class="preview-author">{{ player.name }}</span>
              <span class="preview-text">{{ chatMessage.message }}</span>
            </div>
          </Teleport>
          <span class="player-name" :title="player.name">
            <span class="player-name-text">
              <span v-if="'index' in player && displayIndex">
                <b>{{ `${player.index}.` }}</b>
              </span>
              <span>
                {{ player.name }}
              </span>
            </span>
            <VoiceStatus
              v-if="voiceStatus"
              class="player-voice-status"
              :class="{ 'is-left': voiceSide === 'left' }"
              table
              :status="voiceStatus"
              :name="player.name"
              :own="isOwnVoice"
              interactive
            />
          </span>
        </div>
      </template>

      <AiPrivateDecision
        v-if="privateDecision"
        :decision="privateDecision"
        :name="player.name"
        :avatar="userState.status === 'ready' ? userState.profile.avatar : undefined"
        preview
      />
      <UserHoverCard v-else-if="player.id" :userID="player.id" :isVisible="tooltipOpen" />
    </v-tooltip>

    <v-dialog v-model="showUserCardDialog" content-class="user-card-dialog" @click.stop>
      <AiPrivateDecision
        v-if="privateDecision"
        :decision="privateDecision"
        :name="player.name"
        :avatar="userState.status === 'ready' ? userState.profile.avatar : undefined"
        @close="showUserCardDialog = false"
      />
      <UserHoverCard
        v-else-if="player.id && showUserCardDialog"
        :userID="player.id"
        :isVisible="showUserCardDialog"
        compact
      >
        <template #actions>
          <v-btn
            icon="close"
            variant="text"
            color="text-primary"
            :aria-label="$t('chat.closeProfile')"
            @click="showUserCardDialog = false"
          />
        </template>
      </UserHoverCard>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue';
import { roomChatKey } from '@/helpers/room-chat-context';
import VoiceStatus from '@/components/voice/VoiceStatus.vue';
import { roomVoiceKey } from '@/helpers/room-voice-context';
import StickerImage from '@/components/stickers/StickerImage.vue';
import { stickerReactionsKey } from '@/helpers/composables/useRoomStickers';
import cloneDeep from 'lodash/cloneDeep';
import { defineComponent, PropType, inject, computed, toRefs, ref, onMounted, onUnmounted, ComputedRef } from 'vue';
import { onLongPress } from '@vueuse/core';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { useTheme } from 'vuetify';
import { useUserProfile } from '@/helpers/composables';
import type {
  RoomPlayer,
  THistoryResults,
  Dictionary,
  TGameStage,
  IActionWithResult,
  TPlotCardNames,
} from '@avalon/types';
import { availablePlotCards } from '@avalon/types/consts';
import { getPlayerCards, isAdjacentPlayer, hasActiveCard } from '@/helpers/plot-cards';
import type { IFrontendPlayer } from '@/components/view/board/interface';
import { gameStateKey } from '@/helpers/game-state-manager';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import { getImagePathByID, getThumbnailPathByID } from '@/helpers/images';
import Avatar from '@/components/user/Avatar.vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import AiPrivateDecision from './AiPrivateDecision.vue';
import UserHoverCard from '@/components/user/UserHoverCard.vue';
import snakeCase from 'lodash/snakeCase';

export default defineComponent({
  components: {
    StickerImage,
    VoiceStatus,
    PlayerIcon,
    Avatar,
    PlotCard,
    UserHoverCard,
    AiPrivateDecision,
  },
  props: {
    loyaltyBadge: { type: Object as PropType<{ team: 'good' | 'evil'; sourceName: string }> },
    badgeHidden: Boolean,
    thinking: { type: Boolean, default: false },
    discussionTurn: { type: Boolean, default: false },
    voiceSide: { type: String as PropType<'left' | 'right'>, default: 'right' },
    playerState: {
      type: Object as PropType<IFrontendPlayer | RoomPlayer>,
      required: true,
    },
    privateDecision: { type: Object as PropType<import('@avalon/types').AiSpectatorDecision> },
    spectatorRole: { type: String as PropType<import('@avalon/types').TRoles> },
    visibleHistory: {
      type: Object as PropType<THistoryResults>,
    },
    currentStage: {
      type: String as PropType<TGameStage>,
    },
    displayKick: {
      type: Boolean,
    },
    displayIndex: {
      type: Boolean,
    },
  },
  setup(props) {
    const gameState = inject(gameStateKey)!;
    const store = useStore();
    const theme = useTheme();
    const voiceContext = inject(roomVoiceKey, undefined);
    const isOwnVoice = computed(() => props.playerState.id === store.state.profile?.id);
    const isOwnDiscussionTurn = computed(() => props.discussionTurn && isOwnVoice.value && !props.visibleHistory);
    const statusKey = computed(() => (isOwnDiscussionTurn.value ? 'aiArena.yourDiscussionTurn' : 'aiArena.thinking'));
    const voiceStatus = computed(() => {
      const voice = voiceContext?.value;
      if (
        voice?.status.value !== 'connected' ||
        !voice.state.value.available ||
        !voice.state.value.canJoin ||
        !props.playerState.id
      )
        return undefined;
      return voice.userStatus(props.playerState.id, store.state.profile?.id ?? '');
    });
    const roomChat = inject(roomChatKey, undefined);
    const reactions = inject(stickerReactionsKey, {});
    const stickerReaction = computed(() => reactions[props.playerState.id]);
    const { playerState, visibleHistory, displayKick } = toRefs(props);
    const { userState, userName } = useUserProfile(playerState.value.id);
    const chatMessage = ref<{ message?: string; timeoutId?: number }>();
    const playerRef = ref<HTMLElement | null>(null);
    const statusElement = ref<HTMLElement | null>(null);
    const { floatingStyles: statusStyles } = useFloating(playerRef, statusElement, {
      strategy: 'fixed',
      placement: 'top',
      middleware: [offset(6), shift({ padding: 8 })],
      whileElementsMounted: (reference, floating, update) =>
        autoUpdate(reference, floating, update, { animationFrame: true }),
    });
    const messageElement = ref<HTMLElement | null>(null);
    const messageArrow = ref<HTMLElement | null>(null);
    const {
      floatingStyles: messageStyles,
      placement: messagePlacement,
      middlewareData,
    } = useFloating(playerRef, messageElement, {
      strategy: 'fixed',
      middleware: [
        {
          name: 'towardsTable',
          fn({ elements, placement, middlewareData }) {
            if (middlewareData.towardsTable?.chosen) return {};
            const board = playerRef.value?.closest('.board-container')?.getBoundingClientRect();
            const avatar = elements.reference.getBoundingClientRect();
            if (!board) return {};
            const dx = board.x + board.width / 2 - (avatar.x + avatar.width / 2);
            const dy = board.y + board.height / 2 - (avatar.y + avatar.height / 2);
            const side = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top';
            return {
              data: { chosen: true },
              ...(placement !== side ? { reset: { placement: side as 'left' | 'right' | 'top' | 'bottom' } } : {}),
            };
          },
        },
        offset(10),
        flip(),
        shift({ padding: 12 }),
        arrow({ element: messageArrow, padding: 14 }),
      ],
      whileElementsMounted: (reference, floating, update) =>
        autoUpdate(reference, floating, update, { animationFrame: true }),
    });
    const messageArrowStyles = computed(() => ({
      left: middlewareData.value.arrow?.x != null ? `${middlewareData.value.arrow.x}px` : undefined,
      top: middlewareData.value.arrow?.y != null ? `${middlewareData.value.arrow.y}px` : undefined,
    }));
    const showUserCardDialog = ref(false);
    const tooltipOpen = ref(false);

    const isMobileDevice = computed(() => {
      return window.matchMedia && window.matchMedia('(hover: none)').matches;
    });

    onMounted(() => {
      onLongPress(
        playerRef,
        () => {
          if (isMobileDevice.value && player.value.id) {
            showUserCardDialog.value = true;
          }
        },
        { delay: 600 },
      );
    });

    const onMessage = (message: import('@avalon/types').TMessage) => {
      if (message.roomID && message.roomID !== roomChat?.roomID()) return;
      if (message.author === playerState.value.id) {
        if (chatMessage.value?.timeoutId) {
          window.clearTimeout(chatMessage.value?.timeoutId);
        }

        const timeoutId = window.setTimeout(() => {
          chatMessage.value = {};
        }, 6000);

        chatMessage.value = { message: message.text, timeoutId };
      }
    };
    socket.on('newMessage', onMessage);
    onUnmounted(() => {
      socket.off('newMessage', onMessage);
      window.clearTimeout(chatMessage.value?.timeoutId);
    });

    const player: ComputedRef<(IFrontendPlayer | RoomPlayer) & { name: string }> = computed(() => {
      const clone = cloneDeep(playerState.value) as (IFrontendPlayer | RoomPlayer) & { name: string };

      clone.name = userName.value;

      if ('features' in clone) {
        const isGameEnded = gameState.value.stage === 'end';

        if (visibleHistory.value?.type === 'vote') {
          clone.features.waitForAction = false;

          if (visibleHistory.value.forced) {
            clone.features.vote = 'forced-approve';
          } else {
            if (visibleHistory.value.anonymous !== true) {
              const userVote = visibleHistory.value.votes.find((player) => player.playerID === clone.id)!;

              clone.features.vote = userVote.value;
            }
          }
        }

        if (visibleHistory.value?.type === 'preVote') {
          clone.features.waitForAction = false;
          const userVote = visibleHistory.value.votes.find((player) => player.playerID === clone.id);

          if (userVote) {
            clone.features.vote = userVote.value;
          }
        }

        if (visibleHistory.value?.type === 'ambush') {
          if (clone.id === visibleHistory.value.targetID && visibleHistory.value.result) {
            clone.role = visibleHistory.value.result === 'fail' ? 'evil' : 'good';
          }
        }

        if (visibleHistory.value?.type === 'switchLancelots') {
          clone.features.waitForAction = false;
          clone.features.isSelected = false;
          clone.features.isSent = false;
        }

        if (
          visibleHistory.value?.type === 'announceLoyalty' &&
          visibleHistory.value.announced &&
          !['good', 'evil'].includes(visibleHistory.value.announced)
        ) {
          if (clone.id === visibleHistory.value.targetID) {
            clone.role = visibleHistory.value.announced;
          }
        }

        if (visibleHistory.value?.type === 'switchResult' && visibleHistory.value.targetID) {
          if (clone.id === visibleHistory.value.targetID) {
            clone.role = 'excalibur';
          }
        }

        if (visibleHistory.value?.type === 'mission') {
          clone.features.waitForAction = false;
          clone.features.isSelected = false;

          const switchedAction = visibleHistory.value.actions?.find(
            (action) => action.playerID === clone.id && action.switchedBy,
          );

          const visibleAction = visibleHistory.value.actions?.find(
            (action) => action.playerID === clone.id && 'value' in action,
          ) as IActionWithResult;

          if (switchedAction && visibleAction) {
            clone.features.switch = visibleAction.value === 'fail' ? 'toFail' : 'toSuccess';
          } else if (visibleAction) {
            clone.role = visibleAction.value === 'fail' ? 'evil' : 'good';
          } else if (switchedAction) {
            clone.role = 'excalibur';
          }
        }

        if (store.state.hideSpoilers && !isGameEnded) {
          if (clone.role !== 'excalibur') {
            clone.role = 'unknown';
          }

          clone.features.switch = undefined;
        }

        if (props.spectatorRole && !visibleHistory.value) clone.role = props.spectatorRole;

        if (clone.role === 'revealer') {
          const amountOfFailMissions = gameState.value.missionState.filter((el) => el.result === 'fail').length;

          if (amountOfFailMissions === 0) {
            clone.role = 'revealer_hidden';
          }

          if (amountOfFailMissions === 1) {
            clone.role = 'revealer_progress';
          }
        }
      }

      return clone;
    });

    const playerClasses = computed(() => {
      let classes: Dictionary<string | boolean> = {};

      if ('features' in player.value) {
        classes = {
          ...Object.entries(player.value.features).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
            if (typeof value === 'string') {
              acc[`player-feature-${key}-${value}`] = true;
            } else {
              acc[`player-feature-${key}`] = value;
            }

            return acc;
          }, {}),
          ...classes,
        };

        if (gameState.value.stage === 'checkLoyalty') {
          const cardOwner = gameState.value.players.find((p) => hasActiveCard(gameState.value, p.id, 'areYouTheOne'));

          const anyPlayerSelected = gameState.value.players.some((p) => p.features.isSelected);

          if (cardOwner && !anyPlayerSelected) {
            classes['player-adjacent'] = isAdjacentPlayer(gameState.value, cardOwner.id, player.value.id);
          }
        }
      } else {
        classes = {
          'player-feature-isLeader': player.value.isLeader,
          'player-feature-kick': Boolean(displayKick.value),
        };
      }

      return classes;
    });

    const showPremiumAssassin = computed(
      () =>
        userState.value.status === 'ready' &&
        Boolean(userState.value.profile.premium) &&
        Boolean(playerClasses.value['player-feature-isAssassin']),
    );

    const displayUserAvatar = computed(() => {
      return !gameState.value;
    });

    const toSnakeCase = (str: string) => {
      return snakeCase(str);
    };

    const plotCardsNames = <TPlotCardNames[]>Object.keys(availablePlotCards);

    // Get player cards using our helper function
    const playerCards = computed(() => {
      if (!player.value || !('id' in player.value) || !gameState.value) {
        return [];
      }

      return getPlayerCards(gameState.value, player.value.id);
    });

    return {
      getThumbnailPathByID,
      voiceStatus,
      isOwnVoice,
      isOwnDiscussionTurn,
      statusKey,
      statusElement,
      statusStyles,
      statusThemeClasses: theme.themeClasses,
      userState,
      displayUserAvatar,
      player,
      playerClasses,
      showPremiumAssassin,
      chatMessage,
      roomChat,
      messageElement,
      messageArrow,
      messageStyles,
      messagePlacement,
      messageArrowStyles,
      stickerReaction,
      getImagePathByID,
      toSnakeCase,
      plotCardsNames,
      playerCards,
      playerRef,
      showUserCardDialog,
      isMobileDevice,
      tooltipOpen,
    };
  },
});
</script>

<style scoped lang="scss">
.ai-thinking .player-frame {
  filter: drop-shadow(0 0 7px rgba(var(--v-theme-primary), 0.7));
}
.ai-player-status {
  position: fixed;
  z-index: 30;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  padding: 4px 9px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  font-size: 12px;
  font-weight: 700;
}
.thinking-dots {
  display: flex;
  gap: 3px;
  i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    animation: thinking-pulse 1.4s ease-in-out infinite;
  }
  i:nth-child(2) {
    animation-delay: 0.18s;
  }
  i:nth-child(3) {
    animation-delay: 0.36s;
  }
}
@keyframes thinking-pulse {
  0%,
  70%,
  100% {
    opacity: 0.35;
  }
  35% {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .thinking-dots i {
    animation: none;
    opacity: 1;
  }
}

@mixin dropShadowBorder($color, $size) {
  filter: drop-shadow($size $size 0 $color) drop-shadow(-$size $size 0 $color) drop-shadow($size (-$size) 0 $color)
    drop-shadow((-$size) (-$size) 0 $color);
}

.player-container {
  width: 125px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: all;
  cursor: pointer;
  position: relative;
}

.player-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-loyalty-badge {
  position: absolute;
  top: 41.5px;
  left: 99px;
  width: 32px;
  height: 32px;
  z-index: 3;
  pointer-events: none;
  border-radius: 50%;
  padding: 3px;
  border: 1px solid #d3bb83;
  background: radial-gradient(circle at 35% 25%, #555147, #171b21 70%);
  box-shadow:
    0 2px 5px #0008,
    inset 0 0 0 2px #94836870;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

:deep(.user-hover-tooltip) {
  background-color: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
}

.player-actions-features {
  z-index: 5;
  display: flex;
  position: absolute;
  height: 40px;
  padding: 5px;
  left: 8px;
  top: 75px;
  border-radius: 5px;
}

.lady-of-lake,
.lady-of-sea,
.excalibur {
  display: none;
  height: 30px;
  width: 30px;
  border-radius: 50%;
  border: 3px solid grey;
}

.plot-card {
  height: 30px;
  width: 30px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid grey;
}

.plot-card-active {
  border-color: rgba(65, 105, 225, 0.8);
}

.player-actions-features > * {
  margin-right: 2px;
}

.action-icon {
  z-index: 6;
  position: absolute;
  font-size: 90px;
  top: 12px;
  left: 16px;
}

.player-frame {
  width: 115px;
  height: 115px;
  margin-bottom: 10px;
}

.player-name {
  text-align: center;
  width: 115px;
  background-image: getImagePathByID('core', 'name-frame');
  background-size: 95% 75%;
  background-position: center;
  background-repeat: no-repeat;
  @include dropShadowBorder(rgba(0, 0, 0, 0.5), 1px);
}

.player-name-text {
  width: 110px;
  @include text-overflow(1);
  margin-left: 2.5px;
}

.player-icon {
  border-width: 6px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0);
}

.player-icon {
  border-radius: 50%;
}

.player-name {
  border-radius: 8px;
}

.player-icon {
  position: absolute;
  top: 8px;
  width: 100px;
  height: 100px;
}

.role-container {
  position: absolute;
  top: 13px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
}

// State indication: pulse only the opacity of pre-painted glows.
.player-feature-waitForAction {
  --player-pulse-color: #709eff;
  --player-name-glow: #709effb3;
}

.player-feature-isAssassin {
  --player-pulse-color: #ef6274;
  --player-name-glow: #ef6274;
}

.player-pulse-aura {
  position: absolute;
  top: 0;
  left: 5px;
  width: 115px;
  height: 115px;
  border-radius: 50%;
  box-shadow: 0 0 12px 3px var(--player-pulse-color);
  pointer-events: none;
}

.player-feature-isSelected .player-pulse-aura {
  top: -2px;
  left: 3px;
  width: 119px;
  height: 119px;
  box-shadow:
    0 0 6px 3px var(--player-pulse-color),
    0 0 18px 6px var(--player-pulse-color);
}

.player-feature-waitForAction .player-name,
.player-feature-isAssassin .player-name {
  isolation: isolate;
  filter: none;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: getImagePathByID('core', 'name-frame');
    background-size: 95% 75%;
    background-position: center;
    background-repeat: no-repeat;
    filter: drop-shadow(2px 2px 0 var(--player-name-glow)) drop-shadow(-2px 2px 0 var(--player-name-glow))
      drop-shadow(2px -2px 0 var(--player-name-glow)) drop-shadow(-2px -2px 0 var(--player-name-glow))
      drop-shadow(0 0 5px var(--player-name-glow));
    pointer-events: none;
  }
}

.player-pulse-aura,
.player-feature-waitForAction .player-name::before,
.player-feature-isAssassin .player-name::before {
  animation: player-state-glow 3s cubic-bezier(0.77, 0, 0.175, 1) infinite;
}

@keyframes player-state-glow {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.9;
  }
}

.player-feature-isSelected .player-icon {
  top: -2px;
  left: 3px;
  width: 119px;
  height: 119px;
  border: 3px solid #efd477;
  z-index: 3;
}

.player-mission-arc {
  position: absolute;
  top: 0;
  left: 5px;
  width: 115px;
  height: 115px;
  box-sizing: border-box;
  border: 8px solid #49c9bb;
  border-top-color: #76e3d5;
  border-radius: 50%;
  clip-path: inset(0 0 50% 0);
  box-shadow: inset 0 1px 1px #d6fff680;
  z-index: 2;
  pointer-events: none;
}

.player-state-badge {
  position: absolute;
  width: 29px;
  height: 29px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #222b28;
  border: 1px solid currentColor;
  z-index: 7;
  pointer-events: none;

  svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.player-mission-flag {
  top: 1px;
  left: 82.5px;
  color: #d9fff8;
  background: linear-gradient(#24675e, #133b38);
  border-color: #76e3d5;
  box-shadow: 0 2px 4px #0007;
}

.player-selection-check {
  top: 88px;
  right: 3px;
  color: #efd477;
}

.player-assassin-badge {
  top: 2px;
  left: 3px;
  color: #f2a4a0;
}

// One rotating parent keeps the sparks attached to the bright tip during state updates.
.player-assassin-fire {
  position: absolute;
  top: -2px;
  left: 3px;
  width: 119px;
  height: 119px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  animation: player-assassin-orbit 6s linear infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: conic-gradient(
      transparent 0deg 295deg,
      #ed4861 320deg,
      #ffad78 345deg,
      #fff0cc 353deg,
      #fff0cc 359deg,
      transparent 360deg
    );
    mask: radial-gradient(closest-side, transparent 88%, #000 92%);
    filter: drop-shadow(0 0 3px #ff554f);
  }
}

.player-assassin-spark {
  position: absolute;
  top: 0;
  left: calc(50% - 2px);
  width: 3px;
  height: 10px;
  border-radius: 50%;
  background: #ffe5bb;
  box-shadow: 0 0 4px 1px #f36e5f;
  opacity: 0;
  animation: player-assassin-spark 1.8s ease-out infinite;

  &:nth-child(2) {
    animation-delay: -0.6s;
  }
  &:nth-child(3) {
    animation-delay: -1.2s;
  }
}

.player-premium-assassin .player-assassin-badge {
  background: linear-gradient(#572633, #28151c);
  border-color: #ffc3b0;
}

@keyframes player-assassin-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes player-assassin-spark {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(-30deg) scale(0.6);
  }
  8% {
    opacity: 1;
    transform: translate(-2px, -3px) rotate(-30deg) scale(1);
  }
  48% {
    opacity: 0.8;
  }
  70%,
  100% {
    opacity: 0;
    transform: translate(-22px, -30px) rotate(-45deg) scale(0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .player-assassin-fire {
    animation: none;
    opacity: 0.7;
  }
  .player-assassin-spark {
    display: none;
    animation: none;
  }
  .player-pulse-aura,
  .player-feature-waitForAction .player-name::before,
  .player-feature-isAssassin .player-name::before {
    animation: none;
    opacity: 0.55;
  }
}

.player-feature-isLeader .player-crown {
  display: block;
}

.player-crown {
  z-index: 4;
  display: none;
  background-image: getImagePathByID('core', 'crown');
  background-size: contain;
  background-position: center;
  position: absolute;
  top: -45px;
  left: 5px;
  width: 80px;
  height: 80px;
  transform: rotate(-15deg);
}

:deep(.user-card-dialog) {
  width: auto;
  margin: 0;
  padding: 0;
  background-color: transparent !important;
  box-shadow: none !important;
}

@media (hover: none) {
  .player-container {
    position: relative;

    &:active {
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(var(--v-theme-primary), 0.1);
        border-radius: 8px;
        animation: pulse-touch 0.6s ease-in-out;
      }
    }
  }

  @keyframes pulse-touch {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 0;
    }
  }
}

.close,
.check,
.switch-image {
  display: none;
}

.player-feature-vote-reject .close {
  display: block;
}

.player-feature-kick:hover .close {
  opacity: 0.8;
  display: block;
}

@media (hover: none) {
  .player-feature-kick .close {
    opacity: 0.8;
    display: block;
  }
}

.player-feature-vote-approve .check {
  color: rgb(var(--v-theme-success));
  display: block;
}

.player-feature-vote-forced-approve .check {
  color: rgb(var(--v-theme-info));
  display: block;
}

.player-feature-ladyOfLake-used .lady-of-lake,
.player-feature-ladyOfSea-used .lady-of-sea {
  display: block;
  filter: grayscale(1);
}

.player-feature-ladyOfLake-has .lady-of-lake,
.player-feature-ladyOfSea-has .lady-of-sea,
.player-feature-excalibur-has .excalibur {
  display: block;
}

.player-feature-excalibur-active .excalibur,
.player-feature-ladyOfLake-active .lady-of-lake,
.player-feature-ladyOfSea-active .lady-of-sea {
  display: block;
  border-color: rgba(65, 105, 225, 0.8);
}

/* Style for adjacent players when areYouTheOne card is active */
.player-adjacent .player-icon {
  animation: pulse-gold 2s infinite ease-in-out;
}

@keyframes pulse-gold {
  0% {
    border-color: rgba(255, 245, 50, 0.3);
  }
  50% {
    border-color: rgba(255, 245, 50, 0.642);
  }
  100% {
    border-color: rgba(255, 245, 50, 0.3);
  }
}

.player-feature-switch-toSuccess {
  .icon-evil-mission {
    order: -1;
  }

  .icon-good-mission {
    order: 1;
  }

  .icon-switch {
    color: rgb(var(--v-theme-info));
  }
}

.icon-switch {
  font-size: 40px;
  color: rgb(var(--v-theme-error));
  @include dropShadowBorder(rgba(255, 255, 255, 1), 0.5px);
}

.player-feature-switch-toSuccess,
.player-feature-switch-toFail {
  .switch-image {
    display: flex;
    z-index: 6;
    position: absolute;
    justify-content: space-between;
    align-items: center;
    top: 35px;
  }
}

.icon-evil-mission,
.icon-good-mission {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.icon-good-mission {
  background-image: getImagePathByID('core', 'blue_team_no_background');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-evil-mission {
  background-image: getImagePathByID('core', 'red_team_no_background');
  border: 2px solid rgb(var(--v-theme-error));
  background-size: contain;
}
</style>

<style scoped>
.player-sticker {
  position: absolute;
  top: 3px;
  left: 50%;
  width: 110px;
  height: 110px;
  transform: translateX(-50%);
  pointer-events: none;
}

.player-sticker :deep(.sticker-image) {
  filter: drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff)
    drop-shadow(0 2px 3px #0009);
}
</style>

<style scoped>
.player-message-preview {
  width: min(240px, calc(100vw - 24px));
  padding: 10px 14px;
  border: 1px solid #a48b63;
  border-radius: 12px;
  background: #fff4df;
  color: #29251f;
  text-align: left;
  box-shadow: 0 4px 12px #0005;
  z-index: 15;
  pointer-events: none;
}
.preview-author {
  display: block;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #685438;
}
.preview-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.5;
  margin-top: 4px;
}
.message-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff4df;
  transform: rotate(45deg);
}
.player-message-preview[data-placement='right'] .message-arrow {
  left: -6px;
  border-left: 1px solid #a48b63;
  border-bottom: 1px solid #a48b63;
}
.player-message-preview[data-placement='left'] .message-arrow {
  right: -6px;
  border-right: 1px solid #a48b63;
  border-top: 1px solid #a48b63;
}
.player-message-preview[data-placement='bottom'] .message-arrow {
  top: -6px;
  border-left: 1px solid #a48b63;
  border-top: 1px solid #a48b63;
}
.player-message-preview[data-placement='top'] .message-arrow {
  bottom: -6px;
  border-right: 1px solid #a48b63;
  border-bottom: 1px solid #a48b63;
}
</style>

<style scoped>
.player-content[role='button']:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}
</style>

<style scoped>
.player-name {
  position: relative;
}
.player-voice-status {
  position: absolute;
  top: 50%;
  left: calc(100% - 3px);
  transform: translateY(-50%);
  z-index: 5;
}
.player-voice-status.is-left {
  left: auto;
  right: calc(100% - 3px);
}
</style>
