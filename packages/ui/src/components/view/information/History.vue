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
          <component :is="toKebabCase(historyEl.type)" :data="historyEl" :calculateNameByID="calculateNameByID" />
        </div>
        <v-divider :thickness="3"></v-divider>
      </div>
      <v-btn @click="closeHistory" class="close" icon="close" variant="text" density="compact" color="text-primary" />
    </div>
  </v-overlay>
</template>

<script lang="ts">
import kebabCase from 'lodash/kebabCase';
import { defineComponent, PropType } from 'vue';
import { THistoryResults, Player } from '@avalon/types';
import SwitchLancelots from '@/components/view/information/history/SwitchLancelots.vue';
import SwitchResult from '@/components/view/information/history/SwitchResult.vue';
import CheckLoyalty from '@/components/view/information/history/CheckLoyalty.vue';
import Vote from '@/components/view/information/history/Vote.vue';
import Assassinate from '@/components/view/information/history/Assassinate.vue';
import Mission from '@/components/view/information/history/Mission.vue';
import GiveCard from '@/components/view/information/history/GiveCard.vue';
import PreVote from '@/components/view/information/history/PreVote.vue';
import LeadToVictory from '@/components/view/information/history/LeadToVictory.vue';
import RestoreHonor from '@/components/view/information/history/RestoreHonor.vue';
import Ambush from '@/components/view/information/history/Ambush.vue';

export default defineComponent({
  components: {
    SwitchLancelots,
    SwitchResult,
    CheckLoyalty,
    Vote,
    Assassinate,
    Mission,
    GiveCard,
    PreVote,
    LeadToVictory,
    RestoreHonor,
    Ambush,
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
  data: () => ({
    overlay: false,
  }),
  methods: {
    calculateNameByID(playerID: string) {
      const player = this.players.find((player) => player.id === playerID)!;
      const hideIndexInHistory = this.$store.state.settings?.hideIndexInHistory;
      const prefix = this.displayIndex && !hideIndexInHistory ? `${player.index}. ` : '';
      return prefix + player.name;
    },
    closeHistory() {
      this.overlay = false;
    },
    toKebabCase(str: string): string {
      return kebabCase(str);
    },
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
