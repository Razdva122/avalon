<template>
  <div class="info-page-content stats-page">
    <h1>{{ $t('userStats.userStatsTitle') }}</h1>
    <div v-if="userForUi" class="preview-profile">
      <Avatar class="avatar mr-2" :avatarID="userForUi.avatar" />
      <div class="profile-info">
        <div class="profile-username">
          {{ userForUi.name }}
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
    <v-data-table class="general-table" :headers="generalTable.headers" :items="generalTable.data" hide-default-footer>
      <template v-slot:item.side="{ value }">
        <span v-if="value === 'good'" class="good-loyalty-icon"></span>
        <span v-if="value === 'evil'" class="evil-loyalty-icon"></span>
        {{ $t('userStats.side' + value) }}
      </template>
    </v-data-table>

    <v-data-table :headers="lastGamesHeaders" :items="lastGames" hide-default-footer>
      <template v-slot:item.role="{ value }">
        <PreviewLink :target="value" />
      </template>
      <template v-slot:item.isWin="{ value }">
        {{ value ? $t('userStats.winResult') : $t('userStats.loseResult') }}
      </template>
    </v-data-table>

    <div v-for="side in <const>['good', 'evil']" :key="side">
      <h2 v-if="side === 'good'"><span class="good-loyalty-icon mt-5"></span> {{ $t('stats.goodRolesStatsTitle') }}</h2>
      <h2 v-else><span class="evil-loyalty-icon mt-5"></span> {{ $t('stats.evilRolesStatsTitle') }}</h2>
      <v-data-table :headers="rolesTables.headers" :items="rolesTables[side]" hide-default-footer>
        <template v-slot:item.role="{ value }">
          <PreviewLink :target="value" />
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TGameView, TUserStats, prepareUserStats, prepareGamesForView } from '@/helpers/stats';
import { socket } from '@/api/socket';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { TRoles, UserForUI, VisualGameState } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';

type TRoleStats = {
  role: TRoles;
  gamesCount: number;
  wins: string;
};

export default defineComponent({
  name: 'UserStats',
  components: {
    PreviewLink,
    Avatar,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const state = ref<TUserStats>();
    const userForUi = ref<UserForUI>();
    const gamesState = ref<VisualGameState[]>();
    const lastGames = ref<TGameView[]>();

    const { t } = useI18n();

    const initState = async (uuid: string) => {
      const [games, profile] = await Promise.all([
        socket.emitWithAck('getPlayerGames', uuid),
        socket.emitWithAck('getUserProfile', uuid),
      ]);

      state.value = prepareUserStats(games, uuid);
      lastGames.value = prepareGamesForView(games, uuid, 5);
      gamesState.value = games;
      userForUi.value = profile;
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

    const rolesTables = computed(() => {
      const sideStats = Object.entries(state.value!.roles).reduce<{
        headers: { title: string; key: string }[];
        good: TRoleStats[];
        evil: TRoleStats[];
      }>(
        (acc, [side, el]) => {
          const roles = Object.entries(el).map(([roleName, value]) => ({
            role: <TRoles>roleName,
            gamesCount: value.total,
            wins: `${value.wins} (${value.winrate} %)`,
          }));

          acc[<'good' | 'evil'>side].push(...roles);
          return acc;
        },
        {
          headers: [
            { title: t('userStats.role'), key: 'role' },
            { title: t('userStats.gamesCount'), key: 'gamesCount' },
            { title: t('userStats.wins'), key: 'wins' },
          ],
          good: [],
          evil: [],
        },
      );
      sideStats.evil.sort((a, b) => b.gamesCount - a.gamesCount);
      sideStats.good.sort((a, b) => b.gamesCount - a.gamesCount);
      return sideStats;
    });

    const lastGamesHeaders = computed(() => {
      return [
        { title: t('userStats.role'), key: 'role' },
        { title: t('userStats.result'), key: 'isWin' },
        { title: t('stats.playerCount'), key: 'playersCount' },
      ];
    });

    return {
      state,
      gamesState,
      lastGames,
      lastGamesHeaders,
      generalTable,
      rolesTables,
      userForUi,
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
  background-color: rgb(var(--v-theme-bgHeader));
  width: fit-content;
  padding: 0px 8px;
  border-radius: 8px;
}
</style>
