<template>
  <div class="wiki-index pr-5 pl-5">
    <h1 class="title">The Resistance: Avalon - Core Game Logic</h1>

    <h2>Game Setup</h2>
    <ul>
      <li><b>1. Player Assignment</b>: Assign each player a random character role, determining their allegiance.</li>
      <li><b>2. Reveal Phase</b>: Players learn information based on their character's abilities.</li>
    </ul>

    <h2>Mission Selection</h2>
    <ul>
      <li><b>3. Leader Selection</b>: Rotate the leader role among players.</li>
      <li><b>4. Team Proposal</b>: The current leader proposes a team for the mission.</li>
      <li><b>5. Vote on the Team</b>: All players vote on whether to approve the mission team.</li>
    </ul>

    <h2>Mission Phase</h2>
    <ul>
      <li><b>6. Mission Outcome</b>: Assigned team members secretly choose the mission's outcome.</li>
      <li><b>7. Reveal Mission Result</b>: Announce the mission's success or failure.</li>
    </ul>

    <h2>Special Roles' Interactions</h2>
    <ul>
      <li><b>8. Using Special Abilities</b>: Special characters may use their abilities at designed points.</li>
      <li>
        <b>9. Assassination Phase</b>: If the good side secures three missions, the Assassin gets a chance to identify
        Merlin to win for evil side.
      </li>
    </ul>

    <h2>Victory Conditions</h2>
    <ul>
      <li>
        <b>10. Determine Winner</b>: The game concludes when one side secures three missions or the Assassin correctly
        identifies Merlin post good side victories.
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  async setup() {},
});
</script>

<style scoped lang="scss">
.wiki-index {
  padding-bottom: 20px;
  font-size: 18px;
}

.about > ul {
  margin-bottom: 8px;
}

.title {
  text-align: center;
  margin-bottom: 16px;
}
</style>
