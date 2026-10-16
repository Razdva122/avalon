<template>
  <article class="vote-attempt">
    <header class="attempt-header">
      <span class="attempt-number">{{ $t('vote.attempt', { index: data.index + 1 }) }}</span>
      <span
        class="attempt-result"
        :class="data.forced ? 'is-forced' : data.result === 'reject' ? 'is-rejected' : 'is-approved'"
      >
        {{
          $t(data.forced ? 'vote.forcedVote' : data.result === 'reject' ? 'vote.statusRejected' : 'vote.statusApproved')
        }}
        <span v-if="!data.forced" class="vote-totals">
          · {{ $t('vote.approve') }} {{ voteCount(data, 'approve') }} · {{ $t('vote.reject') }}
          {{ voteCount(data, 'reject') }}
        </span>
      </span>
    </header>
    <MissionTeam
      :team="data.team"
      :player-names="playerNames"
      :leader-i-d="data.leaderID"
      :actions="mission?.actions"
    />
    <div v-if="!data.team.some((member) => member.id === data.leaderID)" class="outside-leader">
      {{ $t('history.teamLeader') }}: {{ playerNames[data.leaderID] }}
    </div>
    <template v-if="!data.forced">
      <p v-if="data.anonymous" class="anonymous-note">{{ $t('history.anonymousVoting') }}</p>
      <details v-else class="vote-details">
        <summary>{{ $t('history.playerVotes') }}</summary>
        <div class="voter-groups">
          <div
            v-for="choice in ['approve', 'reject'] as const"
            :key="choice"
            class="voter-group"
            :class="`voter-group--${choice}`"
          >
            <div class="voter-heading">
              <span aria-hidden="true">{{ choice === 'approve' ? '✓' : '×' }}</span> {{ $t(`vote.${choice}`) }}
              {{ voteCount(data, choice) }}
            </div>
            <ul class="team-chips" :aria-label="$t(`vote.${choice}`)">
              <li v-for="id in voterIDs(data, choice)" :key="id" class="team-chip">{{ playerNames[id] }}</li>
            </ul>
          </div>
        </div>
      </details>
    </template>
  </article>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { THistoryMission, THistoryVote } from '@avalon/types';
import MissionTeam from './MissionTeam.vue';

export default defineComponent({
  components: { MissionTeam },
  props: {
    mission: Object as PropType<THistoryMission>,
    data: {
      required: true,
      type: Object as PropType<THistoryVote>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<Record<string, string>>,
    },
  },
  methods: {
    voteCount(element: THistoryVote, type: 'reject' | 'approve') {
      return element.anonymous ? element.votes[type] : element.votes.filter((vote) => vote.value === type).length;
    },
    voterIDs(element: THistoryVote, type: 'reject' | 'approve') {
      return element.anonymous ? [] : element.votes.filter((el) => el.value === type).map((el) => el.playerID);
    },
  },
});
</script>

<style scoped lang="scss">
.vote-attempt {
  display: grid;
  gap: 8px;
}
.attempt-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
}
.attempt-number {
  font-weight: 600;
}
.attempt-result {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  &.is-approved {
    background: rgba(var(--v-theme-history-card-success), 0.12);
    color: rgb(var(--v-theme-on-surface));
  }
  &.is-rejected {
    background: rgba(var(--v-theme-history-card-fail), 0.1);
    color: rgb(var(--v-theme-on-surface));
  }
  &.is-forced {
    background: rgba(var(--v-theme-info), 0.12);
  }
}
.vote-totals,
.outside-leader,
.anonymous-note {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.vote-totals {
  font-weight: 400;
}
.team-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.team-chip {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 6px;
  max-width: 100%;
  padding: 4px 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.035);
  overflow-wrap: anywhere;
}
.vote-details > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
  font-size: 13px;
  list-style: none;
  &::-webkit-details-marker {
    display: none;
  }
  &::before {
    content: '+';
    font-size: 18px;
  }
  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}
.vote-details[open] > summary::before {
  content: '−';
}
@import './voter-groups.scss';
</style>
