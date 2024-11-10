<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.witch') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('witch')" alt="witch" />

    <h2>General Information:</h2>
    <p>
      Playing as <PreviewLink target="witch" /> gives you a unique power within the minions of evil: the ability to hide
      the outcome of one mission. Your goal is to create uncertainty and chaos among the forces of good, ensuring that
      they remain in doubt, ultimately tilting the game in favor of evil while maintaining your cover.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Sow seeds of confusion:</strong> Utilize your skill to keep players uncertain about mission outcomes,
        causing doubt and indecision within the ranks of good.
      </li>
      <li>
        <strong>Collaborate with fellow evildoers:</strong> Work closely with other evil players to synchronize your
        actions and maximize the impact of your hidden missions.
      </li>
      <li>
        <strong>Utilize your power strategically:</strong> Timing is crucial when deciding to hide a mission's result.
        Choose the moment that will best serve the interests of the evil team.
      </li>
      <li>
        <strong>Maintain your disguise:</strong> Avoid giving away any hints that could reveal your true allegiance or
        arouse suspicion about your intentions.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Create uncertainty:</strong> Your ability to obscure mission results leaves good players in the dark,
        making it difficult for them to strategize effectively.
      </li>
      <li>
        <strong>Influence gameplay:</strong> Encourage doubt and discord among good players, steering discussions and
        decisions in a direction favorable to evil.
      </li>
      <li>
        <strong>Hide early missions:</strong> The most logical choice is to hide the results of the first or second
        mission to introduce confusion early and shake the foundation of trust among good players.
      </li>
    </ul>

    <p>
      As <PreviewLink target="witch" />, you weave uncertainty and misdirection into the fabric of the game. By masking
      the truth, you can destabilize the forces of good and steer the tide of battle in evil's favor. Embrace your role
      and let chaos reign supreme!
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
