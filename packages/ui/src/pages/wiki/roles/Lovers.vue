<template>
  <div class="info-page-content lovers">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      Lovers (Tristan and Isolde) Role
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('isolde')" alt="isolde" />
    <img class="preview-image" :src="calculateRoleUrl('tristan')" alt="tristan" />
    <div class="credits">credits to: @Vermilion0</div>

    <h2>General Information:</h2>
    <p>
      Playing as the Lovers, <PreviewLink target="tristan" /> and <PreviewLink target="isolde" />, adds a romantic twist
      to the game. Your bond is strong, as you know each other from the start and are working for the side of good. Yet,
      this love must be kept secret, if you are both identified, the Assassin can choose to eliminate you instead of
      Merlin at the end of the game.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Maintain individual personas:</strong> Act independently of each other to avoid creating patterns that
        could lead to your joint discovery.
      </li>
      <li>
        <strong>Protect each other:</strong> Be aware of the game's flow, and if suspicion falls on one, the other
        should deflect subtly, not overtly.
      </li>
      <li>
        <strong>Disguise your gameplay:</strong> Occasionally vote or argue against each other to dispel any notion of
        your alliance.
      </li>
      <li>
        <strong>Be careful with meetings:</strong> Avoid private discussions that could be noticed and raise suspicions
        among other players.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Divide and conquer:</strong> Take on different roles within the forces of good, gathering and sharing
        information from different angles.
      </li>
      <li>
        <strong>Coordinate without collusion:</strong> Plan your strategies in a way that does not require constant or
        obvious coordination.
      </li>
      <li>
        <strong>Establish independent trust:</strong> Each lover should work to gain the trust of other players on their
        own merits.
      </li>
      <li>
        <strong>Plan for contingency:</strong> Have a strategy in place in case one lover is exposed, to ensure the
        other can continue effectively.
      </li>
    </ul>

    <p>
      As the Lovers, <PreviewLink target="tristan" /> and <PreviewLink target="isolde" />, you possess a unique
      advantage that, if leveraged with skill and subtlety, can greatly aid the forces of good. However, the specter of
      the Assassin's choice at the game's end looms ever-present. Navigate the treacherous waters of deceit with care,
      for if your love is unveiled, it may cost you both the ultimate price. Let your bond be your strength, but let
      discretion be your guide. May your love triumph over evil!
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}

.lovers {
  .preview-image {
    width: 25%;
    max-width: 350px;
  }
}

.credits {
  float: right;
  clear: right;
  font-size: 14px;
  width: 50%;
  max-width: 700px;
  text-align: center;
  opacity: 0.6;
}
</style>
