<template>
  <template v-if="game.stage === 'selectTeam' && isUserLeader">
    <v-btn color="warning" :disabled="isSendTeamDisabled" @click="emitClick('sentSelectedPlayers')">
      {{ $t('inGame.sendTeam') }}
    </v-btn>
  </template>
  <template v-if="game.stage === 'votingForTeam' || (game.stage === 'preVote' && isPlayerActive)">
    <v-btn color="success" :disabled="!isPlayerActive" @click="() => onVoteClick('approve')" class="mb-2">
      {{ $t('inGame.approve') }}
    </v-btn>
    <v-btn color="error" :disabled="!isPlayerActive" @click="() => onVoteClick('reject')">
      {{ $t('inGame.reject') }}
    </v-btn>
  </template>
  <template v-if="game.stage === 'onMission' && isPlayerOnMission">
    <Spoiler :size="{ width: '200px', height: '80px' }">
      <v-btn
        color="success"
        :disabled="!isPlayerActive || !isPlayerCanSuccess"
        @click="() => onMissionClick('success')"
        class="mb-2"
      >
        {{ $t('inGame.success') }}
      </v-btn>
      <v-btn color="error" :disabled="!isPlayerActive || !isPlayerCanFail" @click="() => onMissionClick('fail')">
        {{ $t('inGame.fail') }}
      </v-btn>
    </Spoiler>
  </template>
  <template v-if="game.stage === 'assassinate' && isUserAssassin">
    <AssassinateControl :game="game" />
  </template>
  <template v-if="game.stage === 'checkLoyalty' && isUserCheckOwner">
    <v-btn color="warning" :disabled="!isCheckAvailable" @click="emitClick('checkLoyalty')">{{
      $t('inGame.checkLoyalty')
    }}</v-btn>
  </template>
  <template v-if="game.stage === 'giveExcalibur' && isUserLeader">
    <v-btn color="warning" :disabled="!isGiveExcaliburAvailable" @click="emitClick('giveExcalibur')">{{
      $t('inGame.giveExcalibur')
    }}</v-btn>
  </template>
  <template v-if="game.stage === 'useExcalibur' && isUserExcaliburOwner">
    <v-btn
      :color="isZeroPlayerSelected ? 'warning' : 'error'"
      :disabled="!isUseExcaliburAvailable"
      @click="emitClick('useExcalibur')"
      >{{
        isZeroPlayerSelected
          ? $t('inGame.skipCard', { cardName: $t('addons.excalibur') })
          : $t('inGame.useCard', { cardName: $t('addons.excalibur') })
      }}</v-btn
    >
  </template>
  <template v-if="game.stage === 'witchAbility' && isUserWitch">
    <v-btn color="success" @click="() => witchAbilityClick(true)" class="mb-2">
      {{ $t('inGame.useWitchAbility') }}
    </v-btn>
    <v-btn color="warning" @click="() => witchAbilityClick(false)">
      {{ $t('inGame.skipWitchAbility') }}
    </v-btn>
  </template>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRefs } from 'vue';
import type { VisualGameState, TMissionResult, TVoteOption } from '@avalon/types';
import { socket } from '@/api/socket';
import Spoiler from '@/components/feedback/Spoiler.vue';
import AssassinateControl from '@/components/view/panels/controls/AssassinateControl.vue';
import { useGamePlayerState } from '@/helpers/composables/useGamePlayerState';

type TMethodsWithoutParams = 'sentSelectedPlayers' | 'checkLoyalty' | 'giveExcalibur' | 'useExcalibur';

export default defineComponent({
  name: 'InGamePanel',
  components: {
    Spoiler,
    AssassinateControl,
  },
  props: {
    game: {
      required: true,
      type: Object as PropType<VisualGameState>,
    },
  },
  setup(props) {
    const { game } = toRefs(props);
    const gameComputed = computed(() => game.value);

    const { player, isUserLeader, isPlayerActive, isZeroPlayerSelected, isSinglePlayerSelected } =
      useGamePlayerState(gameComputed);

    const isUserAssassin = computed(() => {
      return player.value?.features.isAssassin;
    });

    const isUserWitch = computed(() => {
      return player.value?.role === 'witch';
    });

    const isPlayerOnMission = computed(() => {
      return player.value?.features.isSent;
    });

    const isPlayerCanFail = computed(() => {
      return player.value?.validMissionsResult?.includes('fail');
    });

    const isPlayerCanSuccess = computed(() => {
      return player.value?.validMissionsResult?.includes('success');
    });

    const isUserCheckOwner = computed(() => {
      return (
        player.value?.features.ladyOfLake === 'active' ||
        player.value?.features.ladyOfSea === 'active' ||
        player.value?.features.witchLoyalty === 'active'
      );
    });

    const isUserExcaliburOwner = computed(() => {
      return Boolean(player.value?.features.excalibur);
    });

    const isSendTeamDisabled = computed(() => {
      const needPlayers = game.value.settings.missions[game.value.mission].players;
      return game.value.players.filter((player) => player.features.isSelected).length !== needPlayers;
    });

    const isCheckAvailable = computed(() => {
      if (!isSinglePlayerSelected.value) {
        return false;
      }

      if (game.value.stage === 'checkLoyalty') {
        return Boolean(
          game.value.players.find(
            (player) =>
              player.features.isSelected &&
              player.features.ladyOfLake === undefined &&
              player.features.ladyOfSea === undefined,
          ),
        );
      }

      return true;
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
      socket.emit(game.value.stage === 'preVote' ? 'preVote' : 'voteForMission', game.value.uuid, option);
    };

    const onMissionClick = (result: TMissionResult) => {
      socket.emit('actionOnMission', game.value.uuid, result);
    };

    const onAssassinateClick = () => {
      socket.emit('assassinate', game.value.uuid, 'merlin');
    };

    const emitClick = (methodName: TMethodsWithoutParams) => {
      socket.emit(methodName, game.value.uuid);
    };

    const witchAbilityClick = (use: boolean) => {
      socket.emit('useWitchAbility', game.value.uuid, use);
    };

    return {
      isUserLeader,
      isUserAssassin,
      isUserWitch,
      isUserCheckOwner,
      isUserExcaliburOwner,
      isPlayerOnMission,
      isPlayerActive,
      isPlayerCanFail,
      isPlayerCanSuccess,
      isSinglePlayerSelected,
      isZeroPlayerSelected,
      isCheckAvailable,
      isGiveExcaliburAvailable,
      isUseExcaliburAvailable,
      isSendTeamDisabled,
      onVoteClick,
      onMissionClick,
      onAssassinateClick,
      emitClick,
      witchAbilityClick,
    };
  },
});
</script>
