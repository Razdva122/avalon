<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.minion') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('minion')" alt="Minion of Mordred" />

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Role:</strong> You are part of the "Evil" team, with the main objective to thwart the "Good" team's
        missions or ensure your presence on successful ones.
      </li>
      <li>
        <strong>Knowledge:</strong> At the beginning of the game, you know who your fellow "Evil" allies are, except for
        roles hidden from you by game rules.
      </li>
      <li>
        <strong>Objective:</strong> Your ultimate goal is to cause three out of five missions to fail or to sow enough
        distrust among the "Good" team to lead your evil team to victory.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Discreet Collaboration:</strong> Work closely with your "Evil" teammates in secret. Plan how to approach
        each mission and who will take the risk of causing a mission to fail.
      </li>
      <li>
        <strong>Deception:</strong> Perfect the art of deception. Blending in as one of the "Good" can help you
        influence their decisions and protect your identity.
      </li>
      <li>
        <strong>Public Demeanor:</strong> Be mindful of your public actions and words. Try to avoid suspicion by not
        being too defensive or too aggressive.
      </li>
      <li>
        <strong>Undermine Trust:</strong> Subtly question the actions and decisions of the "Good" players to create an
        atmosphere of distrust and confusion.
      </li>
      <li>
        <strong>Suspect Management:</strong> If suspicion falls on you, cleverly redirect it without bringing too much
        attention to yourself. Use logical arguments to defend yourself but avoid being too convincing as to not raise
        further suspicion.
      </li>
      <li>
        <strong>Strategic Sacrifice:</strong> It may be beneficial to sacrifice an "Evil" team member to gain the trust
        of the "Good" team, particularly if it can lead to an "Evil" majority on critical missions.
      </li>
    </ul>

    <p>
      As a <PreviewLink target="minion" />, your success depends on your ability to deceive and manipulate the "Good"
      team while coordinating with your "Evil" allies. Your cunning and discretion are key instruments in overthrowing
      the forces of good and ensuring victory for <PreviewLink target="mordred" />.
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
