<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      Servant role
    </h1>
    <img class="preview-image" src="@/assets/roles/servant.webp" alt="Servant" />

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Role:</strong> You belong to the "Good" team and your task is to assist in successfully completing three
        out of five missions.
      </li>
      <li>
        <strong>Knowledge:</strong> At the game's start, you have no information about which players are on your side
        and which are against you.
      </li>
      <li>
        <strong>Objective:</strong> Your ultimate goal is to ensure the victory of "Good" by helping to choose
        trustworthy participants for missions and preventing the "Evil" from successfully completing missions.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Active Observation:</strong> Pay close attention to the actions and behavior of other players. How
        someone votes or comments on team proposals can give vital clues.
      </li>
      <li>
        <strong>Communication:</strong> Communicate effectively with other players but do so cautiously to not disclose
        valuable information to "Evil". Engage in dialogues, ask questions, and express your doubts or confidence
        regarding certain players.
      </li>
      <li>
        <strong>Voting Strategy:</strong> Use your vote as a tool to express trust or distrust towards a team's
        composition. Voting against a team proposal can stimulate further discussion and help reveal suspicious
        patterns.
      </li>
      <li>
        <strong>Balanced Activity:</strong> Find a balance between participating actively in discussions and observing.
        Being too active can make you a target for "Evil", whereas being too passive can allow "Evil" to dictate the
        game's flow.
      </li>
      <li>
        <strong>Form Alliances:</strong> Gradually form alliances with players you are confident are allies. Mutual
        support and information exchange are key to identifying and opposing evil characters.
      </li>
      <li>
        <strong>Use Exclusions:</strong> Try to build your reasoning on excluding unreliable players from missions,
        progressively narrowing down the circle of suspects.
      </li>
    </ul>

    <p>
      Playing as a <PreviewLink target="servant" />, remember the importance of teamwork and collective strategy. Your
      job is not just to help picking the right teams for missions but also to protect the reputation of "Good" players,
      easing the path towards victory.
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
