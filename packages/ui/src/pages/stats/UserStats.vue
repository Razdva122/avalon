<template>
  <div class="info-page-content stats-page">
    <h1>{{ $t('userStats.userStatsTitle') }} {{ $props.uuid }}</h1>
    <h2>{{ $t('stats.generalStatsTitle') }}</h2>
    <v-data-table class="general-table" :headers="generalTable.headers" :items="generalTable.data" hide-default-footer>
      <template v-slot:item.side="{ value }">
        <span v-if="value === 'good'" class="good-loyalty-icon"></span>
        <span v-if="value === 'evil'" class="evil-loyalty-icon"></span>
        {{ $t('userStats.side' + value) }}
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
import { TUserStats, prepareUserStats } from '@/helpers/stats';
import { socket } from '@/api/socket';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { TRoles } from '@avalon/types';

type TRoleStats = {
  role: TRoles;
  gamesCount: number;
  wins: string;
};

export default defineComponent({
  name: 'UserStats',
  components: {
    PreviewLink,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const state = ref<TUserStats>();

    const { t } = useI18n();

    const initState = async (uuid: string) => {
      const stateFromBackend = await socket.emitWithAck('getPlayerGames', uuid);
      state.value = prepareUserStats(stateFromBackend, uuid);
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
        data: Object.entries(stateData.teams).map(([name, value]) => {
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

    return {
      state,
      generalTable,
      rolesTables,
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
</style>
