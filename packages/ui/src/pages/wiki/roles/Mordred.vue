<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Mordred Role</h1>
    <img class="preview-image" src="@/assets/roles/mordred.png" alt="mordred" />

    <p>
      Playing as Mordred gives you the unique advantage of being unknown to Merlin and leading the minions of evil. Your
      objective is to disrupt the forces of good and ensure that evil prevails, all while maintaining your disguise as a
      loyal ally.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Maintain your hidden identity:</strong> As Mordred, not being known to Merlin is a huge advantage. Keep
        it that way by blending in with the good players.
      </li>
      <li>
        <strong>Sow distrust subtly:</strong> Use your influence to cast doubt on others without drawing too much
        attention to yourself.
      </li>
      <li>
        <strong>Coordinate with your minions:</strong> Work together with the other evil players to strategize and
        disrupt the good players' plans.
      </li>
      <li>
        <strong>Lead from the shadows:</strong> As a leader of the evil, lead the minions subtly and never reveal your
        true role.
      </li>
      <li>
        <strong>Protect your identity:</strong> Avoid giving Merlin any clues about your role or the roles of your
        fellow evil minions.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Confuse good players:</strong> Make decisions that can throw off good players and make it harder for
        Merlin to guide them.
      </li>
      <li>
        <strong>Use disinformation:</strong> Mislead good players with incorrect information to lead them away from the
        truth.
      </li>
      <li>
        <strong>Cultivate alliances:</strong> Falsely align with good players to gain their trust and manipulate the
        game in favor of evil.
      </li>
      <li>
        <strong>Control the narrative:</strong> You have the power to steer discussions and decisions. Use it wisely to
        benefit the evil cause.
      </li>
      <li>
        <strong>Identify Merlin:</strong> Try to deduce who Merlin is without revealing yourself so your assassin can
        eliminate them at the game's end.
      </li>
    </ul>

    <p>
      As Mordred, you command the shadows and influence the game from behind the scenes. Employing cunning and
      deception, you can lead evil to victory and keep the forces of good forever in the dark. Embrace your role and
      reign supreme!
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