<template>
  <div :title="icon" class="player-icon-image" :class="'icon-' + icon"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TPlayerIcon } from '@/components/game/information/interface';

export default defineComponent({
  props: {
    icon: {
      required: true,
      type: String as PropType<TPlayerIcon>,
    },
  },
});
</script>

<style scoped lang="scss">
.player-icon-image {
  border-radius: 50%;
  background-size: 160%;
}

.icon-merlin {
  background-image: url('@/assets/roles/merlin.png');
  background-position: 45% 0%;
}

.icon-merlinPure {
  background-image: url('@/assets/roles/merlin_pure.png');
  background-position: 55% 0%;
}

.icon-morgana {
  background-image: url('@/assets/roles/morgana.png');
  background-position: 47% 35%;
  background-size: 180%;
}

.icon-percival {
  background-image: url('@/assets/roles/percival.png');
  background-position: 50% 15%;
  background-size: 170%;
}

.icon-mysteryWizard {
  background-image: url('@/assets/roles/mystery.png');
  background-position: 50% 5%;
}

.icon-minion {
  background-image: url('@/assets/roles/minion.png');
  background-position: 40% 0%;
  background-size: 150%;
}

.icon-servant {
  background-image: url('@/assets/roles/servant.png');
  background-position: 48% 25%;
  background-size: 150%;
}

.icon-mordred {
  background-image: url('@/assets/roles/mordred.png');
  background-position: 45% 0%;
  background-size: 170%;
}

.icon-oberon {
  background-image: url('@/assets/roles/oberon.png');
  background-position: 54% 50%;
  background-size: 154%;
}

.icon-tristan {
  background-image: url('@/assets/roles/tristan.png');
  background-position: 40% 5%;
  background-size: 145%;
}

.icon-isolde {
  background-image: url('@/assets/roles/isolde.png');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-evil {
  background-image: url('@/assets/red_team_no_background.png');
  background-position: 50% 52%;
  background-size: 135%;
}

.icon-good {
  background-image: url('@/assets/blue_team_no_background.png');
  background-position: 50% 52%;
  background-size: 100%;
}

.icon-unknown {
  background-image: url('@/assets/player-frame.png');
  background-position: center;
  background-size: 135%;
}

.icon-excalibur {
  background-image: url('@/assets/features/excalibur.png');
  background-position: center;
  background-size: 100%;
}
</style>
