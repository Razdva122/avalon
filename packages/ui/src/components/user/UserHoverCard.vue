<template>
  <v-card
    class="user-hover-card"
    :class="{ 'compact-profile': compact }"
    :elevation="compact ? 0 : 4"
    :rounded="compact ? 'xl' : undefined"
  >
    <div class="user-header pa-3">
      <div class="d-flex justify-space-between">
        <div class="d-flex align-center">
          <div class="avatar-container mr-3">
            <Avatar v-if="userState.status === 'ready'" :avatarID="userState.profile.avatar" class="user-avatar" />
            <v-skeleton-loader v-else type="avatar" class="user-avatar-skeleton" />
          </div>
          <div class="user-info">
            <div class="username" v-if="userState.status === 'ready'">
              {{ userState.profile.name }}
            </div>
            <v-skeleton-loader v-else type="text" width="120" />
          </div>
        </div>
        <div v-if="!compact" class="trueskill-rating">
          <UserTrueSkillRating :userID="userID" />
        </div>
        <slot name="actions" />
      </div>
    </div>

    <v-divider v-if="!compact"></v-divider>
    <div class="pa-3">
      <div v-if="loadError" class="mb-2" role="alert">
        {{ $t('userStats.loadError') }}
        <v-btn variant="text" size="small" @click="retry">{{ $t('support.retry') }}</v-btn>
      </div>
      <div v-else class="overall-stats mb-2">
        <div class="d-flex justify-space-between mb-2">
          <div class="stat-label">{{ $t('stats.totalGames') }}:</div>
          <div class="stat-value" v-if="!loading">{{ totalGames }}</div>
          <v-skeleton-loader v-else type="text" width="40" />
        </div>
        <div class="d-flex justify-space-between">
          <div class="stat-label">{{ $t('stats.winrate') }}:</div>
          <div class="stat-value" v-if="!loading">
            <span v-if="compact && totalGames === 0">—</span>
            <WinrateDisplay v-else :winrate="overallWinrate.toString()" />
          </div>
          <v-skeleton-loader v-else type="text" width="60" />
        </div>
      </div>

      <template v-if="!compact">
        <v-divider class="my-2"></v-divider>
        <div class="top-roles-title mt-2">{{ $t('stats.topRoles') }}</div>
        <div v-if="!ratingsLoading && topRoles.length > 0" class="top-roles-list">
          <div v-for="(role, index) in topRoles" :key="role.role">
            <div class="top-role-item d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <div class="role-rank">{{ index + 1 }}.</div>
                <PlayerIcon :icon="role.role" class="role-icon mx-1" />
                <div class="role-name">{{ $t(`roles.${role.role}`) }}</div>
              </div>
              <div class="role-rating">{{ role.rating }}</div>
            </div>
            <v-divider v-if="index < topRoles.length - 1" class="my-1"></v-divider>
          </div>
        </div>
        <div v-else-if="!ratingsLoading && topRoles.length === 0" class="no-roles-message">
          {{ $t('stats.noRolesData') }}
        </div>
        <v-skeleton-loader v-else type="list-item-three-line" />
      </template>
    </div>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onUnmounted, toRef } from 'vue';
import { useUserProfile } from '@/helpers/composables';
import { socket } from '@/api/socket';
import Avatar from '@/components/user/Avatar.vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import UserTrueSkillRating from '@/components/stats/UserTrueSkillRating.vue';
import { prepareUserStats } from '@/helpers/stats';
import { RoleRating } from '@avalon/types';

export default defineComponent({
  name: 'UserHoverCard',
  components: {
    Avatar,
    PlayerIcon,
    WinrateDisplay,
    UserTrueSkillRating,
  },
  props: {
    compact: { type: Boolean, default: false },
    userID: {
      type: String,
      required: true,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { userState } = useUserProfile(toRef(props, 'userID'));
    const userRatings = ref<RoleRating[]>([]);
    const loading = ref(true);
    const totalGames = ref(0);
    const overallWinrate = ref(0);

    // Get top 3 roles by rating
    const topRoles = computed(() => {
      if (!userRatings.value || userRatings.value.length === 0) return [];

      return [...userRatings.value]
        .filter((role) => role.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    });

    const loadError = ref(false);
    const ratingsLoading = ref(true);
    let requestId = 0;
    let loadedUserID = '';
    let fetching = false;
    onUnmounted(() => {
      requestId++;
    });

    const fetchUserStats = async (userID: string) => {
      const currentRequest = ++requestId;
      fetching = true;
      loading.value = true;
      ratingsLoading.value = true;
      loadError.value = false;
      userRatings.value = [];
      // Role rankings are optional and must not determine overall game statistics.
      if (!props.compact)
        void socket
          .timeout(10000)
          .emitWithAck('getUserRatings', userID)
          .then((response) => {
            if (currentRequest === requestId && !('error' in response)) userRatings.value = response;
          })
          .catch(() => {})
          .finally(() => {
            if (currentRequest === requestId) ratingsLoading.value = false;
          });
      else ratingsLoading.value = false;
      try {
        const games = await socket.timeout(20000).emitWithAck('getPlayerGameSummaries', userID);
        if (currentRequest !== requestId) return;
        if (!games) throw new Error('Player statistics unavailable');
        const stats = prepareUserStats(games, userID).teams.total;
        totalGames.value = stats.total;
        overallWinrate.value = Number(stats.winrate);
        loadedUserID = userID;
      } catch {
        if (currentRequest === requestId) loadError.value = true;
      } finally {
        if (currentRequest === requestId) {
          loading.value = false;
          fetching = false;
        }
      }
    };

    watch(
      () => [props.userID, props.isVisible] as const,
      ([userID, isVisible], previous) => {
        if (!previous || userID !== previous[0]) {
          requestId++;
          loadedUserID = '';
          fetching = false;
          totalGames.value = 0;
          overallWinrate.value = 0;
          userRatings.value = [];
          loading.value = true;
          ratingsLoading.value = true;
          loadError.value = false;
        }
        if (isVisible && userID && loadedUserID !== userID && !fetching) void fetchUserStats(userID);
      },
      { immediate: true },
    );
    const retry = () => {
      if (!fetching) void fetchUserStats(props.userID);
    };

    return {
      userState,
      userRatings,
      loading,
      ratingsLoading,
      loadError,
      retry,
      topRoles,
      totalGames,
      overallWinrate,
    };
  },
});
</script>

<style scoped lang="scss">
.user-hover-card {
  border-radius: 8px;
  overflow: hidden;
  width: 300px;
  box-shadow: 0 4px 8px rgba(var(--v-theme-shadow), 0.5) !important; /* Stronger shadow for better visibility */
  border: 3px solid rgba(var(--v-theme-on-surface), 0.1);
}

.trueskill-rating {
  display: flex;
  align-items: flex-start;
  margin-left: 8px;

  @media (max-width: 600px) {
    max-width: 300px;
  }
}

.avatar-container {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar-skeleton {
  width: 60px;
  height: 60px;
}

.username {
  font-size: 18px;
  font-weight: 600;
}

.stat-label {
  font-size: 14px;
}

.stat-value {
  font-weight: 500;
  font-size: 14px;
}

.top-roles-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.top-roles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 4px;
  border-radius: 6px;
}

.top-role-item {
  border-radius: 4px;
}

.role-rank {
  font-size: 14px;
  font-weight: 500;
  margin-right: 4px;
  width: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.role-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.role-name {
  font-size: 14px;
  margin-left: 4px;
  color: rgb(var(--v-theme-on-surface));
}

.role-rating {
  font-weight: 700;
  font-size: 14px;
  color: rgb(var(--v-theme-primary));
  padding: 2px 6px;
  border-radius: 4px;
}

.no-roles-message {
  font-style: italic;
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-align: center;
  padding: 8px 0;
}
</style>

<style scoped lang="scss">
.compact-profile {
  width: min(360px, calc(100vw - 48px));
  max-width: 100%;
  margin: auto;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.15);
  border-radius: 20px;
  box-shadow: none !important;
  color: rgb(var(--v-theme-text-primary));
  .user-header > div {
    align-items: flex-start;
    gap: 8px;
  }
  .user-header > div > div:first-child {
    min-width: 0;
  }
  .user-info {
    min-width: 0;
  }
  .username {
    font-size: 16px;
    overflow-wrap: anywhere;
    line-height: 1.4;
  }
  .avatar-container,
  .user-avatar,
  .user-avatar-skeleton {
    width: 48px;
    height: 48px;
  }
  .overall-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .overall-stats > div {
    flex-direction: column;
    gap: 6px;
    margin-bottom: 0 !important;
    padding: 12px;
    border-radius: 12px;
    background: rgb(var(--v-theme-inset));
  }
  .stat-label {
    font-size: 12px;
  }
  .stat-value {
    font-size: 20px;
    font-weight: 600;
  }
}
</style>
