<template>
  <div v-if="userState.status === 'ready'" class="preview-profile">
    <Avatar class="avatar mr-2" :avatarID="userState.profile.avatar" />
    <div class="profile-info">
      <div class="profile-username">
        {{ userState.profile.name }}
      </div>
      <div class="info-hint">id: {{ uuid }}</div>
      <div v-if="gameStats" class="profile-games">
        <div class="profile-games-counter">
          <span class="games-wins">
            {{ gameStats.teams.total.wins }}
          </span>
          -
          <span class="games-loses">
            {{ gameStats.teams.total.lose }}
          </span>
        </div>
        <div class="info-hint">games</div>
      </div>
      <div v-if="gameStats">
        <div class="profile-winrate">
          {{ `${gameStats.teams.total.winrate} %` }}
        </div>
        <div class="info-hint">winrate</div>
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
import { useStore } from '@/store';
import { TUserStats } from '@/helpers/stats/interface';

export default defineComponent({
  name: 'UserProfileHeader',
  components: {
    Avatar,
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

.profile-games-counter {
  background-color: rgb(var(--v-theme-inset));
  font-weight: 500;
  width: fit-content;
  padding: 0px 8px;
  border-radius: 8px;
}

.preview-profile-loading {
  width: 100%;
  max-width: 400px;
  padding: 20px 0;
}
</style>
