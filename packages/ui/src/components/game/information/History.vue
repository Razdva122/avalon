<template>
  <v-btn @click="overlay = !overlay" class="mb-8">
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
          <div>
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
            {{ calculateNameByID(historyEl.assassinID) }} assassinate {{ calculateNameByID(historyEl.killedID) }}
          </div>
          <div>
            {{ calculateNameByID(historyEl.killedID) }} {{ historyEl.result === 'hit' ? 'is' : 'is not' }} Merlin
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
              historyEl.votes
                .filter((el) => el.onMission)
                .map((el) => calculateNameByID(el.playerID))
                .join(', ')
            }}
          </div>
          <template v-if="!historyEl.forced">
            <div>
              Approve:
              <span class="text-success">
                {{
                  historyEl.votes
                    .filter((el) => el.value === 'approve')
                    .map((el) => calculateNameByID(el.playerID))
                    .join(', ')
                }}
              </span>
            </div>
            <div>
              Reject:
              <span class="text-error">
                {{
                  historyEl.votes
                    .filter((el) => el.value === 'reject')
                    .map((el) => calculateNameByID(el.playerID))
                    .join(', ')
                }}
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
        <div v-if="historyEl.type === 'switchResult'">
          <div v-if="historyEl.targetID">
            <b>{{ calculateNameByID(historyEl.switcherID) }}</b> use excalibur to switch
            <b>{{ calculateNameByID(historyEl.targetID) }}</b> action
            <template v-if="historyEl.result">
              <span :class="historyEl.result === 'fail' ? 'text-error' : 'text-success'">
                to {{ historyEl.result }}
              </span>
            </template>
          </div>
          <div v-else>
            <b>{{ calculateNameByID(historyEl.switcherID) }}</b> decided not to use excalibur
          </div>
        </div>
        <v-divider :thickness="3"></v-divider>
      </div>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { THistoryResults, IPlayer, IActionWithResult } from '@avalon/types';

export default defineComponent({
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
  },
});
</script>

<style scoped lang="scss">
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
