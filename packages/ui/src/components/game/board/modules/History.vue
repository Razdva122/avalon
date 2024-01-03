<template>
  <div class="history">
    <div v-for="history in historyForView">
      <div v-if="history.type === 'missionStart'">{{ history.index }} mission started</div>
      <div v-if="history.type === 'mission'">
        <div>{{ history.index + 1 }} mission</div>
        <div>Leader: {{ calculateNameByID(history.leaderID) }}</div>
        <div>Result {{ history.result }}</div>
        <div>Fails {{ history.fails }}</div>
        <div>Participants: {{ history.actions.map((el) => calculateNameByID(el.playerID)).join(', ') }}</div>
      </div>
      <div v-if="history.type === 'assassinate'">
        <div>{{ calculateNameByID(history.assassinID) }} assassinate {{ calculateNameByID(history.killedID) }}</div>
        <div>{{ calculateNameByID(history.killedID) }} {{ history.result === 'hit' ? 'is' : 'is not' }} Merlin</div>
      </div>
      <div v-if="history.type === 'vote'">
        <div>{{ history.index + 1 }} vote</div>
        <div>Leader: {{ calculateNameByID(history.leaderID) }}</div>
        <div>
          Team:
          {{
            history.votes
              .filter((el) => el.onMission)
              .map((el) => calculateNameByID(el.playerID))
              .join(', ')
          }}
        </div>
        <template v-if="history.forced"> Vote was forced </template>
        <template v-else>
          <div>
            Approve:
            {{
              history.votes
                .filter((el) => el.value === 'approve')
                .map((el) => calculateNameByID(el.playerID))
                .join(', ')
            }}
          </div>
          <div>
            Reject:
            {{
              history.votes
                .filter((el) => el.value === 'reject')
                .map((el) => calculateNameByID(el.playerID))
                .join(', ')
            }}
          </div>
        </template>
        <div>Result: {{ history.result }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { THistoryResults, IPlayer } from '@avalon/types';

type THistoryForView = THistoryResults | { type: 'missionStart'; index: number };

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
  computed: {
    historyForView() {
      return this.history.reduce<THistoryForView[]>(
        (acc, el) => {
          acc.push(el);

          if (el.type === 'mission' && el.index !== 4) {
            acc.push({ type: 'missionStart', index: el.index + 1 });
          }

          return acc;
        },
        [{ type: 'missionStart', index: 1 }],
      );
    },
  },
  methods: {
    calculateNameByID(playerID: string) {
      return this.players.find((player) => player.id === playerID)!.name;
    },
  },
});
</script>

<style scoped lang="scss"></style>
