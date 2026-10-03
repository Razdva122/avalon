<template>
  <section class="decision-card" :class="{ 'decision-preview': preview }" :aria-label="$t('aiArena.lastDecision')">
    <header class="decision-header">
      <Avatar v-if="avatar" :avatarID="avatar" class="decision-avatar" />
      <div class="decision-identity">
        <strong>{{ name }}</strong>
        <div class="decision-caption">{{ $t('aiArena.lastDecision') }}</div>
      </div>
      <v-btn
        v-if="!preview"
        icon="close"
        variant="text"
        :aria-label="$t('chat.closeProfile')"
        @click="$emit('close')"
      />
    </header>
    <div class="decision-meta">
      {{ $t('aiArena.decisionSeat', { seat: decision.seat, mission: decision.mission }) }}
      <span>
        ·
        {{ $t(decision.stage === 'discussion' ? 'aiArena.teamDiscussion' : `game.${gameStageLabel(decision.stage)}`) }}
      </span>
    </div>
    <div class="decision-action">
      <div class="decision-caption">
        {{ $t(decision.stage === 'discussion' ? 'aiArena.preferredTeam' : 'aiArena.chosenAction') }}
      </div>
      <p>{{ decision.choice }}</p>
    </div>
    <template v-if="!preview">
      <div class="decision-caption">{{ $t('aiArena.privateReason') }}</div>
      <p class="decision-reason">{{ decision.reason || '—' }}</p>
      <router-link class="decision-profile" :to="`/stats/user/${decision.playerID}/`" @click="$emit('close')">
        {{ $t('userStats.profile') }} · {{ name }}
      </router-link>
    </template>
    <div v-else class="decision-caption mt-3">{{ $t('aiArena.openDecision') }}</div>
  </section>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { AiSpectatorDecision } from '@avalon/types';
import { gameStageLabel } from '@/helpers/game-stage-label';
import Avatar from '@/components/user/Avatar.vue';
export default defineComponent({
  components: { Avatar },
  props: {
    decision: { type: Object as PropType<AiSpectatorDecision>, required: true },
    name: { type: String, required: true },
    avatar: String,
    preview: Boolean,
  },
  emits: ['close'],
  setup() {
    return { gameStageLabel };
  },
});
</script>
<style scoped lang="scss">
.decision-card {
  width: min(560px, calc(100vw - 32px));
  max-height: 80dvh;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
  white-space: normal;
  font-size: 16px;
  line-height: 1.6;
}
.decision-preview {
  width: min(320px, calc(100vw - 48px));
  padding: 16px;
  font-size: 14px;
}
.decision-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.decision-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.decision-identity {
  flex: 1;
  min-width: 0;
}
.decision-caption,
.decision-meta {
  font-size: 13px;
  opacity: 0.75;
}
.decision-meta {
  margin: 16px 0;
}
.decision-action {
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
}
.decision-preview .decision-action {
  margin-bottom: 0;
}
.decision-reason {
  margin-top: 6px;
}
.decision-profile {
  display: block;
  padding: 12px 0;
  margin-top: 12px;
  color: rgb(var(--v-theme-primary));
  text-underline-offset: 3px;
}
.decision-profile:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
}
</style>
