<template>
  <v-btn @click="overlay = !overlay" color="primary" class="mr-2 history-button">
    <template v-slot:prepend>
      <span class="material-icons"> history </span>
    </template>
    {{ $t('history.history') }}
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="history pa-4 rounded-lg" :class="{ 'history--table': view === 'table' }">
      <div class="history-header">
        <h2 class="history-title">{{ $t('history.history') }}</h2>
        <v-btn
          @click="closeHistory"
          class="close"
          icon="close"
          variant="text"
          color="text-primary"
          :aria-label="$t('infoMessage.close')"
        />
      </div>
      <div class="history-views" role="group" :aria-label="$t('history.history')">
        <button
          type="button"
          class="history-view"
          :class="{ 'is-active': view === 'list' }"
          :aria-pressed="view === 'list'"
          @click="view = 'list'"
        >
          <span class="material-icons" aria-hidden="true">format_list_bulleted</span>
          <span>{{ $t('history.listView') }}</span>
        </button>
        <button
          type="button"
          class="history-view"
          :class="{ 'is-active': view === 'table' }"
          :aria-pressed="view === 'table'"
          @click="view = 'table'"
        >
          <span class="material-icons" aria-hidden="true">grid_on</span>
          <span>{{ $t('history.tableView') }}</span>
        </button>
      </div>
      <VoteTable
        v-if="view === 'table'"
        :history="history"
        :players="players"
        :player-names="playerNames"
        :game-ended="gameEnded"
      />
      <template v-else>
        <div v-for="(historyEl, index) in history" :key="index">
          <div>
            <component :is="toKebabCase(historyEl.type)" :data="historyEl" :playerNames="playerNames" />
          </div>
          <v-divider :thickness="3"></v-divider>
        </div>
      </template>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import VoteTable from '@/components/view/information/history/VoteTable.vue';
import { useLocalStorage } from '@vueuse/core';
import kebabCase from 'lodash/kebabCase';
import { defineComponent, PropType, ref, computed, toRefs, watch, onMounted } from 'vue';
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
    VoteTable,
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
    gameEnded: {
      type: Boolean,
    },
    displayIndex: {
      type: Boolean,
    },
  },
  setup(props) {
    const { players, displayIndex } = toRefs(props);
    const store = useStore();
    const overlay = ref(false);
    const view = useLocalStorage('avalon-history-view', 'list');
    const userNamesMap = ref<Record<string, string>>({});

    onMounted(() => {
      players.value.forEach((player) => {
        const { userName } = useUserProfile(player.id);

        watch(
          userName,
          (newName) => {
            userNamesMap.value[player.id] = newName;
          },
          { immediate: true },
        );
      });
    });

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
      view,
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
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}

.history-button {
  width: 180px;
}

.history {
  background-color: rgb(var(--v-theme-surface));
  width: min(400px, calc(100vw - 24px));
  max-height: 80vh;
  overflow-y: auto;

  &--table {
    width: max-content;
    max-width: min(1000px, calc(100vw - 24px));
  }
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.history-title {
  font-size: 20px;
  font-weight: 600;
}

.history-views {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.history-view {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition:
    background-color 150ms,
    box-shadow 150ms;

  .material-icons {
    flex-shrink: 0;
    font-size: 20px;
  }

  &:hover {
    background: rgba(var(--v-theme-primary), 0.08);
  }

  &.is-active {
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-primary));
    border-color: rgba(var(--v-theme-primary), 0.25);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    font-weight: 700;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}

@media (max-width: 400px) {
  .history-view {
    padding: 8px 6px;
    gap: 6px;
    font-size: 13px;
  }
}
</style>
