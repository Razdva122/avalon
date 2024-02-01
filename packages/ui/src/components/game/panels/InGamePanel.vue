<template>
  <template v-if="game.stage === 'selectTeam' && isUserLeader">
    <v-btn color="warning" :disabled="isSendTeamDisabled" @click="emitClick('sentSelectedPlayers')"> Send Team </v-btn>
  </template>
  <template v-if="game.stage === 'votingForTeam'">
    <v-btn color="success" :disabled="!isPlayerActive" @click="() => onVoteClick('approve')" class="mb-2">
      Approve
    </v-btn>
    <v-btn color="error" :disabled="!isPlayerActive" @click="() => onVoteClick('reject')"> Reject </v-btn>
  </template>
  <template v-if="game.stage === 'onMission' && isPlayerOnMission">
    <Spoiler :size="{ width: '200px', height: '80px' }">
      <v-btn color="success" :disabled="!isPlayerActive" @click="() => onMissionClick('success')" class="mb-2">
        Success
      </v-btn>
      <v-btn color="error" :disabled="!isPlayerActive || !isPlayerCanFail" @click="() => onMissionClick('fail')">
        Fail
      </v-btn>
    </Spoiler>
  </template>
  <template v-if="game.stage === 'selectMerlin' && isUserAssassin">
    <v-btn color="error" :disabled="!isSinglePlayerSelected" @click="emitClick('selectMerlin')">Execute merlin</v-btn>
  </template>
  <template v-if="game.stage === 'checkLoyalty' && isUserLadyOwner">
    <v-btn color="warning" :disabled="!isLadyAvailable" @click="emitClick('checkLoyalty')">Check Loyalty</v-btn>
  </template>
  <template v-if="game.stage === 'giveExcalibur' && isUserLeader">
    <v-btn color="warning" :disabled="!isGiveExcaliburAvailable" @click="emitClick('giveExcalibur')"
      >Give excalibur</v-btn
    >
  </template>
  <template v-if="game.stage === 'useExcalibur' && isUserExcaliburOwner">
    <v-btn
      :color="isZeroPlayerSelected ? 'warning' : 'error'"
      :disabled="!isUseExcaliburAvailable"
      @click="emitClick('useExcalibur')"
      >{{ isZeroPlayerSelected ? 'Skip excalibur' : 'Use excalibur' }}</v-btn
    >
  </template>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRefs } from 'vue';
import type { IVisualGameState, TMissionResult, TVoteOption } from '@avalon/types';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
import Spoiler from '@/components/feedback/Spoiler.vue';

type TMethodsWithoutParams = 'sentSelectedPlayers' | 'selectMerlin' | 'checkLoyalty' | 'giveExcalibur' | 'useExcalibur';

export default defineComponent({
  name: 'InGamePanel',
  components: {
    Spoiler,
  },
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

    const isUserLadyOwner = computed(() => {
      return player.value?.features.ladyOfLake === 'has';
    });

    const isUserExcaliburOwner = computed(() => {
      return Boolean(player.value?.features.excalibur);
    });

    const isSendTeamDisabled = computed(() => {
      const needPlayers = game.value.settings.missions[game.value.mission].players;
      return game.value.players.filter((player) => player.features.isSelected).length !== needPlayers;
    });

    const isSinglePlayerSelected = computed(() => {
      return game.value.players.filter((player) => player.features.isSelected).length === 1;
    });

    const isZeroPlayerSelected = computed(() => {
      return game.value.players.filter((player) => player.features.isSelected).length === 0;
    });

    const isLadyAvailable = computed(() => {
      return (
        isSinglePlayerSelected.value &&
        Boolean(
          game.value.players.find((player) => player.features.isSelected && player.features.ladyOfLake === undefined),
        )
      );
    });

    const isGiveExcaliburAvailable = computed(() => {
      return (
        isSinglePlayerSelected.value &&
        Boolean(
          game.value.players.find(
            (player) => player.features.isSelected && !player.features.isLeader && player.features.isSent,
          ),
        )
      );
    });

    const isUseExcaliburAvailable = computed(() => {
      return (
        isZeroPlayerSelected.value ||
        (isSinglePlayerSelected.value &&
          Boolean(
            game.value.players.find(
              (player) => player.features.isSelected && !player.features.excalibur && player.features.isSent,
            ),
          ))
      );
    });

    const onVoteClick = (option: TVoteOption) => {
      socket.emit('voteForMission', game.value.uuid, option);
    };

    const onMissionClick = (result: TMissionResult) => {
      socket.emit('actionOnMission', game.value.uuid, result);
    };

    const emitClick = (methodName: TMethodsWithoutParams) => {
      socket.emit(methodName, game.value.uuid);
    };

    return {
      isUserLeader,
      isUserAssassin,
      isUserLadyOwner,
      isUserExcaliburOwner,
      isPlayerOnMission,
      isPlayerActive,
      isPlayerCanFail,
      isSinglePlayerSelected,
      isZeroPlayerSelected,
      isLadyAvailable,
      isGiveExcaliburAvailable,
      isUseExcaliburAvailable,

      isSendTeamDisabled,

      onVoteClick,
      onMissionClick,
      emitClick,
    };
  },
});
</script>
