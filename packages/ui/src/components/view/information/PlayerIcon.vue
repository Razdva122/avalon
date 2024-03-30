<template>
  <div :title="icon" class="player-icon-image" :class="'icon-' + icon"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TPlayerIcon } from '@/components/view/information/interface';

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
  background-image: url('@/assets/roles/merlin.webp');
  background-position: 45% 0%;
}

.icon-merlinPure {
  background-image: url('@/assets/roles/merlin_pure.webp');
  background-position: 55% 0%;
}

.icon-evilLancelot {
  background-image: url('@/assets/roles/evil_lancelot.webp');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-goodLancelot {
  background-image: url('@/assets/roles/good_lancelot.webp');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-morgana {
  background-image: url('@/assets/roles/morgana.webp');
  background-position: 47% 35%;
  background-size: 180%;
}

.icon-percival {
  background-image: url('@/assets/roles/percival.webp');
  background-position: 50% 15%;
  background-size: 170%;
}

.icon-mysteryWizard {
  background-image: url('@/assets/roles/mystery.webp');
  background-position: 50% 5%;
}

.icon-minion {
  background-image: url('@/assets/roles/minion.webp');
  background-position: 40% 0%;
  background-size: 150%;
}

.icon-servant {
  background-image: url('@/assets/roles/servant.webp');
  background-position: 48% 25%;
  background-size: 150%;
}

.icon-mordred {
  background-image: url('@/assets/roles/mordred.webp');
  background-position: 45% 0%;
  background-size: 170%;
}

.icon-oberon {
  background-image: url('@/assets/roles/oberon.webp');
  background-position: 54% 50%;
  background-size: 154%;
}

.icon-tristan {
  background-image: url('@/assets/roles/tristan.webp');
  background-position: 40% 5%;
  background-size: 145%;
}

.icon-isolde {
  background-image: url('@/assets/roles/isolde.webp');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-evil {
  background-image: url('@/assets/red_team_no_background.webp');
  background-position: 50% 52%;
  background-size: 135%;
}

.icon-good {
  background-image: url('@/assets/blue_team_no_background.webp');
  background-position: 50% 52%;
  background-size: 100%;
}

.icon-unknown {
  background-image: url('@/assets/player-frame.webp');
  background-position: center;
  background-size: 135%;
}

.icon-excalibur {
  background-image: url('@/assets/features/excalibur.webp');
  background-position: center;
  background-size: 100%;
}
</style>
