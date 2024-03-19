<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      Oberon Role
    </h1>
    <img class="preview-image" src="@/assets/roles/oberon.webp" alt="oberon" />

    <p>
      Playing as <PreviewLink target="oberon" /> presents unique challenges as you are a Minion of Evil, but you do not
      know the identities of your fellow minions, and they do not know you. You are tasked with disrupting the forces of
      good while navigating the game with limited information.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Embrace your mystery:</strong> Use your unknown status to create confusion among all players, both good
        and evil.
      </li>
      <li>
        <strong>Observe closely:</strong> Pay attention to the behavior and decisions of other players to try and deduce
        the identities of your fellow minions.
      </li>
      <li>
        <strong>Act independently:</strong> Without direct coordination from other minions, make moves that you believe
        will benefit the evil side.
      </li>
      <li>
        <strong>Mislead subtly:</strong> Make statements and take actions that sow doubt among the good players, without
        revealing your true allegiance.
      </li>
      <li>
        <strong>Take risks:</strong> You may need to make bold moves to gain the trust of either side and disrupt the
        plans of the good players.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Create uncertainty:</strong> Always aim to destabilize the confidence that good players have in one
        another.
      </li>
      <li>
        <strong>Be unpredictable:</strong> Vary your gameplay to avoid any patterns that could reveal your role as
        <PreviewLink target="oberon" />.
      </li>
      <li>
        <strong>Listen for clues:</strong> Your fellow evil players may inadvertently reveal themselves; use this to
        your advantage to collaborate indirectly.
      </li>
      <li>
        <strong>Avoid drawing attention:</strong> A too-active playstyle may draw suspicion. Instead, focus on making
        key plays that can tilt the game's outcome.
      </li>
    </ul>

    <p>
      Playing as <PreviewLink target="oberon" /> requires cunning, adaptability, and a flair for deception. Your
      unpredictability is an asset that, if used wisely, can turn the tides of the game. Confuse, deceive, and scheme
      your way to victory for evil!
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/game/information/PreviewLink.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
