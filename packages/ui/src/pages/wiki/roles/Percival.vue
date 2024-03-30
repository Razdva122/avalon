<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      Percival role
    </h1>
    <img class="preview-image" src="@/assets/roles/percival.webp" alt="percival" />
    <p>
      Percival's role is to protect and correctly identify <PreviewLink target="merlin" /> to prevent
      <PreviewLink target="merlin" />’s assassination by the Minions of Mordred. Percival sees
      <PreviewLink target="merlin" /> and <PreviewLink target="morgana" /> at the beginning of the game but must discern
      which is which without revealing their identities to others.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Understand Your Role:</strong> Knowing that you are one of <PreviewLink target="merlin" />'s primary
        protectors, your main goal is to obscure <PreviewLink target="merlin" />’s identity.
      </li>
      <li>
        <strong>Pay Attention to Behavior:</strong> Observe the behaviors and suggestions of the two players identified
        as <PreviewLink target="merlin" /> and <PreviewLink target="morgana" />. Try to deduce who the real
        <PreviewLink target="merlin" /> is based on how they guide the team.
      </li>
      <li>
        <strong>Be Subtle:</strong> When defending or following the advice of who you believe is
        <PreviewLink target="merlin" />, be subtle. Direct defense of <PreviewLink target="merlin" /> can lead to
        <PreviewLink target="morgana" /> and the minions of Mordred identifying and later assassinating
        <PreviewLink target="merlin" />.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Create Ambiguity:</strong> Sometimes, acting unsure or casting doubt can help protect
        <PreviewLink target="merlin" />'s identity. If evil players are unsure who <PreviewLink target="merlin" /> is,
        it’s harder for them to win the game by assassinating <PreviewLink target="merlin" />.
      </li>
      <li>
        <strong>Communicate Through Votes:</strong> Voting patterns can be a subtle way to communicate. Percival can
        show agreement or disagreement with <PreviewLink target="merlin" />’s suspected choices through voting, without
        openly discussing it.
      </li>
      <li>
        <strong>Guide Quietly:</strong> Percival often knows who the good players are. Guide them towards the right
        decisions subtly without exposing <PreviewLink target="merlin" /> or yourself.
      </li>
      <li>
        <strong>Protect Merlin to the End:</strong> In the end game, be ready to take suspicion upon yourself to protect
        <PreviewLink target="merlin" />'s identity, especially if you have established yourself as a trusted good
        player.
      </li>
    </ul>

    <p>
      Playing as Percival in Avalon offers a unique challenge and requires a combination of subtlety, discernment, and
      strategic misdirection. Your role is crucial in protecting <PreviewLink target="merlin" /> and ensuring the
      success of the forces of good. Be vigilant, be strategic, and above all, protect
      <PreviewLink target="merlin" /> at all costs.
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
