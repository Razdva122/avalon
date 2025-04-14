<template>
  <v-card class="user-hover-card" elevation="4">
    <div class="user-header pa-3">
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
    </div>

    <v-divider></v-divider>
    <div class="pa-3">
      <div class="overall-stats mb-2">
        <div class="d-flex justify-space-between mb-2">
          <div class="stat-label">{{ $t('stats.totalGames') }}:</div>
          <div class="stat-value" v-if="!loading">{{ totalGames }}</div>
          <v-skeleton-loader v-else type="text" width="40" />
        </div>
        <div class="d-flex justify-space-between">
          <div class="stat-label">{{ $t('stats.winrate') }}:</div>
          <div class="stat-value" v-if="!loading">
            <WinrateDisplay :winrate="overallWinrate.toString()" />
          </div>
          <v-skeleton-loader v-else type="text" width="60" />
        </div>
      </div>

      <v-divider class="my-2"></v-divider>
      <div class="top-roles-title mt-2">{{ $t('stats.topRoles') }}</div>
      <div v-if="!loading && topRoles.length > 0" class="top-roles-list">
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
      <div v-else-if="!loading && topRoles.length === 0" class="no-roles-message">
        {{ $t('stats.noRolesData') }}
      </div>
      <v-skeleton-loader v-else type="list-item-three-line" />
    </div>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, onMounted } from 'vue';
import { useUserProfile } from '@/helpers/composables';
import { socket } from '@/api/socket';
import Avatar from '@/components/user/Avatar.vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import { RoleRating } from '@avalon/types';

export default defineComponent({
  name: 'UserHoverCard',
  components: {
    Avatar,
    PlayerIcon,
    WinrateDisplay,
  },
  props: {
    userID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { userState } = useUserProfile(props.userID);
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

    // Calculate overall stats
    const calculateOverallStats = (ratings: RoleRating[]) => {
      if (!ratings || ratings.length === 0) {
        totalGames.value = 0;
        overallWinrate.value = 0;
        return;
      }

      let totalGamesCount = 0;
      let weightedWinrate = 0;

      ratings.forEach((role) => {
        totalGamesCount += role.gamesCount;
        weightedWinrate += role.winrate * role.gamesCount;
      });

      totalGames.value = totalGamesCount;
      overallWinrate.value = totalGamesCount > 0 ? parseFloat((weightedWinrate / totalGamesCount).toFixed(2)) : 0;
    };

    // Fetch user ratings
    const fetchUserRatings = (userID: string) => {
      loading.value = true;

      socket.emit('getUserRatings', userID, (response) => {
        if ('error' in response) {
          console.error('Error fetching user ratings:', response.error);
          userRatings.value = [];
        } else {
          userRatings.value = response;
          calculateOverallStats(response);
        }

        loading.value = false;
      });
    };

    watch(
      () => props.userID,
      (newUserID) => {
        if (newUserID) {
          fetchUserRatings(newUserID);
        }
      },
    );

    onMounted(() => {
      fetchUserRatings(props.userID);
    });

    return {
      userState,
      userRatings,
      loading,
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

  // Оптимизация для мобильных устройств
  @media (max-width: 600px) {
    width: 90vw; // Использование viewport width для лучшего отображения на мобильных
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
