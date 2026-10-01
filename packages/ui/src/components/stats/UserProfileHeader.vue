<template>
  <div v-if="userState.status === 'ready'" class="preview-profile" :class="{ 'ai-profile': isAiProfile }">
    <Avatar class="avatar mr-2" :avatarID="userState.profile.avatar" />
    <div class="profile-info">
      <div class="profile-header-container">
        <div class="profile-username">
          {{ userState.profile.name }}
          <AdminBadge v-if="userState.profile.isAdmin === true" />
          <PremiumBadge v-else-if="userState.profile.premium" />
        </div>
        <div class="profile-nav-icons">
          <v-btn
            v-if="!isAiProfile"
            :aria-label="$t('userStats.userStatsTitle')"
            icon
            variant="text"
            density="comfortable"
            size="small"
            :to="`/stats/user/${uuid}`"
          >
            <span class="material-icons profile-icon">insights</span>
          </v-btn>
          <v-btn
            v-if="!isAiProfile"
            :aria-label="$t('menu.achievements')"
            icon
            variant="text"
            density="comfortable"
            size="small"
            :to="`/achievements/user/${uuid}`"
          >
            <span class="material-icons profile-icon">emoji_events</span>
          </v-btn>
        </div>
      </div>
      <div v-if="!isAiProfile" class="info-hint">id: {{ uuid }}</div>
      <div v-if="userState.profile.aiPersona" class="profile-personality text-body-2 mt-2">
        <strong>{{
          userState.profile.aiPersona.key
            ? $t(`aiAgents.${userState.profile.aiPersona.key}.title`)
            : userState.profile.aiPersona.title
        }}</strong>
        <p class="mt-1">
          {{
            userState.profile.aiPersona.key
              ? $t(`aiAgents.${userState.profile.aiPersona.key}.description`)
              : userState.profile.aiPersona.description
          }}
        </p>
      </div>
      <div class="profile-stats-container">
        <div v-if="gameStats" class="profile-stats-item">
          <v-chip variant="tonal">{{ gameStats.teams.total.total }}</v-chip>
          <div class="info-hint">{{ $t('userStats.gamesShort') }}</div>
        </div>
        <div v-if="!/^avalon-ai-[1-7]$/.test(uuid)" class="profile-stats-item">
          <UserTrueSkillRating :userID="uuid" />
        </div>
        <div v-if="gameStats" class="profile-stats-item">
          <span v-if="!gameStats.teams.total.total" class="empty-stat">—</span>
          <WinrateDisplay v-else :winrate="gameStats.teams.total.winrate.toString()" />
          <div class="info-hint">{{ $t('userStats.winrate') }}</div>
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
          <div class="info-hint">{{ $t('userStats.winsLosses') }}</div>
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
import PremiumBadge from '@/components/user/PremiumBadge.vue';
import AdminBadge from '@/components/user/AdminBadge.vue';
import Avatar from '@/components/user/Avatar.vue';
import UserTrueSkillRating from '@/components/stats/UserTrueSkillRating.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import { useStore } from '@/store';
import { TUserStats } from '@/helpers/stats/interface';

export default defineComponent({
  name: 'UserProfileHeader',
  components: { AdminBadge, PremiumBadge, Avatar, UserTrueSkillRating, WinrateDisplay },
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
    const isAiProfile = computed(() => /^avalon-(?:agent-(?:[1-9]|10)|ai-[1-7])$/.test(props.uuid));

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
      isAiProfile,
      userState,
    };
  },
});
</script>

<style scoped lang="scss">
.ai-profile .profile-info {
  flex: 1;
  min-width: 0;
}
.ai-profile .profile-header-container {
  flex-wrap: wrap;
}
@media (max-width: 480px) {
  .preview-profile.ai-profile {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 12px;
  }
  .ai-profile .profile-info {
    display: contents;
  }
  .ai-profile .profile-header-container {
    align-self: center;
  }
  .ai-profile .profile-personality,
  .ai-profile .profile-stats-container {
    grid-column: 1 / -1;
  }
  .ai-profile .profile-stats-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .ai-profile .avatar {
    width: 96px;
    height: 96px;
    flex-shrink: 0;
  }
  .ai-profile .profile-username {
    font-size: 20px;
  }
}
.profile-personality {
  max-width: 75ch;
  line-height: 1.6;
}
.empty-stat {
  display: inline-flex;
  align-items: center;
  height: 32px;
}
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
