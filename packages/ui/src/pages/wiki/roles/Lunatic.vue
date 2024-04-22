<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      Lunatic Role
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('lunatic')" alt="lunatic" />

    <h2>General Information:</h2>
    <p>
      The role of <PreviewLink target="lunatic" /> in the tabletop game Avalon adds a twist to the standard gameplay for
      Minions of Evil. Unlike other minions, a Lunatic must vote "Fail" on every mission they are part of, simulating
      uncompromising sabotage. This compulsory action increases the challenge for the forces of evil, as it can reveal
      the Lunatic's identity if not handled wisely.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Incorporate mandatory failure strategically:</strong> While you must always vote "Fail" when on a
        mission, be strategic about your gameplay in other aspects to avoid immediate detection.
      </li>
      <li>
        <strong>Bluff effectively:</strong> Conceal your obligated failure by participating in discussions and
        strategies as if you have a choice, maintaining an air of unpredictability.
      </li>
      <li>
        <strong>Align with other minions subtly:</strong> Although your role requires overt sabotage, look for
        opportunities to support other minions in more covert ways.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Monitor the flow:</strong> Pay close attention to how the game is developing. Your forced failures
        should ideally come at moments that cause maximum confusion and disruption.
      </li>
      <li>
        <strong>Avoid patterns:</strong> Although you must always fail missions, vary your behavior in discussions and
        non-mission related decisions to confuse others about your true role.
      </li>
    </ul>

    <p>
      Embrace the role of <PreviewLink target="lunatic" /> with cunning and subtlety. Your challenge is not only to
      disrupt the missions but also to sew discord while maintaining your disguise among both allies and enemies.
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
</style>
