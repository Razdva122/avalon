<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.troublemaker') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('troublemaker')" alt="troublemaker" />

    <p>
      As a <PreviewLink target="troublemaker" />, you play a crucial balancing act. You must present yourself as a
      straightforward good member, yet when your loyalty is tested and revealed falsely due to your unique role, you
      need to skillfully manage the situation. Your challenge is to maintain the trust of your team despite the
      deceitful evidence while blocking any evil members attempting to impersonate your role.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Reveal strategically:</strong> If your false alignment is exposed or likely to be questioned, calmly
        reveal your true role as the Troublemaker to maintain trust within your team.
      </li>
      <li>
        <strong>Counteract evil impersonations:</strong> Should an evil player claim to be the Troublemaker, quickly
        challenge their statement and clarify the situation to prevent confusion.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Monitor loyalty tests:</strong> Keep an eye on situations where loyalty checks are performed and be
        ready to intervene if results could be misleading due to someone impersonating you.
      </li>
      <li>
        <strong>Control the narrative:</strong> If revealed, steer the conversation towards understanding the strategic
        advantages of your role, explaining how having an undisclosed Troublemaker can benefit the good side.
      </li>
      <li>
        <strong>Form clear alliances:</strong> Build strong relationships with trustworthy and influential players.
        Having allies can help validate your claims if your role comes into question.
      </li>
      <li>
        <strong>Adapt to suspicion:</strong> If suspicion arises, address it directly with logical explanations and
        reaffirm your actions’ alignment with team goals to dispel doubts.
      </li>
    </ul>

    <p>
      Playing as the Troublemaker requires a fine blend of secrecy and forthrightness. You need to navigate through the
      game by keeping your vital role discreet until the critical moment, then revealing it to maintain trust and thwart
      evil strategies. Such strategic revelations can shift game dynamics profoundly, ensuring the good side continues
      to benefit from your hidden yet indispensable contribution.
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
