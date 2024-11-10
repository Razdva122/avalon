<template>
  <div :title="icon" class="player-icon-image" :class="classes"></div>
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
  computed: {
    classes() {
      return `icon-${this.icon} style-${this.$store.state.user?.settings?.style}`;
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

.icon-unknownLancelot {
  background-image: url('@/assets/roles/unknown_lancelot.webp');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-guinevere {
  background-image: url('@/assets/roles/guinevere.webp');
  background-size: 135%;
  background-position: 42% 15%;
}

.icon-morgana {
  background-image: url('@/assets/roles/morgana.webp');
  background-position: 51% 20%;
  background-size: 165%;
}

.icon-trickster {
  background-image: url('@/assets/roles/trickster.webp');
  background-position: 52% 23%;
  background-size: 165%;
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
  background-position: 51% 40%;
  background-size: 135%;
}

.icon-lunatic {
  background-image: url('@/assets/roles/lunatic.webp');
  background-position: 52% 15%;
  background-size: 140%;
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

.icon-brute {
  background-image: url('@/assets/roles/brute.webp');
  background-position: 51% 10%;
  background-size: 145%;
}

.icon-troublemaker {
  background-image: url('@/assets/roles/troublemaker.webp');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-witch {
  background-image: url('@/assets/roles/witch.webp');
  background-position: 40% 15%;
  background-size: 130%;
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

.style-anime {
  &.icon-merlin {
    background-image: url('@/assets/roles/anime/merlin.webp');
    background-size: 175%;
    background-position: 40% 0%;
  }

  &.icon-merlinPure {
    background-image: url('@/assets/roles/anime/merlin_pure.webp');
    background-size: 155%;
    background-position: 33% 0%;
  }

  &.icon-minion {
    background-image: url('@/assets/roles/anime/minion.webp');
    background-size: 190%;
    background-position: 43% 0%;
  }

  &.icon-servant {
    background-image: url('@/assets/roles/anime/servant.webp');
    background-size: 180%;
    background-position: 45% 0%;
  }

  &.icon-percival {
    background-image: url('@/assets/roles/anime/percival.webp');
    background-size: 215%;
    background-position: 50% 0%;
  }

  &.icon-morgana {
    background-image: url('@/assets/roles/anime/morgana.webp');
    background-size: 140%;
    background-position: 50% 0%;
  }

  &.icon-mysteryWizard {
    background-image: url('@/assets/roles/anime/mystery.webp');
    background-position: 50% 8%;
    background-size: 190%;
  }

  &.icon-mordred {
    background-image: url('@/assets/roles/anime/mordred.webp');
    background-size: 220%;
    background-position: 50% 0%;
  }

  &.icon-oberon {
    background-image: url('@/assets/roles/anime/oberon.webp');
    background-size: 175%;
    background-position: 50% 0%;
  }

  &.icon-lunatic {
    background-image: url('@/assets/roles/anime/lunatic.webp');
    background-size: 145%;
    background-position: 55% 5%;
  }

  &.icon-tristan {
    background-image: url('@/assets/roles/anime/tristan.webp');
    background-size: 210%;
    background-position: 50% 5%;
  }

  &.icon-isolde {
    background-image: url('@/assets/roles/anime/isolde.webp');
    background-size: 160%;
    background-position: 41% 0%;
  }

  &.icon-brute {
    background-image: url('@/assets/roles/anime/brute.webp');
    background-size: 175%;
    background-position: 48% 0%;
  }

  &.icon-evilLancelot {
    background-image: url('@/assets/roles/anime/evil_lancelot.webp');
    background-size: 150%;
    background-position: 52% 0%;
  }

  &.icon-goodLancelot {
    background-image: url('@/assets/roles/anime/good_lancelot.webp');
    background-size: 150%;
    background-position: 45% 0%;
  }

  &.icon-unknownLancelot {
    background-image: url('@/assets/roles/anime/unknown_lancelot.webp');
    background-size: 150%;
    background-position: 45% 0%;
  }

  &.icon-troublemaker {
    background-image: url('@/assets/roles/anime/troublemaker.webp');
    background-position: 43% 0%;
    background-size: 230%;
  }

  &.icon-guinevere {
    background-size: 160%;
    background-position: 50% 0%;
    background-image: url('@/assets/roles/anime/guinevere.webp');
  }

  &.icon-trickster {
    background-image: url('@/assets/roles/anime/trickster.webp');
    background-size: 195%;
    background-position: 56% 20%;
  }
}
</style>
