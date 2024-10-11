<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.brute') }} Role
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('brute')" alt="brute" />

    <h2>General Information:</h2>
    <p>
      Role of <PreviewLink target="brute" /> introduces a unique dynamic amongst the Minions of Evil. During the first
      three missions, Brute has the flexibility to choose either "Success" or "Fail" in their mission votes, whereas in
      missions four and five, Brute is restricted to only voting "Success".
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Utilize early mission flexibility:</strong> Since Brute can vote both ways in initial missions, use this
        to confuse the loyal servants about your allegiance.
      </li>
      <li>
        <strong>Maintain unpredictability:</strong> Moving inconsistently during the early missions can help mask your
        identity, making it difficult for others to deduce you as a Brute.
      </li>
      <li>
        <strong>Aim for strategic success later:</strong> In later missions, where only "Success" votes are allowed for
        Brute, focus on gaining trust and influencing the game direction favorably for the Minions of Evil.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Capitalize on early mission ambiguities:</strong> Leverage your voting flexibility in the first three
        missions to create confusion about your true role and disrupt the strategies of the forces of Good.
      </li>
      <li>
        <strong>Build trust for the endgame:</strong> As you transition to only being able to vote "Success", work to
        have established enough confusion or trust to shift suspicion away from yourself in crucial final missions.
      </li>
    </ul>

    <p>
      Embrace the unique capabilities of the <PreviewLink target="brute" /> role. Your approach to the early and late
      stages of the game can significantly affect the outcomes, helping the forces of Evil to weave a web of deception
      and strategy.
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
