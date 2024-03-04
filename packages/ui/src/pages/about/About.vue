<template>
  <div class="about pr-5 pl-5">
    <div class="title">About</div>
    <div>
      Welcome to <b>avalon-game.com</b>, your premier destination for playing <b>"The Resistance: Avalon"</b> online
      with friends and fellow enthusiasts. Our platform offers a seamless and immersive gaming experience, entirely free
      of charge and without the distraction of advertisements.
    </div>

    <div>
      <b>"The Resistance: Avalon"</b> is a captivating board game of strategy and deception, set in the legendary era of
      King Arthur and his Knights of the Round Table. Designed for 5 to 10 players, it invites you into a divided world
      where you're either a loyal servant of Arthur striving to protect the kingdom or a devious minion of Mordred
      plotting its downfall. The game is celebrated for its incorporation of secret identities, strategic deception, and
      the deductive challenge of discerning allies from foes.
    </div>

    <img class="preview" alt="preview" src="@/assets/images/preview.webp" />

    <div>
      Our site replicates the full spectrum of roles found in the traditional board game, including <b>Merlin</b>,
      <b>Percival</b>, <b>Oberon</b>, <b>Mordred</b>, and <b>Morgana</b>, ensuring an authentic Avalon experience. We've
      also integrated the beloved game expansions, <b>"Lady of the Lake"</b> and <b>"Excalibur"</b> to enrich your
      gameplay.
    </div>

    <div>
      Exclusive to our platform are additional roles not found in the original game - <b>Merlin the Pure</b> and
      <b>Tristan + Isolde (the Lovers)</b> - providing new dynamics and strategies for you and your team to explore.
    </div>

    <div>
      To enhance your strategic play, we offer a History feature, allowing players to review past moves and better
      strategize against the opposition. Additionally, our Spoiler Mode ensures that you can play in the same physical
      space as other players without revealing your role or compromising the game's outcome.
    </div>

    <div class="socials">
      The project code can be viewed on <a href="https://github.com/Razdva122/avalon" target="_blank">github</a>.
    </div>
    <div class="socials">
      You can contact me via <a href="https://discord.gg/DR9cEDDNdN" target="_blank">discord</a>.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  async setup() {},
});
</script>

<style scoped lang="scss">
.about {
  margin-top: 40px;
}

.about > div {
  margin-bottom: 10px;
}

.socials {
  font-size: 22px;
}

.title {
  font-size: 36px;
}

.preview {
  width: 100%;
  max-width: 600px;
}
</style>
