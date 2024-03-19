<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Excalibur</h1>
    <img class="preview-image" src="@/assets/features/excalibur.webp" alt="excalibur" />
    <p>
      <strong>"Excalibur"</strong> introduces an additional layer of strategy and interaction among players. It
      complements the base rules of the game and offers new possibilities throughout the gameplay.
    </p>

    <h2>Rules for using "Excalibur" (Sergeant in 'The Resistance'):</h2>
    <ol>
      <li>
        <strong>Assigning "Excalibur"</strong>: Before the mission starts, the mission leader selects a participant from
        those assigned to the mission to receive Excalibur. The leader must pass Excalibur to someone else on the
        mission besides themselves.
      </li>
      <li>
        <strong>Voting for the Mission</strong>: All players at the table are aware of to whom Excalibur has been given,
        and they proceed to vote for or against the mission.
      </li>
      <li>
        <strong>Using Excalibur</strong>: After all mission participants have made their choice (success or failure), it
        is the turn of the Excalibur holder, who has the opportunity to change the submitted vote of any one
        participant.
      </li>
      <li>
        <strong>Excalibur Transparency</strong>: Everyone at the table can see whether Excalibur was used. If Excalibur
        was deployed, all players know on whom it was used, but only the Excalibur holder and the targeted individual
        know what the original vote was. The rest of the players can only speculate based on the mission outcome.
      </li>
      <li>
        <strong>Strategic Value</strong>: Possessing "Excalibur" adds strategic depth to the game by allowing one player
        to potentially alter the course of the game by influencing the actions of both good and evil characters.
        "Excalibur" can be a pivotal factor in the outcomes of mission votes, especially during critical moments in the
        game.
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
