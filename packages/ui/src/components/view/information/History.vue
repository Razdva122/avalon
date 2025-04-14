<template>
  <v-btn @click="overlay = !overlay" color="primary" class="mr-2 history-button">
    <template v-slot:prepend>
      <span class="material-icons"> history </span>
    </template>
    {{ $t('history.history') }}
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="history pa-4 rounded-lg">
      <div v-for="historyEl in history">
        <div>
          <component :is="toKebabCase(historyEl.type)" :data="historyEl" :playerNames="playerNames" />
        </div>
        <v-divider :thickness="3"></v-divider>
      </div>
      <v-btn @click="closeHistory" class="close" icon="close" variant="text" density="compact" color="text-primary" />
    </div>
  </v-overlay>
</template>

<script lang="ts">
import kebabCase from 'lodash/kebabCase';
import { defineComponent, PropType, ref, computed, toRefs, watch, ComputedRef } from 'vue';
import { THistoryResults, Player } from '@avalon/types';
import { useUserProfile } from '@/helpers/composables/useUserProfile';
import { useStore } from '@/store';

import SwitchLancelots from '@/components/view/information/history/SwitchLancelots.vue';
import SwitchResult from '@/components/view/information/history/SwitchResult.vue';
import CheckLoyalty from '@/components/view/information/history/CheckLoyalty.vue';
import RevealLoyalty from '@/components/view/information/history/RevealLoyalty.vue';
import AnnounceLoyalty from '@/components/view/information/history/AnnounceLoyalty.vue';
import Vote from '@/components/view/information/history/Vote.vue';
import Assassinate from '@/components/view/information/history/Assassinate.vue';
import Mission from '@/components/view/information/history/Mission.vue';
import GiveCard from '@/components/view/information/history/GiveCard.vue';
import PreVote from '@/components/view/information/history/PreVote.vue';
import LeadToVictory from '@/components/view/information/history/LeadToVictory.vue';
import RestoreHonor from '@/components/view/information/history/RestoreHonor.vue';
import Ambush from '@/components/view/information/history/Ambush.vue';
import KingReturns from '@/components/view/information/history/KingReturns.vue';
import PlayCard from '@/components/view/information/history/PlayCard.vue';
import WeFoundYou from '@/components/view/information/history/WeFoundYou.vue';

export default defineComponent({
  components: {
    SwitchLancelots,
    SwitchResult,
    CheckLoyalty,
    RevealLoyalty,
    AnnounceLoyalty,
    Vote,
    Assassinate,
    Mission,
    GiveCard,
    PreVote,
    LeadToVictory,
    RestoreHonor,
    Ambush,
    KingReturns,
    PlayCard,
    WeFoundYou,
  },
  props: {
    history: {
      required: true,
      type: Object as PropType<THistoryResults[]>,
    },
    players: {
      required: true,
      type: Object as PropType<Player[]>,
    },
    displayIndex: {
      type: Boolean,
    },
  },
  setup(props) {
    const { players, displayIndex } = toRefs(props);
    const store = useStore();
    const overlay = ref(false);
    const userNamesMap = ref<Record<string, string>>({});

    watch(
      () => players.value,
      (newPlayers) => {
        if (newPlayers && newPlayers.length) {
          newPlayers.forEach((player) => {
            const { userName } = useUserProfile(player.id);

            watch(
              userName,
              (newName) => {
                userNamesMap.value[player.id] = newName;
              },
              { immediate: true },
            );
          });
        }
      },
      { immediate: true },
    );

    // Create a computed property that maps player IDs to their names
    const playerNames = computed(() => {
      const names: Record<string, string> = {};

      if (players.value && players.value.length) {
        players.value.forEach((player) => {
          const hideIndexInHistory = store.state.settings?.hideIndexInHistory;
          const prefix = displayIndex.value && !hideIndexInHistory ? `${player.index}. ` : '';

          names[player.id] = prefix + (userNamesMap.value[player.id] || '???');
        });
      }

      return names;
    });

    // Function to close history overlay
    const closeHistory = () => {
      overlay.value = false;
    };

    // Function to convert string to kebab case
    const toKebabCase = (str: string): string => {
      return kebabCase(str);
    };

    return {
      overlay,
      playerNames,
      closeHistory,
      toKebabCase,
    };
  },
});
</script>

<style scoped lang="scss">
.close {
  position: absolute;
  top: 4px;
  right: 4px;
}

.history-button {
  width: 180px;
}

.history {
  background-color: rgb(var(--v-theme-surface));
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
</style>
