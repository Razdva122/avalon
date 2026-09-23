<template>
  <div class="vote-table">
    <p v-if="!columns.length" class="py-4 text-center">{{ $t('history.noVotes') }}</p>
    <template v-else>
      <div class="legend mb-3 text-body-2">
        <span class="legend-item"><i class="swatch approve" />{{ $t('vote.approve') }}</span>
        <span class="legend-item"><i class="swatch reject" />{{ $t('vote.reject') }}</span>
        <span>✓ {{ $t('history.teamMember') }}</span>
        <span class="legend-item"><i class="swatch leader" />{{ $t('history.teamLeader') }}</span>
        <span>? {{ $t('history.anonymousVotes') }}</span>
        <span class="legend-item"><i class="swatch forced" />{{ $t('vote.forcedVote') }}</span>
      </div>
      <p class="text-body-2 mb-2">{{ $t('history.scrollTable') }}</p>
      <div class="table-scroll" tabindex="0" role="region" :aria-label="$t('history.tableView')">
        <table>
          <caption class="sr-only">
            {{
              $t('history.tableView')
            }}
          </caption>
          <thead>
            <tr>
              <th class="player-name" scope="col">{{ $t('history.player') }}</th>
              <th
                v-for="(group, index) in groups"
                :key="index"
                :colspan="group.votes.length"
                scope="colgroup"
                :class="['mission-heading', group.result]"
              >
                {{
                  group.index === null ? $t('history.hidden') : $t('mission.indexMission', { index: group.index + 1 })
                }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in sortedPlayers" :key="player.id">
              <th
                class="player-name"
                scope="row"
                :class="
                  gameEnded
                    ? {
                        'text-info': rolesShortInfo[player.role].loyalty === 'good',
                        'text-error': rolesShortInfo[player.role].loyalty === 'evil',
                      }
                    : undefined
                "
                :title="playerNames[player.id]"
              >
                {{ playerNames[player.id] }}
                <span v-if="gameEnded && rolesShortInfo[player.role].loyalty !== 'unknown'" class="sr-only">
                  — {{ $t(`game.${rolesShortInfo[player.role].loyalty}`) }}
                </span>
              </th>
              <td
                v-for="(vote, index) in columns"
                :key="index"
                :class="[value(vote, player.id), { leader: vote.leaderID === player.id, forced: vote.forced }]"
                :title="cellLabel(vote, player.id)"
                :aria-label="cellLabel(vote, player.id)"
              >
                <span v-if="vote.team.some((member) => member.id === player.id)">✓</span>
                <small v-if="vote.anonymous && !vote.forced">?</small>
                <span class="sr-only">{{ cellLabel(vote, player.id) }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="columns.some((vote) => vote.anonymous && !vote.forced)">
            <tr>
              <th class="player-name" scope="row">{{ $t('history.voteTotals') }}</th>
              <td v-for="(vote, index) in columns" :key="index" class="totals" :class="{ forced: vote.forced }">
                {{ vote.anonymous && !vote.forced ? `${count(vote, 'approve')}/${count(vote, 'reject')}` : '' }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { rolesShortInfo } from '@/components/view/information/const';
import { useI18n } from 'vue-i18n';
import type { Player, THistoryResults, THistoryVote } from '@avalon/types';

const props = defineProps<{
  history: THistoryResults[];
  players: Player[];
  playerNames: Record<string, string>;
  gameEnded?: boolean;
}>();
const { t } = useI18n();

const sortedPlayers = computed(() => [...props.players].sort((a, b) => a.index - b.index));

const groups = computed(() => {
  const result: { index: number | null; votes: THistoryVote[]; result?: string }[] = [];
  let current: (typeof result)[number] = { index: 0, votes: [] };
  for (const entry of props.history) {
    if (entry.type === 'hidden') current.index = null;
    if (entry.type === 'vote') current.votes.push(entry);
    if (entry.type === 'mission') {
      current.index = entry.index;
      current.result = entry.result;
      if (current.votes.length) result.push(current);
      current = { index: entry.index + 1, votes: [] };
    }
  }
  if (current.votes.length) result.push(current);
  return result;
});
const columns = computed(() => groups.value.flatMap((group) => group.votes));
const value = (vote: THistoryVote, id: string) =>
  vote.forced || vote.anonymous ? undefined : vote.votes.find((item) => item.playerID === id)?.value;
const count = (vote: THistoryVote, option: 'approve' | 'reject') =>
  vote.anonymous ? vote.votes[option] : vote.votes.filter((item) => item.value === option).length;
const cellLabel = (vote: THistoryVote, id: string) => {
  const parts = [props.playerNames[id]];
  if (vote.leaderID === id) parts.push(t('history.teamLeader'));
  if (vote.team.some((member) => member.id === id)) parts.push(t('history.teamMember'));
  const choice = value(vote, id);
  parts.push(
    vote.forced
      ? t('vote.forcedVote')
      : vote.anonymous
        ? t('history.anonymousVotes')
        : choice
          ? t(`vote.${choice}`)
          : '—',
  );
  return parts.join(', ');
};
</script>

<style scoped lang="scss">
.vote-table {
  min-width: 0;

  > .legend,
  > p {
    contain: inline-size;
  }
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.swatch {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 3px;
}
.table-scroll {
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.25);
  border-radius: 8px;
}
table {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
}
th,
td {
  padding: 4px 6px;
  text-align: center;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.2);
}
td {
  min-width: 32px;
  height: 30px;
}
td {
  font-size: 18px;
  font-weight: 700;
}
small {
  font-size: 13px;
  margin-left: 2px;
}
.player-name {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgb(var(--v-theme-surface));
  text-align: left;
  min-width: 112px;
  max-width: 180px;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.mission-heading {
  white-space: nowrap;
  font-size: 14px;
}
.approve {
  background: #c8e6c9;
  color: #173f21;
}
.reject {
  background: #ffcdd2;
  color: #651d27;
}
.success,
.forced {
  background: #bbdefb;
  color: #153b60;
}
.fail {
  background: #ef9a9a;
  color: #581c1c;
}
.leader {
  box-shadow: inset 0 0 0 3px rgb(var(--v-theme-on-surface));
}
.approve.leader,
.reject.leader,
.forced.leader {
  box-shadow: inset 0 0 0 3px #253246;
}
.totals {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 600px) {
  th,
  td {
    padding: 3px 5px;
  }
  .player-name {
    min-width: 96px;
    max-width: 120px;
    font-size: 12px;
  }
  .legend {
    font-size: 12px !important;
    gap: 6px 12px;
  }
}
</style>
