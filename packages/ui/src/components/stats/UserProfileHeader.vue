<template>
  <section v-if="userState.status === 'ready'" class="preview-profile" :class="{ 'ai-profile': isAiProfile }">
    <Avatar class="avatar" :avatarID="userState.profile.avatar" alt="" />
    <div class="profile-info">
      <div class="profile-header-container">
        <div class="profile-identity">
          <div class="profile-username">
            <span>{{ userState.profile.name }}</span>
            <AdminBadge v-if="userState.profile.isAdmin === true" />
            <PremiumBadge v-else-if="userState.profile.premium" />
          </div>
          <details v-if="!isAiProfile" class="profile-id">
            <summary>ID</summary>
            <span>{{ uuid }}</span>
          </details>
        </div>
      </div>
      <UserProfileDetails v-if="!isAiProfile" :uuid="uuid" />
      <div v-if="userState.profile.aiPersona" class="profile-personality">
        <strong>{{
          userState.profile.aiPersona.key
            ? $t(`aiAgents.${userState.profile.aiPersona.key}.title`)
            : userState.profile.aiPersona.title
        }}</strong>
        <p>
          {{
            userState.profile.aiPersona.key
              ? $t(`aiAgents.${userState.profile.aiPersona.key}.description`)
              : userState.profile.aiPersona.description
          }}
        </p>
      </div>
    </div>
    <nav v-if="!isAiProfile" class="profile-nav">
      <v-btn
        v-if="$route.name !== 'user_stats'"
        variant="text"
        color="primary"
        :to="{ name: 'user_stats', params: { uuid } }"
      >
        <span class="material-icons" aria-hidden="true">insights</span>
        {{ $t('profile.stats') }}
      </v-btn>
      <v-btn
        v-if="$route.name !== 'user_achievements'"
        variant="text"
        color="primary"
        :to="{ name: 'user_achievements', params: { uuid } }"
      >
        <span class="material-icons" aria-hidden="true">emoji_events</span>
        {{ $t('menu.achievements') }}
      </v-btn>
    </nav>
    <div class="profile-stats-container">
      <div v-if="gameStats" class="profile-stats-item">
        <span class="stat-value">{{ gameStats.teams.total.total }}</span>
        <span class="stat-label">{{ $t('userStats.gamesShort') }}</span>
      </div>
      <div v-if="!/^avalon-ai-[1-7]$/.test(uuid)" class="profile-stats-item">
        <UserTrueSkillRating :userID="uuid" appearance="plain" />
      </div>
      <div v-if="gameStats" class="profile-stats-item">
        <span class="stat-value">{{ gameStats.teams.total.total ? `${gameStats.teams.total.winrate} %` : '—' }}</span>
        <span class="stat-label">{{ $t('userStats.winrate') }}</span>
      </div>
      <dl v-if="gameStats" class="profile-stats-item profile-results">
        <div>
          <dt class="stat-label">{{ $t('userStats.wins') }}</dt>
          <dd class="stat-value games-wins">{{ gameStats.teams.total.wins }}</dd>
        </div>
        <div>
          <dt class="stat-label">{{ $t('userStats.lose') }}</dt>
          <dd class="stat-value games-loses">{{ gameStats.teams.total.lose }}</dd>
        </div>
      </dl>
    </div>
  </section>
  <div v-else class="preview-profile-loading" role="status" :aria-label="$t('mainPage.loading')">
    <v-skeleton-loader type="image, text" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, computed } from 'vue';
import PremiumBadge from '@/components/user/PremiumBadge.vue';
import AdminBadge from '@/components/user/AdminBadge.vue';
import Avatar from '@/components/user/Avatar.vue';
import UserProfileDetails from '@/components/stats/UserProfileDetails.vue';
import UserTrueSkillRating from '@/components/stats/UserTrueSkillRating.vue';
import { useStore } from '@/store';
import { TUserStats } from '@/helpers/stats/interface';

export default defineComponent({
  name: 'UserProfileHeader',
  components: { AdminBadge, PremiumBadge, Avatar, UserTrueSkillRating, UserProfileDetails },
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
.preview-profile {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr) auto;
  gap: 24px;
  padding: 24px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
}
// Reset the information-page's generic div margins inside this card.
.preview-profile div,
.preview-profile p {
  margin-bottom: 0;
}
.avatar {
  width: 104px;
  height: 104px;
  object-fit: cover;
  border-radius: 16px;
}
.profile-info,
.profile-identity {
  min-width: 0;
}
.profile-header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.profile-username {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.profile-username > span {
  min-width: 0;
}
.profile-id {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  overflow-wrap: anywhere;
}
.profile-id summary {
  width: fit-content;
  min-height: 44px;
  display: list-item;
  align-content: center;
  cursor: pointer;
  padding-right: 12px;
}
.profile-id[open] > span {
  display: block;
  user-select: all;
}
.profile-id summary:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}
.profile-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.profile-nav :deep(.v-btn) {
  min-height: 44px;
  max-width: 100%;
  text-transform: none;
  letter-spacing: 0;
}
.profile-nav :deep(.v-btn__content) {
  white-space: normal;
  gap: 8px;
}
.profile-personality {
  max-width: 75ch;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.6;
}
.profile-stats-container {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding-top: 20px;
  gap: 20px;
}
.profile-stats-item {
  min-width: 0;
}
.stat-value {
  display: block;
  font-size: 26px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  margin: 0;
}
.stat-label {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.profile-results {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.profile-results > div {
  display: flex;
  flex-direction: column;
}
.profile-results .stat-value {
  order: -1;
}
.games-wins {
  color: color-mix(in srgb, rgb(var(--v-theme-success)) 65%, rgb(var(--v-theme-on-surface)));
}
.games-loses {
  color: color-mix(in srgb, rgb(var(--v-theme-error)) 50%, rgb(var(--v-theme-on-surface)));
}
.preview-profile-loading {
  max-width: 400px;
  padding: 20px 0;
}
@media (max-width: 600px) {
  .preview-profile {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
  }
  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 12px;
  }
  .profile-username {
    font-size: 22px;
  }
  .profile-stats-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 16px;
    padding-top: 16px;
  }
  .stat-value {
    font-size: 23px;
  }
  .profile-info {
    display: contents;
  }
  .profile-header-container {
    min-width: 0;
    align-self: center;
  }
  .profile-info > .profile-details {
    grid-column: 1 / -1;
    margin-top: 0;
  }
  .profile-nav {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
  .profile-personality {
    grid-column: 1 / -1;
  }
}
</style>
