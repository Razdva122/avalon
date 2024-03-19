<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      Merlin Pure Role
    </h1>
    <img class="preview-image" src="@/assets/roles/merlin_pure.webp" alt="merlin pure" />

    <p>
      Playing as <PreviewLink target="merlinPure" /> grants you the extraordinary power of seeing not only the
      allegiance but also the exact roles of the evil characters. This advanced knowledge provides you a significant
      edge, but comes with the increased risk of being exposed and targeted by the Assassin.
    </p>

    <h2>General Tips:</h2>
    <ul>
      <li>
        <strong>Exercise maximum discretion:</strong> Your deep knowledge is both a gift and a curse. Be extremely
        cautious in sharing any information to avoid revealing your identity.
      </li>
      <li>
        <strong>Navigate with nuanced hints:</strong> You must become adept at hinting your teammates towards the truth
        without being explicit, as the stakes of being identified are even higher for you.
      </li>
      <li>
        <strong>Avoid immediate direct accusations:</strong> Given your comprehensive awareness, pointing out evil roles
        too precisely can quickly unmask you as <PreviewLink target="merlinPure" />.
      </li>
      <li>
        <strong>Balance your intel:</strong> It's crucial to alternate between providing guidance and remaining
        inconspicuous, as your full spectrum insight can easily betray you if not handled with care.
      </li>
      <li>
        <strong>Keep an eye on the Assassin:</strong> More than ever, the Assassin's sole ambition is to identify you;
        moving too confidently could spell your doom.
      </li>
    </ul>

    <h2>Strategic Tips:</h2>
    <ul>
      <li>
        <strong>Utilize strategic ambiguity:</strong> With your specific role knowledge, you can create complex
        scenarios to mislead evil players on multiple levels.
      </li>
      <li>
        <strong>Reveal roles gradually and indirectly:</strong> Guide your team towards understanding the roles of evil
        players through a carefully orchestrated series of hints.
      </li>
      <li>
        <strong>Hint at roles, don't declare them:</strong> Instead of stating roles, drop hints that nudge your
        teammates to make the deductions themselves.
      </li>
      <li>
        <strong>Address the roles without confirmation:</strong> Engage in discussions about roles in a way that
        provokes thought without affirming your knowledge.
      </li>
      <li>
        <strong>Support your team's discovery:</strong> Empower your teammates to come to conclusions that you've
        already made, reinforcing their confidence in their own deduction skills.
      </li>
    </ul>

    <p>
      Playing as <PreviewLink target="merlinPure" /> is a role laden with potency and peril. Your unmatched knowledge of
      the evils' identities allows you unparalleled ability to steer the course of the game. However, your ultimate
      success hinges on the mastery of subtlety and the art of the unspoken word. Guide the forces of good to triumph
      with a deft hand and a watchful eye.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/game/information/PreviewLink.vue';

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
