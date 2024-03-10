<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Merlin Role</h1>
    <img class="preview-image" src="@/assets/roles/merlin.png" alt="merlin" />

    <p>
      Playing as Merlin involves knowing all the minions of evil (except Mordred in classical rules) but not being able
      to directly reveal this information. The challenge lies in guiding the forces of good to victory without being
      identified and assassinated by the evil’s assassin at the game's end.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Be cautious with your knowledge:</strong> While Merlin knows who the evil players are, revealing this
        directly can risk being assassinated. Your goal is to aid the Arthurian side subtly.
      </li>
      <li>
        <strong>Use hints wisely:</strong> Mastering the art of dropping subtle hints to your team without being too
        obvious is crucial for Merlin.
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
      Playing as Merlin is challenging yet highly rewarding. With careful strategy and tactful communication, you can
      lead the forces of good to victory while staying hidden from the dark clutches of the assassin. Good luck!
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
