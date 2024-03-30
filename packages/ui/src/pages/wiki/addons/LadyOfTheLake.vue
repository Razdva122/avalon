<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>Lady of the Lake</h1>
    <img class="preview-image" src="@/assets/features/lady_of_lake.webp" alt="lady" />
    <p>
      <strong>"Lady of the Lake"</strong> is an expansion that introduces a new strategic element and provides the
      ability to gain additional information about the loyalties of other players. It is used in
      <strong>games with 7 or more</strong> participants and adds more depth to the gameplay.
    </p>

    <h2>Rules for using "Lady of the Lake" (Inquisitor Token in 'The Resistance'):</h2>
    <ol>
      <li>
        <strong>When to Use It:</strong> The <PreviewLink target="lady" text="Lady of the lake" /> comes into play after
        the second quest is completed. That means it becomes available starting from the third round of the game.
      </li>
      <li>
        <strong>Selecting the Holder:</strong> Initially, the <PreviewLink target="lady" text="Lady of the lake" /> gets
        the player to the right of the first leader. The player who receives the title of
        <PreviewLink target="lady" text="Lady of the lake" /> uses her power at the end of each round (after the
        second), passing it to another player who has not yet received the
        <PreviewLink target="lady" text="Lady of the lake" />.
      </li>
      <li>
        <strong>Applying the Ability:</strong> The owner of the
        <PreviewLink target="lady" text="Lady of the lake" /> chooses another player and secretly learns their role —
        whether that player is a Servant of Arthur (good) or a Minion of Mordred (evil).
      </li>
      <li>
        <strong>Passing the "Lady of the Lake":</strong> After using her ability, the
        <PreviewLink target="lady" text="Lady of the lake" />'s owner passes it to the player whose loyalty was just
        checked. This player will then use the <PreviewLink target="lady" text="Lady of the lake" /> in the next round.
      </li>
      <li>
        <strong>Restriction on Recurrent Checks:</strong> A player who has already been passed the
        <PreviewLink target="lady" text="Lady of the lake" />
        cannot be checked again. This rule helps ensure that each round, new information is revealed about a different
        player.
      </li>
      <li>
        <strong>Strategic Use:</strong> The use of the <PreviewLink target="lady" text="Lady of the lake" /> adds
        strategic possibilities to the game. Players can use the information gained to plan their actions, trying to
        identify traitors among the participants.
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
