<template>
  <template v-if="game.stage === 'selectTeam' && isUserLeader">
    <v-btn rounded="lg" variants="tonal" color="warning" :disabled="isSendTeamDisabled">Send Team</v-btn>
  </template>
  <template v-if="game.stage === 'votingForTeam'">
    <v-btn rounded="lg" variants="tonal" color="success" :disabled="!isPlayerActive">Approve</v-btn>
    <v-btn rounded="lg" variants="tonal" color="danger" :disabled="!isPlayerActive">Reject</v-btn>
  </template>
  <template v-if="game.stage === 'onMission' && isPlayerOnMission">
    <v-btn rounded="lg" variants="tonal" color="success" :disabled="!isPlayerActive">Success</v-btn>
    <v-btn rounded="lg" variants="tonal" color="danger" :disabled="!isPlayerActive || !isPlayerCanFail">Fail</v-btn>
  </template>
  <template v-if="game.stage === 'selectMerlin' && isUserLeader">
    <v-btn rounded="lg" variants="tonal" color="danger">Execute merlin</v-btn>
  </template>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from 'vue';
import type { IVisualGameState } from '@avalon/types';
import { useStore } from '@/store';
import { socket } from '@/api/socket';

export default defineComponent({
  name: 'InGamePanel',
  props: {
    game: {
      required: true,
      type: Object as PropType<IVisualGameState>,
    },
  },
  setup(props) {
    const game = ref(props.game);
    const store = useStore();

    const player = computed(() => {
      return game.value.players.find((player) => player.id === store.state.user?.id);
    });

    const isUserLeader = computed(() => {
      return player.value?.features.isLeader;
    });

    const isPlayerOnMission = computed(() => {
      return player.value?.features.isSent;
    });

    const isPlayerActive = computed(() => {
      return player.value?.features.waitForAction;
    });

    const isPlayerCanFail = computed(() => {
      return player.value?.validMissionsResult?.includes('fail');
    });

    const isSendTeamDisabled = computed(() => {
      const needPlayers = game.value.settings.missions[game.value.mission].players;
      return game.value.players.filter((player) => player.features.isSelected).length !== needPlayers;
    });

    return {
      isUserLeader,
      isPlayerOnMission,
      isPlayerActive,
      isPlayerCanFail,

      isSendTeamDisabled,
    };
  },
});
</script>
