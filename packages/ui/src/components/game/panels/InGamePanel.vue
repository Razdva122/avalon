<template>
  <template v-if="game.stage === 'selectTeam' && isUserLeader">
    <v-btn color="warning" :disabled="isSendTeamDisabled" @click="onSendTeamClick"> Send Team </v-btn>
  </template>
  <template v-if="game.stage === 'votingForTeam'">
    <v-btn color="success" :disabled="!isPlayerActive" @click="() => onVoteClick('approve')" class="mb-2">
      Approve
    </v-btn>
    <v-btn color="error" :disabled="!isPlayerActive" @click="() => onVoteClick('reject')"> Reject </v-btn>
  </template>
  <template v-if="game.stage === 'onMission' && isPlayerOnMission">
    <v-btn color="success" :disabled="!isPlayerActive" @click="() => onMissionClick('success')" class="mb-2">
      Success
    </v-btn>
    <v-btn color="error" :disabled="!isPlayerActive || !isPlayerCanFail" @click="() => onMissionClick('fail')">
      Fail
    </v-btn>
  </template>
  <template v-if="game.stage === 'selectMerlin' && isUserAssassin">
    <v-btn color="error" :disabled="isExecuteDisabled" @click="onExecuteMerlinClick">Execute merlin</v-btn>
  </template>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRefs } from 'vue';
import type { IVisualGameState, TMissionResult, TVoteOption } from '@avalon/types';
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
    const { game } = toRefs(props);
    const store = useStore();

    const player = computed(() => {
      return game.value.players.find((player) => player.id === store.state.user?.id);
    });

    const isUserLeader = computed(() => {
      return player.value?.features.isLeader;
    });

    const isUserAssassin = computed(() => {
      return player.value?.features.isAssassin;
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

    const isExecuteDisabled = computed(() => {
      return game.value.players.filter((player) => player.features.isSelected).length !== 1;
    });

    const onSendTeamClick = () => {
      socket.emit('sentSelectedPlayers', game.value.uuid);
    };

    const onVoteClick = (option: TVoteOption) => {
      socket.emit('voteForMission', game.value.uuid, option);
    };

    const onMissionClick = (result: TMissionResult) => {
      socket.emit('actionOnMission', game.value.uuid, result);
    };

    const onExecuteMerlinClick = () => {
      socket.emit('selectMerlin', game.value.uuid);
    };

    return {
      isUserLeader,
      isUserAssassin,
      isPlayerOnMission,
      isPlayerActive,
      isPlayerCanFail,
      isExecuteDisabled,

      isSendTeamDisabled,

      onSendTeamClick,
      onVoteClick,
      onMissionClick,
      onExecuteMerlinClick,
    };
  },
});
</script>
