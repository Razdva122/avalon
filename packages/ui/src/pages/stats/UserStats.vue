<template>
  <div class="info-page-content stats-page">
    <h1>{{ $t('userStats.userStatsTitle') }}</h1>
    <div v-if="userState.status === 'ready'" class="preview-profile">
      <Avatar class="avatar mr-2" :avatarID="userState.profile.avatar" />
      <div class="profile-info">
        <div class="profile-username">
          {{ userState.profile.name }}
        </div>
        <div class="info-hint">id: {{ $props.uuid }}</div>
        <div class="profile-games">
          <div class="profile-games-counter">
            <span class="games-wins">
              {{ state?.teams.total.wins }}
            </span>
            -
            <span class="games-loses">
              {{ state?.teams.total.lose }}
            </span>
          </div>
          <div class="info-hint">games</div>
        </div>
        <div>
          <div class="profile-winrate">
            {{ `${state?.teams.total.winrate} %` }}
          </div>
          <div class="info-hint">winrate</div>
        </div>
      </div>
    </div>
    <h2>{{ $t('stats.generalStatsTitle') }}</h2>
    <v-data-table
      class="general-table"
      :headers="generalTable.headers"
      :items="generalTable.data"
      hide-default-footer
      disable-sort
    >
      <template v-slot:item.side="{ value }">
        <span v-if="value === 'good'" class="good-loyalty-icon"></span>
        <span v-if="value === 'evil'" class="evil-loyalty-icon"></span>
        {{ $t('userStats.side' + value) }}
      </template>
    </v-data-table>

    <h2>{{ $t('userStats.lastGamesStatsTitle') }}</h2>
    <v-data-table :headers="lastGamesHeaders" :items="lastGames" hide-default-footer disable-sort>
      <template v-slot:item.role="{ value }">
        <PreviewLink :target="value" />
      </template>
      <template v-slot:item.isWin="{ value }">
        <v-chip v-if="value" color="green"> {{ $t('userStats.winResult') }}</v-chip>
        <v-chip v-else color="red"> {{ $t('userStats.loseResult') }}</v-chip>
      </template>
      <template v-slot:item.gameID="{ value }">
        <div class="gameID" @click="$router.push({ name: 'room', params: { uuid: value } })">
          {{ value }}
        </div>
      </template>
    </v-data-table>

    <UserRatings :userID="uuid" />

    <div class="stats-container d-flex flex-column flex-md-row justify-space-between">
      <div class="teammates-container">
        <h2>{{ $t('userStats.teammatesStatsTitle') }}</h2>
        <v-data-table
          class="teammates-table"
          :headers="simplifiedHeaders"
          :items="teammates"
          hide-default-footer
          disable-sort
        >
          <template v-slot:item="{ item }">
            <tr class="teammate-row" @click="navigateToPlayerStats(item.id)">
              <td>
                <TeammateProfile :teammateID="item.id" />
              </td>
              <td>{{ item.gamesCount }}</td>
              <td>
                <WinrateDisplay :winrate="item.winrate" />
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

      <div class="enemies-container">
        <h2>{{ $t('userStats.enemiesStatsTitle') }}</h2>
        <v-data-table
          class="enemies-table"
          :headers="simplifiedHeaders"
          :items="enemies"
          hide-default-footer
          disable-sort
        >
          <template v-slot:item="{ item }">
            <tr class="enemy-row" @click="navigateToPlayerStats(item.id)">
              <td>
                <TeammateProfile :teammateID="item.id" />
              </td>
              <td>{{ item.gamesCount }}</td>
              <td>
                <WinrateDisplay :winrate="item.winrate" />
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  TGameView,
  TUserStats,
  TTeammateStats,
  prepareUserStats,
  prepareGamesForView,
  preparePlayerStats,
} from '@/helpers/stats';
import { socket } from '@/api/socket';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import UserRatings from '@/components/stats/UserRatings.vue';
import { VisualGameState } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';
import { useStore } from '@/store';

export default defineComponent({
  name: 'UserStats',
  components: {
    PreviewLink,
    Avatar,
    TeammateProfile,
    WinrateDisplay,
    UserRatings,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const state = ref<TUserStats>();
    const gamesState = ref<VisualGameState[]>();
    const lastGames = ref<TGameView[]>();
    const teammates = ref<TTeammateStats[]>();
    const enemies = ref<TTeammateStats[]>();
    const store = useStore();

    const userState = computed(() => {
      return store.state.users[props.uuid] || { status: 'loading' };
    });

    const { t } = useI18n();

    const initState = async (uuid: string) => {
      const games = await socket.emitWithAck('getPlayerGames', uuid);
      state.value = prepareUserStats(games, uuid);
      lastGames.value = prepareGamesForView(games, uuid, 5);

      // Use the new combined function with different relation parameters
      teammates.value = preparePlayerStats(games, uuid, 'teammate');
      enemies.value = preparePlayerStats(games, uuid, 'enemy');

      store.dispatch('getUserPublicProfile', { uuid });

      gamesState.value = games;
    };

    watch(
      () => props.uuid,
      (newUUID) => {
        initState(newUUID);
      },
    );

    const router = useRouter();

    const navigateToPlayerStats = (playerID: string) => {
      router.push({ name: 'user_stats', params: { uuid: playerID } });
    };

    await initState(props.uuid);

    const generalTable = computed(() => {
      const stateData = state.value!;
      return {
        headers: [
          { title: t('userStats.side'), key: 'side' },
          { title: t('userStats.gamesCount'), key: 'gamesCount' },
          { title: t('userStats.wins'), key: 'wins' },
        ],
        data: Object.entries(stateData.teams)
          .filter(([name]) => name !== 'total')
          .map(([name, value]) => {
            return {
              side: name,
              gamesCount: value.total,
              wins: `${value.wins} (${value.winrate} %)`,
            };
          }),
      };
    });

    const lastGamesHeaders = computed(() => {
      return [
        { title: t('userStats.role'), key: 'role' },
        { title: t('userStats.result'), key: 'isWin' },
        { title: t('userStats.game'), key: 'gameID' },
      ];
    });

    const teammatesHeaders = computed(() => {
      return [
        { title: t('userStats.playerName'), key: 'id' },
        { title: t('userStats.gamesCount'), key: 'gamesCount' },
        { title: t('userStats.wins'), key: 'wins' },
        { title: t('userStats.lose'), key: 'lose' },
        { title: t('userStats.winrate'), key: 'winrate' },
      ];
    });

    const simplifiedHeaders = computed(() => {
      return [
        { title: t('userStats.playerName'), key: 'id' },
        { title: t('userStats.gamesCount'), key: 'gamesCount' },
        { title: t('userStats.winrate'), key: 'winrate' },
      ];
    });

    return {
      state,
      gamesState,
      lastGames,
      lastGamesHeaders,
      generalTable,
      userState,
      navigateToPlayerStats,
      enemies,
      teammates,
      teammatesHeaders,
      simplifiedHeaders,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.stats-page {
  .good-loyalty-icon,
  .evil-loyalty-icon {
    width: 36px;
    height: 36px;
  }
}

.general-table {
  .good-loyalty-icon,
  .evil-loyalty-icon {
    width: 24px;
    height: 24px;
  }
}

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

.stats-container {
  gap: 20px;

  @media (max-width: 600px) {
    gap: 30px;
  }
}

.teammates-container,
.enemies-container {
  width: 100%;
}

@media (min-width: 960px) {
  .teammates-container,
  .enemies-container {
    width: 48%;
  }
}

.teammates-table,
.enemies-table {
  margin-bottom: 20px;
}

.teammate-row,
.enemy-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.teammate-row:hover,
.enemy-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.teammates-table :deep(td),
.enemies-table :deep(td) {
  height: 70px;
  padding: 8px 16px;

  @media (max-width: 600px) {
    height: 60px;
    padding: 6px 8px;
  }
}

.teammates-table :deep(td:first-child),
.enemies-table :deep(td:first-child) {
  width: 250px;
  min-width: 250px;

  @media (max-width: 600px) {
    width: 140px;
    min-width: 140px;
  }
}

.teammates-table :deep(td:nth-child(2)),
.enemies-table :deep(td:nth-child(2)) {
  width: 100px;

  @media (max-width: 600px) {
    width: 30px;
    font-size: 14px;
  }
}

.teammates-table :deep(td:nth-child(3)),
.enemies-table :deep(td:nth-child(3)) {
  width: 100px;

  @media (max-width: 600px) {
    width: 80px;
    font-size: 14px;
    text-align: center;
  }
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

.gameID {
  cursor: pointer;
}
</style>
