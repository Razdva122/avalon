<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      Trickster Role
    </h1>
    <img class="preview-image" src="@/assets/roles/trickster.webp" alt="trickster" />

    <h2>General Information:</h2>
    <p>
      As a <PreviewLink target="trickster" />, you lie when your loyalty is checked
      <PreviewLink target="lady" text="Lady of the lake" />, positioning yourself perfectly as a trusted member of the
      good side.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Cultivate a trustworthy persona:</strong> Successfully fooling other players requires building
        credibility. Act consistently and help complete quests to gain trust.
      </li>
      <li>
        <strong>Deceive selectively:</strong> Use your ability to lie about your loyalty sparingly and strategically to
        avoid detection.
      </li>
      <li>
        <strong>Create confusion:</strong> Sow seeds of doubt about other's roles subtly, drawing suspicion away from
        yourself and onto actual members of the good side.
      </li>
      <li>
        <strong>Monitor your influence:</strong> Keep track of how others perceive you and adjust your strategy to
        maintain your disguise.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Manipulate voting patterns:</strong> Your votes on proposals can send signals to observant players.
        Think carefully about when to support or oppose missions.
      </li>
      <li>
        <strong>Control information flow:</strong> As you gain trust, other players will likely share insights with you.
        Use this information to benefit your team without revealing your source.
      </li>
      <li>
        <strong>Prepare a credible defense:</strong> If suspicion falls on you, be ready with plausible explanations for
        your actions that fit with your constructed persona as a good player.
      </li>
    </ul>

    <p>
      Playing as the Trickster allows you to weave a web of deceit. Embrace the complexities of your role and you can
      shift the balance in favor of evil, manipulating key outcomes and leaving the forces of good puzzled and paranoid.
      Strike a balance between overt actions and subtle manipulations to master the art of deception.
    </p>
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
