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
      return `icon-${this.icon} style-${this.$store.state.settings?.style}`;
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
  background-image: getImagePathByID('roles', 'merlin');
  background-position: 45% 0%;
}

.icon-merlinPure {
  background-image: getImagePathByID('roles', 'merlin_pure');
  background-position: 55% 0%;
}

.icon-evilLancelot {
  background-image: getImagePathByID('roles', 'evil_lancelot');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-goodLancelot {
  background-image: getImagePathByID('roles', 'good_lancelot');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-unknownLancelot {
  background-image: getImagePathByID('roles', 'unknown_lancelot');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-guinevere {
  background-image: getImagePathByID('roles', 'guinevere');
  background-size: 135%;
  background-position: 42% 15%;
}

.icon-morgana {
  background-image: getImagePathByID('roles', 'morgana');
  background-position: 51% 20%;
  background-size: 165%;
}

.icon-trickster {
  background-image: getImagePathByID('roles', 'trickster');
  background-position: 52% 23%;
  background-size: 165%;
}

.icon-percival {
  background-image: getImagePathByID('roles', 'percival');
  background-position: 50% 15%;
  background-size: 170%;
}

.icon-mysteryWizard {
  background-image: getImagePathByID('roles', 'mystery');
  background-position: 50% 5%;
}

.icon-minion {
  background-image: getImagePathByID('roles', 'minion');
  background-position: 40% 0%;
  background-size: 150%;
}

.icon-servant {
  background-image: getImagePathByID('roles', 'servant');
  background-position: 48% 25%;
  background-size: 150%;
}

.icon-mordred {
  background-image: getImagePathByID('roles', 'mordred');
  background-position: 45% 0%;
  background-size: 170%;
}

.icon-oberon {
  background-image: getImagePathByID('roles', 'oberon');
  background-position: 51% 40%;
  background-size: 135%;
}

.icon-lunatic {
  background-image: getImagePathByID('roles', 'lunatic');
  background-position: 52% 15%;
  background-size: 140%;
}

.icon-tristan {
  background-image: getImagePathByID('roles', 'tristan');
  background-position: 40% 5%;
  background-size: 145%;
}

.icon-isolde {
  background-image: getImagePathByID('roles', 'isolde');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-brute {
  background-image: getImagePathByID('roles', 'brute');
  background-position: 51% 10%;
  background-size: 145%;
}

.icon-troublemaker {
  background-image: getImagePathByID('roles', 'troublemaker');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-witch {
  background-image: getImagePathByID('roles', 'witch');
  background-position: 45% 5%;
  background-size: 120%;
}

.icon-revealer,
.icon-revealer_hidden,
.icon-revealer_progress {
  background-position: 43% 35%;
  background-size: 130%;
}

.icon-revealer {
  background-image: getImagePathByID('roles', 'revealer');
}

.icon-revealer_hidden {
  background-image: getImagePathByID('roles', 'revealer_hidden');
}

.icon-revealer_progress {
  background-image: getImagePathByID('roles', 'revealer_progress');
}

.icon-cleric {
  background-image: getImagePathByID('roles', 'cleric');
  background-position: 60% 10%;
  background-size: 125%;
}

.icon-evil {
  background-image: getImagePathByID('core', 'red_team_no_background');
  background-position: 50% 52%;
  background-size: 135%;
}

.icon-good {
  background-image: getImagePathByID('core', 'blue_team_no_background');
  background-position: 50% 52%;
  background-size: 100%;
}

.icon-unknown {
  background-image: getImagePathByID('roles', 'player-frame');
  background-position: center;
  background-size: 135%;
}

.icon-excalibur {
  background-image: getImagePathByID('roles', 'excalibur');
  background-position: center;
  background-size: 100%;
}

.style-anime {
  &.icon-merlin {
    background-image: getImagePathByID('roles/anime', 'merlin');
    background-size: 175%;
    background-position: 40% 0%;
  }

  &.icon-merlinPure {
    background-image: getImagePathByID('roles/anime', 'merlin_pure');
    background-size: 155%;
    background-position: 33% 0%;
  }

  &.icon-minion {
    background-image: getImagePathByID('roles/anime', 'minion');
    background-size: 190%;
    background-position: 43% 0%;
  }

  &.icon-servant {
    background-image: getImagePathByID('roles/anime', 'servant');
    background-size: 180%;
    background-position: 45% 0%;
  }

  &.icon-percival {
    background-image: getImagePathByID('roles/anime', 'percival');
    background-size: 215%;
    background-position: 50% 0%;
  }

  &.icon-morgana {
    background-image: getImagePathByID('roles/anime', 'morgana');
    background-size: 140%;
    background-position: 50% 0%;
  }

  &.icon-mysteryWizard {
    background-image: getImagePathByID('roles/anime', 'mystery');
    background-position: 50% 8%;
    background-size: 190%;
  }

  &.icon-mordred {
    background-image: getImagePathByID('roles/anime', 'mordred');
    background-size: 220%;
    background-position: 50% 0%;
  }

  &.icon-oberon {
    background-image: getImagePathByID('roles/anime', 'oberon');
    background-size: 175%;
    background-position: 50% 0%;
  }

  &.icon-lunatic {
    background-image: getImagePathByID('roles/anime', 'lunatic');
    background-size: 145%;
    background-position: 55% 5%;
  }

  &.icon-tristan {
    background-image: getImagePathByID('roles/anime', 'tristan');
    background-size: 210%;
    background-position: 50% 5%;
  }

  &.icon-isolde {
    background-image: getImagePathByID('roles/anime', 'isolde');
    background-size: 160%;
    background-position: 41% 0%;
  }

  &.icon-brute {
    background-image: getImagePathByID('roles/anime', 'brute');
    background-size: 175%;
    background-position: 48% 0%;
  }

  &.icon-evilLancelot {
    background-image: getImagePathByID('roles/anime', 'evil_lancelot');
    background-size: 150%;
    background-position: 52% 0%;
  }

  &.icon-goodLancelot {
    background-image: getImagePathByID('roles/anime', 'good_lancelot');
    background-size: 150%;
    background-position: 45% 0%;
  }

  &.icon-unknownLancelot {
    background-image: getImagePathByID('roles/anime', 'unknown_lancelot');
    background-size: 150%;
    background-position: 45% 0%;
  }

  &.icon-troublemaker {
    background-image: getImagePathByID('roles/anime', 'troublemaker');
    background-position: 43% 0%;
    background-size: 230%;
  }

  &.icon-guinevere {
    background-size: 160%;
    background-position: 50% 0%;
    background-image: getImagePathByID('roles/anime', 'guinevere');
  }

  &.icon-trickster {
    background-image: getImagePathByID('roles/anime', 'trickster');
    background-size: 195%;
    background-position: 56% 20%;
  }

  &.icon-witch {
    background-image: getImagePathByID('roles/anime', 'witch');
    background-position: 55% 0%;
    background-size: 130%;
  }

  &.icon-cleric {
    background-image: getImagePathByID('roles/anime', 'cleric');
    background-position: 50% 3%;
    background-size: 200%;
  }

  &.icon-revealer,
  &.icon-revealer_hidden,
  &.icon-revealer_progress {
    background-position: 50% 0%;
    background-size: 120%;
  }

  &.icon-revealer {
    background-image: getImagePathByID('roles/anime', 'revealer');
  }

  &.icon-revealer_hidden {
    background-image: getImagePathByID('roles/anime', 'revealer_hidden');
  }

  &.icon-revealer_progress {
    background-image: getImagePathByID('roles/anime', 'revealer_progress');
  }
}
</style>
