<template>
  <div class="info-page-content">
    <h1 class="title">About</h1>
    <div>
      Welcome to <b>avalon-game.com</b>, your premier destination for playing <b>"Avalon: The Resistance"</b> online
      with friends and fellow enthusiasts. Our platform offers a seamless and immersive gaming experience, entirely free
      of charge and without the distraction of advertisements.
    </div>

    <div>
      <b>"Avalon: The Resistance"</b> is a captivating board game of strategy and deception, set in the legendary era of
      King Arthur and his Knights of the Round Table. Designed for 5 to 10 players, it invites you into a divided world
      where you're either a loyal servant of Arthur striving to protect the kingdom or a devious minion of Mordred
      plotting its downfall. The game is celebrated for its incorporation of secret identities, strategic deception, and
      the deductive challenge of discerning allies from foes.
    </div>

    <div class="image">
      <img class="preview" alt="preview" src="@/assets/images/preview.webp" />
    </div>

    <div>
      Our site replicates the full spectrum of roles found in the traditional board game, including
      <b><PreviewLink target="merlin" /></b>, <b><PreviewLink target="percival" /></b>,
      <b><PreviewLink target="troublemaker" /></b>, <b><PreviewLink target="oberon" /></b>,
      <b><PreviewLink target="lunatic" /></b>, <b><PreviewLink target="brute" /></b>,
      <b><PreviewLink target="mordred" /></b>, <b><PreviewLink target="morgana" /></b>,
      <b><PreviewLink target="trickster" /></b>, <b><PreviewLink target="goodLancelot" /></b> and
      <b><PreviewLink target="evilLancelot" /></b> ensuring an authentic Avalon experience. We've also integrated the
      beloved game expansions, <b><PreviewLink target="ladyOfLake" /></b> and
      <b><PreviewLink target="excalibur" /></b> to enrich your gameplay.
    </div>

    <div>
      Exclusive to our platform are additional roles not found in the original game -
      <b><PreviewLink target="merlinPure" /></b>, <b><PreviewLink target="guinevere" /></b>,
      <b><PreviewLink target="witch" /></b> and
      <b><PreviewLink target="tristan" /> + <PreviewLink target="isolde" /> (the Lovers)</b> - providing new dynamics
      and strategies for you and your team to explore.
    </div>

    <div>
      To enhance your strategic play, we offer a History feature, allowing players to review past moves and better
      strategize against the opposition. Additionally, our Spoiler Mode ensures that you can play in the same physical
      space as other players without revealing your role or compromising the game's outcome.
    </div>

    <div class="socials">
      The project code can be viewed on <b><a href="https://github.com/Razdva122/avalon" target="_blank">github</a></b
      >.
    </div>
    <div class="socials">
      You can contact me via <b><a href="https://discord.gg/DR9cEDDNdN" target="_blank">discord</a></b
      >.
    </div>

    <div>
      <strong>Disclaimer</strong>
    </div>
    <div class="disclaimer">
      This is a fan-based, non-commercial project created for the love of the game. All content, including the rules we
      follow, is inspired by the original tabletop game, but all graphics and illustrations are uniquely ours. This site
      is not affiliated with or endorsed by the official publishers. We respect the original creators and recognize that
      all related trademarks and copyrights belong to their respective owners.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import PreviewLink from '@/components/view/information/PreviewLink.vue';

export default defineComponent({
  components: {
    PreviewLink,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.socials {
  font-size: 24px;
}

.preview {
  width: 100%;
  max-width: 600px;
}

.image {
  text-align: center;
}

.disclaimer {
  font-size: 12px;
}
</style>
