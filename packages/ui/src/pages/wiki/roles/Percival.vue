<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Percival role</h1>
    <img class="preview-image" src="@/assets/roles/percival.png" alt="percival" />
    <p>
      Percival's role is to protect and correctly identify Merlin to prevent Merlin’s assassination by the Minions of
      Mordred. Percival sees Merlin and Morgana at the beginning of the game but must discern which is which without
      revealing their identities to others.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Understand Your Role:</strong> Knowing that you are one of Merlin's primary protectors, your main goal
        is to obscure Merlin’s identity and ensure that your team can benefit from Merlin’s insights without putting
        Merlin in direct danger.
      </li>
      <li>
        <strong>Pay Attention to Behavior:</strong> Observe the behaviors and suggestions of the two players identified
        as Merlin and Morgana. Try to deduce who the real Merlin is based on how they guide the team.
      </li>
      <li>
        <strong>Be Subtle:</strong> When defending or following the advice of who you believe is Merlin, be subtle.
        Direct defense of Merlin can lead to Morgana and the minions of Mordred identifying and later assassinating
        Merlin.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Create Ambiguity:</strong> Sometimes, acting unsure or casting doubt can help protect Merlin's identity.
        If evil players are unsure who Merlin is, it’s harder for them to win the game by assassinating Merlin.
      </li>
      <li>
        <strong>Communicate Through Votes:</strong> Voting patterns can be a subtle way to communicate. Percival can
        show agreement or disagreement with Merlin’s suspected choices through voting, without openly discussing it.
      </li>
      <li>
        <strong>Guide Quietly:</strong> Percival often knows who the good players are. Guide them towards the right
        decisions subtly without exposing Merlin or yourself.
      </li>
      <li>
        <strong>Protect Merlin to the End:</strong> In the end game, be ready to take suspicion upon yourself to protect
        Merlin's identity, especially if you have established yourself as a trusted good player.
      </li>
    </ul>

    <p>
      Playing as Percival in Avalon offers a unique challenge and requires a combination of subtlety, discernment, and
      strategic misdirection. Your role is crucial in protecting Merlin and ensuring the success of the forces of good.
      Be vigilant, be strategic, and above all, protect Merlin at all costs.
    </p>
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
