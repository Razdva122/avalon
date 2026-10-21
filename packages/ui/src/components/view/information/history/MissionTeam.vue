<template>
  <ul class="team-chips" :aria-label="$t('mission.team')">
    <li
      v-for="member in team"
      :key="member.id"
      class="team-chip"
      :class="cardResult(member.id) && `team-chip--${cardResult(member.id)}`"
    >
      <span class="team-name">{{ playerNames[member.id] }}</span>
      <span v-if="member.id === leaderID" class="chip-label">{{ $t('history.teamLeader') }}</span>
      <span v-if="member.excalibur" class="chip-label">{{ $t('vote.excaliburOwner') }}</span>
      <span v-if="actions?.some((action) => action.playerID === member.id && action.discarded)" class="chip-label">{{
        $t('trapper.excluded')
      }}</span>
      <span v-if="cardResult(member.id)" class="card-result">
        <span aria-hidden="true">{{ cardResult(member.id) === 'fail' ? '×' : '✓' }}</span>
        {{ $t(cardResult(member.id) === 'fail' ? 'mission.cardFail' : 'mission.cardSuccess') }}
      </span>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IAction, TeamMember } from '@avalon/types';

export default defineComponent({
  props: {
    team: { type: Array as PropType<TeamMember[]>, required: true },
    playerNames: { type: Object as PropType<Record<string, string>>, required: true },
    leaderID: String,
    actions: Array as PropType<IAction[]>,
  },
  methods: {
    cardResult(id: string) {
      const action = this.actions?.find((action) => action.playerID === id);
      return action && 'value' in action && (action.value === 'success' || action.value === 'fail')
        ? action.value
        : undefined;
    },
  },
});
</script>

<style scoped lang="scss">
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
  &--success {
    border-color: rgba(var(--v-theme-history-card-success), 0.5);
    background: rgba(var(--v-theme-history-card-success), 0.08);
  }
  &--fail {
    border-color: rgba(var(--v-theme-history-card-fail), var(--v-history-card-fail-border-opacity));
    background: rgba(var(--v-theme-history-card-fail), 0.07);
  }
}
.team-name {
  min-width: 0;
  overflow-wrap: anywhere;
}
.chip-label {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.card-result {
  font-size: 12px;
  font-weight: 600;
}
</style>
