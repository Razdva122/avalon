<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.merlin') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('merlin')" alt="merlin" />

    <h2>General Information:</h2>
    <p>
      Assuming the role of <PreviewLink target="merlin" /> necessitates a masterful balancing act: one must possess
      intimate knowledge of all minions of evil (save for <PreviewLink target="mordred" />, in classic gameplay) yet be
      unable to divulge this information outright. The true challenge lies in covertly shepherding the forces of good
      toward triumph, all while avoiding detection and a potential assassination by the forces of evil's assassin at the
      game's conclusion. More intricate still is the necessity to counteract the deceits of
      <PreviewLink target="morgana" /> and to garner the trust of <PreviewLink target="percival" />.
      <PreviewLink target="morgana" /> vies to mimic your persona, leading the righteous astray, whereas
      <PreviewLink target="percival" /> endeavours to pierce through the pretense and uncover the verity.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Be cautious with your knowledge:</strong> While <PreviewLink target="merlin" /> knows who the evil
        players are, revealing this directly can risk being assassinated. Your goal is to aid the Arthurian side subtly.
      </li>
      <li>
        <strong>Use hints wisely:</strong> Mastering the art of dropping subtle hints to your team without being too
        obvious is crucial for <PreviewLink target="merlin" />.
      </li>
      <li>
        <strong>Be careful with accusations:</strong> Accusing minions of evil too accurately or quickly can reveal your
        role. Balance is key.
      </li>
      <li>
        <strong>Maintain balance in your gameplay:</strong> It’s important to not appear too knowledgeable. Sometimes,
        making deliberate mistakes or staying silent can throw evil players off.
      </li>
      <li>
        <strong>Pay attention to the assassin:</strong> Remember, an assassin will try to identify Merlin at the end of
        the game if good prevails. Being too obvious with your hints could lead to your downfall.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Strategize your silence:</strong> Sometimes, the best way to conceal your role is by withholding
        comments, especially in the early stages of the game.
      </li>
      <li>
        <strong>Reveal evil players gradually:</strong> Guide your allies to the truth gradually, avoiding harsh
        accusations.
      </li>
      <li>
        <strong>Utilize ambiguity:</strong> Make comments that could be interpreted in multiple ways, keeping the evil
        players guessing.
      </li>
      <li>
        <strong>Build trust:</strong> Apart from revealing evil, convincing other players of your allegiance to good is
        vital. Establishing trust can influence team decisions.
      </li>
      <li>
        <strong>Support your allies:</strong> Sometimes it's more effective to back up correct suggestions from others
        than to constantly push your own ideas.
      </li>
    </ul>

    <p>
      Playing as <PreviewLink target="merlin" /> is challenging yet highly rewarding. With careful strategy and tactful
      communication, you can lead the forces of good to victory while staying hidden from the dark clutches of the
      assassin. Good luck!
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
