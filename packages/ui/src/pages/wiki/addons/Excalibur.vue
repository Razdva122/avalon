<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('addons.excalibur') }}</h1>
    <img class="preview-image" src="@/assets/features/excalibur.webp" alt="excalibur" />
    <p>
      <strong><PreviewLink target="excalibur" /></strong> introduces an additional layer of strategy and interaction
      among players. It complements the base rules of the game and offers new possibilities throughout the gameplay.
    </p>

    <h2>Rules for using "{{ $t('addons.excalibur') }}" (Sergeant in 'The Resistance'):</h2>
    <ol>
      <li>
        <strong>Assigning "{{ $t('addons.excalibur') }}"</strong>: Before the mission starts, the mission leader selects
        a participant from those assigned to the mission to receive <PreviewLink target="excalibur" />. The leader must
        pass <PreviewLink target="excalibur" /> to someone else on the mission besides themselves.
      </li>
      <li>
        <strong>Voting for the Mission</strong>: All players at the table are aware of to whom
        <PreviewLink target="excalibur" /> has been given, and they proceed to vote for or against the mission.
      </li>
      <li>
        <strong>Using Excalibur</strong>: After all mission participants have made their choice (success or failure), it
        is the turn of the <PreviewLink target="excalibur" /> holder, who has the opportunity to change the submitted
        vote of any one participant.
      </li>
      <li>
        <strong>Excalibur Transparency</strong>: Everyone at the table can see whether
        <PreviewLink target="excalibur" /> was used. If <PreviewLink target="excalibur" /> was deployed, all players
        know on whom it was used, but only the <PreviewLink target="excalibur" /> holder and the targeted individual
        know what the original vote was. The rest of the players can only speculate based on the mission outcome.
      </li>
      <li>
        <strong>Strategic Value</strong>: Possessing <PreviewLink target="excalibur" /> adds strategic depth to the game
        by allowing one player to potentially alter the course of the game by influencing the actions of both good and
        evil characters. <PreviewLink target="excalibur" /> can be a pivotal factor in the outcomes of mission votes,
        especially during critical moments in the game.
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';

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
