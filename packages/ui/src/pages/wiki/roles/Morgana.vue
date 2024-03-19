<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      Morgana Role
    </h1>
    <img class="preview-image" src="@/assets/roles/morgana.webp" alt="Morgana" />

    <p>
      Playing as <PreviewLink target="morgana" /> revolves around deception, specifically making yourself seem like
      <PreviewLink target="merlin" /> to confuse the forces of good. You should aim to bewilder
      <PreviewLink target="percival" /> not only through your actions but also by paying close attention to how
      <PreviewLink target="merlin" /> might be guiding the good forces. Blending in as Merlin could lead
      <PreviewLink target="percival" /> astray, giving the forces of evil an upper hand.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Master the art of deception:</strong> Use your actions and words to mimic the role of
        <PreviewLink target="merlin" />, leading the good players away from the truth.
      </li>
      <li>
        <strong>Create confusion among good players:</strong> Strategic disinformation can sow doubt and hinder their
        decision-making.
      </li>
      <li>
        <strong>Coordinate with evil players discreetly:</strong> Work together with your evil teammates, but do so
        cautiously to avoid raising suspicion.
      </li>
      <li>
        <strong>Stay composed:</strong> Even if suspicion falls on you, keeping a calm and collected demeanor can help
        dissuade others from believing they've correctly identified you.
      </li>
      <li>
        <strong>Adapt your strategy:</strong> Be reactive to the game's progression and ready to change tactics to keep
        the forces of good guessing.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Emphasize plausible deniability:</strong> Make statements that help your case without committing too
        strongly to any particular course that could expose you.
      </li>
      <li>
        <strong>Divert attention gracefully:</strong> If you feel the focus is turning towards you, deftly redirect the
        conversation or suspicion elsewhere.
      </li>
      <li>
        <strong>Imitate Merlin's concern:</strong> Show apparent concern for the success of the good team while
        discreetly guiding them towards failure.
      </li>
      <li>
        <strong>Question others:</strong> Ask strategic questions that make others reveal more about their roles and
        strategies, which you can then use to your advantage.
      </li>
      <li>
        <strong>Fake trustworthiness:</strong> Building a facade of trustworthiness can empower your misleading
        suggestions, making them more likely to be followed.
      </li>
    </ul>

    <p>
      Thriving as <PreviewLink target="morgana" /> requires a fine balance between assertiveness and subtlety. Your
      ability to manipulate the narrative and influence both evil and good players significantly affects your team's
      chance of victory. Embrace the challenge and enjoy manoeuvring through Avalon's shadowy waters.
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
