<template>
  <v-btn class="rating-panel" color="primary" @click="dialog = !dialog" :disabled="loading || !gameFinished">
    {{ $t('stats.result') }}
  </v-btn>
  <v-overlay v-model="dialog" class="align-center justify-center">
    <div class="rating-actions d-flex flex-column align-center pa-4 rounded-lg">
      <div class="d-flex justify-space-between align-center w-100 mb-4">
        <h2>{{ $t('stats.result') }}</h2>
        <v-btn @click="dialog = false" size="regular">
          <template v-slot:prepend>
            <span class="material-icons close-icon"> close </span>
          </template>
        </v-btn>
      </div>
      <div v-if="loading" class="d-flex justify-center align-center pa-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-else>
        <div class="teams-container">
          <!-- Good Team -->
          <v-card class="team-card good-team mb-4">
            <v-card-title class="team-title">
              <div class="loyalty-icon good-loyalty-icon mr-2"></div>
              {{ $t('stats.goodTeam') }}
              <span class="team-result" :class="gameResult === 'good' ? 'win' : 'loss'">
                {{ gameResult === 'good' ? $t('stats.win') : $t('stats.loss') }}
              </span>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="goodTeamHeaders"
                :items="goodTeamPlayers"
                :items-per-page="-1"
                hide-default-footer
                class="elevation-1"
                dense
              >
                <template v-slot:item.userID="{ item }">
                  <div class="player-cell" @click="navigateToPlayerStats(item.userID)">
                    <UserPreview :userID="item.userID" size="large"></UserPreview>
                  </div>
                </template>

                <template v-slot:item.role="{ item }">
                  <div class="role-cell">
                    <PreviewLink v-if="isMobile" :target="item.role" text="" />
                    <PreviewLink v-else :target="item.role" />
                  </div>
                </template>

                <template v-slot:item.oldMu="{ item }">
                  {{ Math.round(item.oldMu) }}
                </template>

                <template v-slot:item.newMu="{ item }">
                  {{ Math.round(item.newMu) }}
                </template>

                <template v-slot:item.muChange="{ item }">
                  <span :class="item.muChange > 0 ? 'positive-change' : 'negative-change'">
                    {{ item.muChange > 0 ? '+' : '' }}{{ Math.round(item.muChange) }}
                  </span>
                </template>

                <template v-slot:item.combinedRating="{ item }">
                  {{ Math.round(item.newMu) }}
                  <span :class="item.muChange > 0 ? 'positive-change' : 'negative-change'">
                    ({{ item.muChange > 0 ? '+' : '' }}{{ Math.round(item.muChange) }})
                  </span>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>

          <!-- Evil Team -->
          <v-card class="team-card evil-team">
            <v-card-title class="team-title">
              <div class="loyalty-icon evil-loyalty-icon mr-2"></div>
              {{ $t('stats.evilTeam') }}
              <span class="team-result" :class="gameResult === 'evil' ? 'win' : 'loss'">
                {{ gameResult === 'evil' ? $t('stats.win') : $t('stats.loss') }}
              </span>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="evilTeamHeaders"
                :items="evilTeamPlayers"
                :items-per-page="-1"
                hide-default-footer
                class="elevation-1"
                dense
              >
                <template v-slot:item.userID="{ item }">
                  <div class="player-cell" @click="navigateToPlayerStats(item.userID)">
                    <UserPreview :userID="item.userID" size="large"></UserPreview>
                  </div>
                </template>

                <template v-slot:item.role="{ item }">
                  <div class="role-cell">
                    <PreviewLink v-if="isMobile" :target="item.role" text="" />
                    <PreviewLink v-else :target="item.role" />
                  </div>
                </template>

                <template v-slot:item.oldMu="{ item }">
                  {{ Math.round(item.oldMu) }}
                </template>

                <template v-slot:item.newMu="{ item }">
                  {{ Math.round(item.newMu) }}
                </template>

                <template v-slot:item.muChange="{ item }">
                  <span :class="item.muChange > 0 ? 'positive-change' : 'negative-change'">
                    {{ item.muChange > 0 ? '+' : '' }}{{ Math.round(item.muChange) }}
                  </span>
                </template>

                <template v-slot:item.combinedRating="{ item }">
                  {{ Math.round(item.newMu) }}
                  <span :class="item.muChange > 0 ? 'positive-change' : 'negative-change'">
                    ({{ item.muChange > 0 ? '+' : '' }}{{ Math.round(item.muChange) }})
                  </span>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import type { VisualGameState, GameTrueSkillResult } from '@avalon/types';
import UserPreview from '@/components/user/UserPreview.vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { useResponsive } from '@/helpers/composables';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  name: 'RatingChangesPanel',
  components: {
    UserPreview,
    PlayerIcon,
    PreviewLink,
  },
  props: {
    gameID: {
      type: String,
      required: true,
    },
    gameState: {
      type: Object as () => VisualGameState,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const router = useRouter();
    const dialog = ref(false);
    const loading = ref(false);
    const error = ref('');
    const results = ref<GameTrueSkillResult | null>();

    const gameFinished = computed(() => {
      return props.gameState.stage === 'end' && props.gameState.result?.winner;
    });

    const gameResult = computed(() => {
      return props.gameState.result?.winner || '';
    });

    // Use the responsive composable
    const { isMobile } = useResponsive();

    // Headers for the good team data table
    const goodTeamHeaders = computed(() => {
      if (isMobile.value) {
        return [
          { title: t('stats.player'), value: 'userID' },
          { title: t('stats.role'), value: 'role' },
          { title: t('stats.rating'), value: 'combinedRating' },
        ];
      } else {
        return [
          { title: t('stats.player'), value: 'userID' },
          { title: t('stats.role'), value: 'role' },
          { title: t('stats.oldRating'), value: 'oldMu' },
          { title: t('stats.newRating'), value: 'newMu' },
          { title: t('stats.change'), value: 'muChange' },
        ];
      }
    });

    // Headers for the evil team data table
    const evilTeamHeaders = computed(() => {
      if (isMobile.value) {
        return [
          { title: t('stats.player'), value: 'userID' },
          { title: t('stats.role'), value: 'role' },
          { title: t('stats.rating'), value: 'combinedRating' },
        ];
      } else {
        return [
          { title: t('stats.player'), value: 'userID' },
          { title: t('stats.role'), value: 'role' },
          { title: t('stats.oldRating'), value: 'oldMu' },
          { title: t('stats.newRating'), value: 'newMu' },
          { title: t('stats.change'), value: 'muChange' },
        ];
      }
    });

    const goodTeamPlayers = computed(() => {
      return results.value?.playerChanges
        .filter((player) => player.team === 'good')
        .sort((a, b) => (b.oldMu ?? 0) - (a.oldMu ?? 0));
    });

    const evilTeamPlayers = computed(() => {
      return results.value?.playerChanges
        .filter((player) => player.team === 'evil')
        .sort((a, b) => (b.oldMu ?? 0) - (a.oldMu ?? 0));
    });

    const fetchRatingChanges = async () => {
      if (!props.gameID) return;

      loading.value = true;
      error.value = '';

      try {
        const result = await socket.emitWithAck('getMatchTrueSkillChanges', props.gameID);

        if (!result.success || result.error) {
          error.value = result.error || 'Failed to load rating changes';
          return;
        }

        results.value = result.gameResult;
      } catch (err) {
        console.error('Error fetching rating changes:', err);
        error.value = 'An error occurred while loading rating changes';
      } finally {
        loading.value = false;
      }
    };

    const handleShowRatingPanel = () => {
      if (gameFinished.value) {
        dialog.value = true;
      }
    };

    onMounted(() => {
      eventBus.on('showRatingPanel', handleShowRatingPanel);
    });

    onBeforeUnmount(() => {
      eventBus.off('showRatingPanel', handleShowRatingPanel);
    });

    watch(dialog, (isOpen) => {
      if (isOpen && gameFinished.value) {
        fetchRatingChanges();
      }
    });

    const navigateToPlayerStats = (uuid: string) => {
      router.push({ name: 'user_stats', params: { uuid } });
    };

    return {
      dialog,
      loading,
      error,
      goodTeamPlayers,
      evilTeamPlayers,
      goodTeamHeaders,
      evilTeamHeaders,
      gameFinished,
      gameResult,
      isMobile,
      navigateToPlayerStats,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/loyalty-icons.scss';

.rating-actions {
  background-color: rgb(var(--v-theme-surface));
  width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.teams-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.team-card {
  border: 2px solid;
  border-radius: 8px;
}

.good-team {
  border-color: rgb(var(--v-theme-success));
}

.evil-team {
  border-color: rgb(var(--v-theme-error));
}

.team-title {
  display: flex;
  align-items: center;
}

.team-result {
  margin-left: auto;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
}

.win {
  background-color: rgba(var(--v-theme-success), 0.2);
  color: rgb(var(--v-theme-success));
}

.loss {
  background-color: rgba(var(--v-theme-error), 0.2);
  color: rgb(var(--v-theme-error));
}

.positive-change {
  color: rgb(var(--v-theme-success));
  font-weight: bold;
}

.negative-change {
  color: rgb(var(--v-theme-error));
  font-weight: bold;
}

.error-message {
  color: rgb(var(--v-theme-error));
  text-align: center;
  padding: 16px;
}

.loyalty-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-block;
}

.player-cell {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.role-cell {
  display: flex;
  align-items: center;
}

.player-icon-image {
  width: 24px;
  height: 24px;
}

.close-icon {
  font-size: 30px;
  width: 32px;
  height: 30px;
}

@media (max-width: 700px) {
  .teams-container {
    gap: 10px;
  }

  .rating-actions {
    width: 95vw;
  }
}
</style>
