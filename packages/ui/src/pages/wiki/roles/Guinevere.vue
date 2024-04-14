<template>
  <div class="info-page-content guinevere">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      Guinevere Role
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('guinevere')" alt="guinevere" />
    <div class="credits">credits to: @Robrun</div>

    <h2>General Information:</h2>
    <p>
      Taking on the role of <PreviewLink target="guinevere" /> requires a delicate approach: she knows both Lancelots
      <PreviewLink target="goodLancelot" text="Good Lancelot" /> and
      <PreviewLink target="evilLancelot" text="Evil Lancelot" /> but does not know their current allegiance. Her
      objective is to aid the side of good discreetly, as like <PreviewLink target="merlin" />, she may be killed at the
      game's end if identified by the forces of evil.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Be cautious with your knowledge:</strong> Guinevere must use her awareness to subtly guide her allies
        towards victory without revealing her role.
      </li>
      <li>
        <strong>Use hints wisely:</strong> The ability to give subtle hints to your team without being too overt is
        crucial for Guinevere.
      </li>
      <li>
        <strong>Maintain balance in your gameplay:</strong> Sometimes, it's important not to appear too knowledgeable.
        Deliberate mistakes or silence can misdirect the forces of evil.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Determine Lancelot's loyalty:</strong> Strive to figure out which Lancelot is true to the cause of good
        and which may have turned to evil. This knowledge can significantly impact your strategy.
      </li>
      <li>
        <strong>Strategize with silence:</strong> Sometimes, the best way to conceal your role is to hold back comments,
        especially in the early stages of the game.
      </li>
      <li>
        <strong>Build trust:</strong> Convincing other players of your allegiance to good is as vital as revealing evil.
        Trust can sway team decisions.
      </li>
    </ul>

    <p>
      Playing as <PreviewLink target="guinevere" /> is challenging but immensely rewarding. With thoughtful strategy and
      judicious communication, you can lead the forces of good to victory while evading detection by evil's assassin.
      Good luck!
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

.credits {
  float: right;
  clear: right;
  font-size: 14px;
  width: 30%;
  max-width: 450px;
  text-align: center;
  opacity: 0.6;
}
</style>
