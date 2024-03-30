<template>
  <v-btn @click="overlay = !overlay" class="mr-2 history-button">
    <template v-slot:prepend>
      <span class="material-icons"> history </span>
    </template>
    History
  </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="history pa-4 rounded-lg">
      <div v-for="historyEl in history">
        <div class="mission" v-if="historyEl.type === 'mission'">
          <div>
            <span :class="historyEl.result === 'fail' ? 'text-error' : 'text-success'">
              {{ historyEl.index + 1 }} mission
            </span>
            <span> / fails {{ historyEl.fails }} </span>
          </div>
          <div v-if="historyEl.actions">
            Team:
            <template v-for="(el, index) in historyEl.actions">
              <span :class="{ fail: 'text-error', success: 'text-success' }[(el as IActionWithResult).value]">
                {{ calculateNameByID(el.playerID) }}
              </span>
              <span>
                {{ index !== historyEl.actions.length - 1 ? ', ' : '' }}
              </span>
            </template>
          </div>
        </div>
        <div v-if="historyEl.type === 'assassinate'">
          <div>
            {{ calculateNameByID(historyEl.assassinID) }} assassinate
            {{ historyEl.killedIDs.map(calculateNameByID).join(', ') }}
          </div>
          <div>
            {{ historyEl.killedIDs.map(calculateNameByID).join(', ') }}
            {{ historyEl.result === 'hit' ? 'is' : 'is not' }} {{ historyEl.assassinateType }}
          </div>
        </div>
        <div v-if="historyEl.type === 'vote'">
          <div>
            <span v-if="historyEl.forced" class="text-info"> Forced vote </span>
            <span v-else :class="historyEl.result === 'reject' ? 'text-error' : 'text-success'">
              {{ historyEl.index + 1 }} vote
            </span>
            <span>
              team selected by <b>{{ calculateNameByID(historyEl.leaderID) }}</b>
            </span>
          </div>
          <div>
            Team:
            {{
              historyEl.team
                .map((el) => {
                  const name = calculateNameByID(el.id);
                  return el.excalibur ? name + '(Excalibur)' : name;
                })
                .join(', ')
            }}
          </div>
          <template v-if="!historyEl.forced">
            <div>
              Approve:
              <span class="text-success">
                {{ historyElText(historyEl, 'approve') }}
              </span>
            </div>
            <div>
              Reject:
              <span class="text-error">
                {{ historyElText(historyEl, 'reject') }}
              </span>
            </div>
          </template>
        </div>
        <div v-if="historyEl.type === 'checkLoyalty'">
          <div>
            <b>{{ calculateNameByID(historyEl.validatorID) }}</b> checked
            <b>{{ calculateNameByID(historyEl.inspectedID) }}</b> loyalty
            <span v-if="historyEl.realLoyalty">
              is
              <span :class="historyEl.realLoyalty === 'evil' ? 'text-error' : 'text-success'">
                {{ historyEl.realLoyalty }}
              </span>
            </span>
          </div>
          <div>
            And declared his loyalty as
            <span :class="historyEl.result === 'evil' ? 'text-error' : 'text-success'"> {{ historyEl.result }}</span>
          </div>
        </div>
        <div v-if="historyEl.type === 'switchLancelots' || historyEl.type === 'switchResult'">
          <component
            :is="toKebabCase(historyEl.type)"
            :data="historyEl"
            :calculateNameByID="calculateNameByID"
          ></component>
        </div>
        <v-divider :thickness="3"></v-divider>
      </div>
      <v-btn @click="closeHistory" class="close" icon="close" variant="text" density="compact" />
    </div>
  </v-overlay>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { defineComponent, PropType } from 'vue';
import { THistoryResults, IPlayer, IActionWithResult, THistoryVote } from '@avalon/types';
import SwitchLancelots from '@/components/view/information/history/SwitchLancelots.vue';
import SwitchResult from '@/components/view/information/history/SwitchResult.vue';

export default defineComponent({
  components: {
    SwitchLancelots,
    SwitchResult,
  },
  props: {
    history: {
      required: true,
      type: Object as PropType<THistoryResults[]>,
    },
    players: {
      required: true,
      type: Object as PropType<IPlayer[]>,
    },
  },
  data: () => ({
    overlay: false,
  }),
  methods: {
    calculateNameByID(playerID: string) {
      return this.players.find((player) => player.id === playerID)!.name;
    },
    historyElText(element: THistoryVote, type: 'reject' | 'approve') {
      if (element.anonymous) {
        return element.votes[type];
      }

      return element.votes
        .filter((el) => el.value === type)
        .map((el) => this.calculateNameByID(el.playerID))
        .join(', ');
    },
    closeHistory() {
      this.overlay = false;
    },
    toKebabCase(str: string): string {
      return _.kebabCase(str);
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
  background-color: white;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.mission {
  font-size: x-large;
}
</style>
