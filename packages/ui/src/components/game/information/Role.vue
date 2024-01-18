<template>
  <div :title="role" class="player-role-icon" :class="'role-' + role"></div>
</template>

<script lang="ts">
import { TVisibleRole } from '@avalon/types';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    role: {
      required: true,
      type: String as PropType<TVisibleRole>,
    },
  },
});
</script>

<style scoped lang="scss">
.player-role-icon {
  border-radius: 50%;
  background-size: 160%;
}

.role-merlin {
  background-image: url('@/assets/roles/merlin.png');
  background-position: 45% 0%;
}

.role-merlinPure {
  background-image: url('@/assets/roles/merlin_pure.png');
  background-position: 55% 0%;
}

.role-morgana {
  background-image: url('@/assets/roles/morgana.png');
  background-position: 47% 35%;
  background-size: 180%;
}

.role-percival {
  background-image: url('@/assets/roles/percival.png');
  background-position: 50% 15%;
  background-size: 170%;
}

.role-mysteryWizard {
  background-image: url('@/assets/roles/mystery.png');
  background-position: 50% 5%;
}

.role-minion {
  background-image: url('@/assets/roles/minion.png');
  background-position: 40% 0%;
  background-size: 150%;
}

.role-servant {
  background-image: url('@/assets/roles/servant.png');
  background-position: 48% 25%;
  background-size: 150%;
}

.role-mordred {
  background-image: url('@/assets/roles/mordred.png');
  background-position: 45% 0%;
  background-size: 170%;
}

.role-oberon {
  background-image: url('@/assets/roles/oberon.png');
  background-position: 54% 50%;
  background-size: 154%;
}

.role-evil {
  background-image: url('@/assets/red_team_no_background.png');
  background-position: 50% 52%;
  background-size: 135%;
}

.role-unknown {
  background-image: url('@/assets/player-frame.png');
  background-position: center;
  background-size: 135%;
}
</style>
