<template>
  <span :title="icon" class="player-icon-image" :class="[classes, { thumbnail }]"></span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TPlayerIcon } from '@/components/view/information/interface';

export default defineComponent({
  props: {
    thumbnail: Boolean,
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
// Keep full artwork for cards; only small inline icons opt into thumbnails.
@mixin player-image($type, $id) {
  background-image: getImagePathByID($type, $id);

  &.thumbnail {
    background-image: getThumbnailPathByID($type, $id);
  }
}

.player-icon-image {
  display: block;
  border-radius: 50%;
  background-size: 160%;
}

.icon-merlin {
  @include player-image('roles', 'merlin');
  background-position: 45% 0%;
}

.icon-merlinPure {
  @include player-image('roles', 'merlin_pure');
  background-position: 55% 0%;
}

.icon-evilLancelot {
  @include player-image('roles', 'evil_lancelot');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-goodLancelot {
  @include player-image('roles', 'good_lancelot');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-unknownLancelot {
  @include player-image('roles', 'unknown_lancelot');
  background-size: 140%;
  background-position: 48% 0%;
}

.icon-guinevere {
  @include player-image('roles', 'guinevere');
  background-size: 135%;
  background-position: 42% 15%;
}

.icon-morgana {
  @include player-image('roles', 'morgana');
  background-position: 51% 20%;
  background-size: 165%;
}

.icon-trickster {
  @include player-image('roles', 'trickster');
  background-position: 52% 23%;
  background-size: 165%;
}

.icon-percival {
  @include player-image('roles', 'percival');
  background-position: 50% 15%;
  background-size: 170%;
}

.icon-mysteryWizard {
  @include player-image('roles', 'mystery');
  background-position: 50% 5%;
}

.icon-minion {
  @include player-image('roles', 'minion');
  background-position: 40% 0%;
  background-size: 150%;
}

.icon-servant {
  @include player-image('roles', 'servant');
  background-position: 48% 25%;
  background-size: 150%;
}

.icon-mordred {
  @include player-image('roles', 'mordred');
  background-position: 45% 0%;
  background-size: 170%;
}

.icon-oberon {
  @include player-image('roles', 'oberon');
  background-position: 50% 40%;
  background-size: 145%;
}

.icon-wraith {
  @include player-image('roles', 'wraith');
  background-position: 50% 30%;
  background-size: 155%;
}

.icon-lunatic {
  @include player-image('roles', 'lunatic');
  background-position: 52% 15%;
  background-size: 140%;
}

.icon-tristan {
  @include player-image('roles', 'tristan');
  background-position: 40% 5%;
  background-size: 145%;
}

.icon-isolde {
  @include player-image('roles', 'isolde');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-brute {
  @include player-image('roles', 'brute');
  background-position: 51% 10%;
  background-size: 145%;
}

.icon-troublemaker {
  @include player-image('roles', 'troublemaker');
  background-position: 53% 0%;
  background-size: 165%;
}

.icon-witch {
  @include player-image('roles', 'witch');
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
  @include player-image('roles', 'revealer');
}

.icon-revealer_hidden {
  @include player-image('roles', 'revealer_hidden');
}

.icon-revealer_progress {
  @include player-image('roles', 'revealer_progress');
}

.icon-cleric {
  @include player-image('roles', 'cleric');
  background-position: 60% 10%;
  background-size: 125%;
}

.icon-evil {
  @include player-image('core', 'red_team_no_background');
  background-position: 50% 52%;
  background-size: 135%;
}

.icon-good {
  @include player-image('core', 'blue_team_no_background');
  background-position: 50% 52%;
  background-size: 100%;
}

.icon-unknown {
  @include player-image('core', 'player-frame');
  background-position: center;
  background-size: 135%;
}

.icon-excalibur {
  @include player-image('features', 'excalibur');
  background-position: center;
  background-size: 100%;
}

.style-legacy {
  &.icon-merlin {
    @include player-image('roles/legacy', 'merlin');
    background-size: 100%;
    background-position: 0% 15%;
  }

  &.icon-minion {
    @include player-image('roles/legacy', 'minion');
    background-size: 100%;
    background-position: 0% 40%;
  }

  &.icon-mordred {
    @include player-image('roles/legacy', 'mordred');
    background-size: 100%;
    background-position: 0% 30%;
  }

  &.icon-morgana {
    @include player-image('roles/legacy', 'morgana');
    background-size: 100%;
    background-position: 0% 10%;
  }

  &.icon-oberon {
    @include player-image('roles/legacy', 'oberon');
    background-size: 100%;
    background-position: 0% 25%;
  }

  &.icon-percival {
    @include player-image('roles/legacy', 'percival');
    background-size: 105%;
    background-position: 0% 20%;
  }

  &.icon-servant {
    @include player-image('roles/legacy', 'servant');
    background-size: 100%;
    background-position: 0% 0%;
  }
}

.style-anime {
  &.icon-merlin {
    @include player-image('roles/anime', 'merlin');
    background-size: 175%;
    background-position: 40% 0%;
  }

  &.icon-merlinPure {
    @include player-image('roles/anime', 'merlin_pure');
    background-size: 155%;
    background-position: 33% 0%;
  }

  &.icon-minion {
    @include player-image('roles/anime', 'minion');
    background-size: 190%;
    background-position: 43% 0%;
  }

  &.icon-servant {
    @include player-image('roles/anime', 'servant');
    background-size: 180%;
    background-position: 45% 0%;
  }

  &.icon-percival {
    @include player-image('roles/anime', 'percival');
    background-size: 215%;
    background-position: 50% 0%;
  }

  &.icon-morgana {
    @include player-image('roles/anime', 'morgana');
    background-size: 140%;
    background-position: 50% 0%;
  }

  &.icon-mysteryWizard {
    @include player-image('roles/anime', 'mystery');
    background-position: 50% 8%;
    background-size: 190%;
  }

  &.icon-mordred {
    @include player-image('roles/anime', 'mordred');
    background-size: 220%;
    background-position: 50% 0%;
  }

  &.icon-oberon {
    @include player-image('roles/anime', 'oberon');
    background-size: 175%;
    background-position: 50% 0%;
  }

  &.icon-lunatic {
    @include player-image('roles/anime', 'lunatic');
    background-size: 145%;
    background-position: 55% 5%;
  }

  &.icon-tristan {
    @include player-image('roles/anime', 'tristan');
    background-size: 210%;
    background-position: 50% 5%;
  }

  &.icon-isolde {
    @include player-image('roles/anime', 'isolde');
    background-size: 160%;
    background-position: 41% 0%;
  }

  &.icon-brute {
    @include player-image('roles/anime', 'brute');
    background-size: 175%;
    background-position: 48% 0%;
  }

  &.icon-evilLancelot {
    @include player-image('roles/anime', 'evil_lancelot');
    background-size: 150%;
    background-position: 52% 0%;
  }

  &.icon-goodLancelot {
    @include player-image('roles/anime', 'good_lancelot');
    background-size: 150%;
    background-position: 45% 0%;
  }

  &.icon-unknownLancelot {
    @include player-image('roles/anime', 'unknown_lancelot');
    background-size: 150%;
    background-position: 45% 0%;
  }

  &.icon-troublemaker {
    @include player-image('roles/anime', 'troublemaker');
    background-position: 43% 0%;
    background-size: 230%;
  }

  &.icon-guinevere {
    background-size: 160%;
    background-position: 50% 0%;
    @include player-image('roles/anime', 'guinevere');
  }

  &.icon-trickster {
    @include player-image('roles/anime', 'trickster');
    background-size: 195%;
    background-position: 56% 20%;
  }

  &.icon-witch {
    @include player-image('roles/anime', 'witch');
    background-position: 55% 0%;
    background-size: 130%;
  }

  &.icon-cleric {
    @include player-image('roles/anime', 'cleric');
    background-position: 50% 3%;
    background-size: 200%;
  }

  &.icon-wraith {
    @include player-image('roles/anime', 'wraith');
    background-position: 52% 20%;
    background-size: 155%;
  }

  &.icon-revealer,
  &.icon-revealer_hidden,
  &.icon-revealer_progress {
    background-position: 50% 0%;
    background-size: 120%;
  }

  &.icon-revealer {
    @include player-image('roles/anime', 'revealer');
  }

  &.icon-revealer_hidden {
    @include player-image('roles/anime', 'revealer_hidden');
  }

  &.icon-revealer_progress {
    @include player-image('roles/anime', 'revealer_progress');
  }
}
</style>
