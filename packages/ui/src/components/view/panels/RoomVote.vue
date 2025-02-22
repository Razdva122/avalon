<template>
  <div class="container">
    <div class="vote-text mb-5">
      <div>
        {{ $t('votes.' + vote.target) }}
      </div>
    </div>
    <div class="vote-results mb-5">
      <template v-for="index in vote.result.total">
        <i class="material-icons icon-vote" :class="calculateIconTypes(index)"></i>
      </template>
    </div>
    <div class="vote-buttons" v-if="canUserVote">
      <v-btn size="large" class="mr-10" color="info" @click="voteClick(true)"> {{ $t('votes.yes') }} </v-btn>
      <v-btn size="large" color="info" @click="voteClick(false)"> {{ $t('votes.no') }} </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { VoteInRoom } from '@avalon/types';
import { socket } from '@/api/socket';

export default defineComponent({
  props: {
    roomUuid: {
      type: String,
      required: true,
    },
    vote: {
      type: Object as PropType<VoteInRoom>,
      required: true,
    },
  },
  methods: {
    voteClick(result: boolean) {
      socket.emit('voteInRoom', this.roomUuid, result);
    },
    calculateIconTypes(index: number) {
      const iconsTypes: Array<string> = [];

      if (index < this.vote.result.required) {
        iconsTypes.push('check');
      } else if (index === this.vote.result.required) {
        iconsTypes.push('question_mark');
      } else {
        iconsTypes.push('close');
      }

      if (index <= this.vote.result.yes) {
        iconsTypes.push('icon-approve');
      }

      if (index > this.vote.result.total - this.vote.result.no) {
        iconsTypes.push('icon-reject');
      }

      return iconsTypes.join(' ');
    },
  },
  computed: {
    canUserVote() {
      const userVote = this.vote.votes.find((el) => el.id === this.$store.state.user?.id);

      if (userVote && userVote.voteResult === undefined) {
        return true;
      }
    },
  },
});
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  font-size: 28px;
  max-width: 460px;
}

.icon-vote {
  font-size: 36px;
  border-radius: 50%;
  border: 3px solid gray;
  margin-right: 4px;
}

.icon-approve {
  border-color: rgb(var(--v-theme-success));
}

.icon-reject {
  border-color: rgb(var(--v-theme-error));
}

.vote-text {
  text-align: center;
}
</style>
