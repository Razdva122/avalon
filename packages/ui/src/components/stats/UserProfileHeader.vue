<template>
  <div v-if="userState.status === 'ready'" class="preview-profile">
    <Avatar class="avatar mr-2" :avatarID="userState.profile.avatar" />
    <div class="profile-info">
      <div class="profile-header-container">
        <div class="profile-username">
          {{ userState.profile.name }}
        </div>
        <div class="profile-nav-icons">
          <v-btn icon variant="text" density="comfortable" size="small" :to="`/stats/user/${uuid}`">
            <span class="material-icons profile-icon">insights</span>
          </v-btn>
          <v-btn icon variant="text" density="comfortable" size="small" :to="`/achievements/user/${uuid}`">
            <span class="material-icons profile-icon">emoji_events</span>
          </v-btn>
        </div>
      </div>
      <div class="info-hint">id: {{ uuid }}</div>
      <div class="profile-stats-container">
        <div class="profile-stats-item">
          <UserTrueSkillRating :userID="uuid" />
        </div>
        <div v-if="gameStats" class="profile-stats-item">
          <WinrateDisplay :winrate="gameStats.teams.total.winrate.toString()" />
          <div class="info-hint">winrate</div>
        </div>
        <div v-if="gameStats" class="profile-stats-item">
          <v-chip color="inset" variant="flat" size="default" class="font-weight-medium">
            <span class="games-wins">
              {{ gameStats.teams.total.wins }}
            </span>
            -
            <span class="games-loses">
              {{ gameStats.teams.total.lose }}
            </span>
          </v-chip>
          <div class="info-hint">games</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="preview-profile-loading">
    <v-skeleton-loader type="image, text" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, computed } from 'vue';
import Avatar from '@/components/user/Avatar.vue';
import UserTrueSkillRating from '@/components/stats/UserTrueSkillRating.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import { useStore } from '@/store';
import { TUserStats } from '@/helpers/stats/interface';

export default defineComponent({
  name: 'UserProfileHeader',
  components: {
    Avatar,
    UserTrueSkillRating,
    WinrateDisplay,
  },
  props: {
    uuid: {
      type: String,
      required: true,
    },
    gameStats: {
      type: Object as PropType<TUserStats>,
      required: false,
    },
  },
  setup(props) {
    const store = useStore();

    const userState = computed(() => {
      return store.state.users[props.uuid] || { status: 'loading' };
    });

    watch(
      () => props.uuid,
      (newUuid) => {
        if (!store.state.users[newUuid]) {
          store.dispatch('getUserPublicProfile', { uuid: newUuid });
        }
      },
      { immediate: true },
    );

    return {
      userState,
    };
  },
});
</script>

<style scoped lang="scss">
.avatar {
  width: 150px;
  height: 150px;
}

.profile-header-container {
  display: flex;
  align-items: center;
}

.profile-nav-icons {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.profile-icon {
  color: rgb(var(--v-theme-text-primary));
}

.profile-stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.preview-profile {
  display: flex;
}

.profile-info div {
  margin-bottom: 0px;
}

.profile-username {
  font-size: 24px;
}

.info-hint {
  font-size: 14px;
  opacity: 0.8;
  margin-top: -2px;
}

.games-wins {
  color: rgb(var(--v-theme-success));
}

.games-loses {
  color: rgb(var(--v-theme-error));
}

.preview-profile-loading {
  width: 100%;
  max-width: 400px;
  padding: 20px 0;
}
</style>
