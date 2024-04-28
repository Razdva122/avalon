<template>
  <div class="info-page-content lancelots">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      <div class="evil-loyalty-icon"></div>
      Lancelots
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('evilLancelot')" alt="evil lancelot" />
    <img class="preview-image" :src="calculateRoleUrl('goodLancelot')" alt="good lancelot" />

    <h2>General Information:</h2>
    <p>
      Lancelots presents a dynamic challenge in the realm of Avalon. As two players starting on opposite sides, the
      <PreviewLink target="goodLancelot" text="Good Lancelot" /> aligns with the forces of good, while the
      <PreviewLink target="evilLancelot" text="Evil Lancelot" /> conspires with the minions of Mordred. However, the
      tides of loyalty may turn as the game progresses. <PreviewLink target="merlin" />, can see the
      <PreviewLink target="evilLancelot" text="Evil Lancelot" /> among the ranks of Mordred's followers, as well the
      minions of Mordred recognize the presence of an <PreviewLink target="evilLancelot" text="Evil Lancelot" />. On the
      other hand, the <PreviewLink target="evilLancelot" text="Evil Lancelot" /> does not know his allies. If
      <PreviewLink target="guinevere" /> is present in the game, she knows both Lancelots but does not know their
      loyatly.
    </p>
    <p>
      Key to the Lancelots' gameplay is the deck of loyalty change, after the second mission, a card is drawn. If a
      <span class="material-icons icon-swap">swap_horiz</span><b>loyalty change</b> card is revealed, the Lancelots
      switch allegiances along with all corresponding changes (such as the ability to fail a mission, or being subject
      to the <PreviewLink target="ladyOfLake" text="Lady of the lake" /> card), whereas if the card drawn is
      <span class="material-icons icon-swap">close</span><b>blank</b>, no change occurs. The deck contains
      <b>five cards</b>, of which two prompt <span class="material-icons icon-swap">swap_horiz</span
      ><b>loyalty change</b>, and three are <span class="material-icons icon-swap">close</span><b>blank</b>.
    </p>
    <p>
      Importantly, a shift in loyalty does not alter how other players perceive you, <PreviewLink target="merlin" /> and
      the minions of Mordred will continue to see the originally
      <PreviewLink target="evilLancelot" text="Evil Lancelot" /> as their initial role.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Embrace unpredictability:</strong> As a Lancelot, the unpredictability is your element. Use the
        potential of switching sides in your favor.
      </li>
      <li>
        <strong>Duality of roles:</strong> Remember your initial role but adapt swiftly if the card of loyalty change is
        drawn. Your new role needs to be played convincingly to avoid suspicion.
      </li>
      <li>
        <strong>Observe and adapt:</strong> Both Lancelots must closely monitor the game's narrative to effectively
        realign their strategies following any change in loyalty.
      </li>
      <li>
        <strong>Subtle plays:</strong> Whether undermining a quest subtly as evil or bolstering one as good, the art of
        disguise is crucial. Go unnoticed in your actions to preserve your new allegiance.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Merlin's perception:</strong> If you are the
        <PreviewLink target="evilLancelot" text="Evil Lancelot" /> and become good, remember that
        <PreviewLink target="merlin" /> still perceives you as part of evil. Use this to your advantage.
      </li>
      <li>
        <strong>Balance the scales:</strong> Play an active role in votes and quest propositions to exert influence
        subtly, tipping the scales in favor of your current side.
      </li>
      <li>
        <strong>Maintain your cover:</strong> If you switch to the evil side, be mindful not to abruptly change your
        behavior. Gradual shifts are less conspicuous.
      </li>
    </ul>

    <p>
      Serving as a Lancelot, you hold a powerful dual identity that can dramatically shift the course of the game in
      Avalon. With the potential for changing loyalties, your role invites a strategic depth unlike any other. Tread
      cautiously, for the balance of good and evil rests upon your armored shoulders.
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

.lancelots {
  .preview-image {
    width: 25%;
    max-width: 350px;
  }
}

.icon-swap {
  vertical-align: text-bottom;
}
</style>
