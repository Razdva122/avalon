<template>
  <div class="info-page-content rules">
    <WikiBreadCrumbs />
    <h1 class="title">The Resistance: Avalon - Official rules</h1>

    <h2>Game Objective</h2>

    <p>
      The Resistance: Avalon is a strategic board game where players are tasked with completing a series of missions
      while dealing with hidden traitors known as Minions of Mordred. The game is set in the legendary world of King
      Arthur and the Knights of the Round Table.
    </p>

    <h3>
      Objective for the
      <div class="good-loyalty-icon"></div>
      Loyal Servants of Arthur
    </h3>
    <p>
      The Loyal <RoleLink role="servant" /> of Arthur must successfully complete three out of five missions. They must
      work together to propose teams for each mission and vote on team compositions, always trying to keep traitors off
      the teams to prevent missions from failing.
    </p>

    <h3>
      Objective for the
      <div class="evil-loyalty-icon"></div>
      Minions of Mordred
    </h3>
    <p>
      The <RoleLink role="minion" />'s of Mordred aim to sow discord and mistrust among the Loyal
      <RoleLink role="servant" />. Their goal is to cause three missions to fail by infiltrating teams and sabotaging
      missions. They must communicate covertly and strategize to mislead the loyalists and cast doubt on the true
      allegiances of other players.
    </p>

    <h3>Additional Objectives</h3>
    <p>
      The game intensifies with special roles, such as <RoleLink role="merlin" />, who knows the identities of the
      Minions but must keep his identity secret to avoid assassination at the end of the game. The Minions of Mordred
      can win by correctly identifying and assassinating <RoleLink role="merlin" /> after three missions have succeeded.
    </p>
    <v-divider :thickness="5"></v-divider>

    <h2>Gameplay Rules</h2>

    <h3>1. Team Proposal and Voting</h3>
    <ul>
      <li>
        The player with the Leader token proposes a team of players for the mission. The number of players required for
        the team depends on the current mission and the total number of players in the game.
      </li>
      <li>
        All players, including the Leader, then vote on the proposed team. A simple majority is required for the
        proposal to be accepted. If the proposal is rejected, the Leader token passes to the next player and a new
        proposal begins. If five proposals are rejected in a row, the fifth Leader has the power to choose the quest
        team without a vote.
      </li>
    </ul>

    <h3>2. Mission Phase</h3>
    <ul>
      <li>
        Once a team has been approved, members of the team secretly choose a Success or Fail card to determine the
        outcome of the mission.
      </li>
      <li>
        All players submit their chosen cards to the Leader, who shuffles them to conceal which player submitted which
        card.
      </li>
      <li>
        The cards are then revealed. For a mission to succeed, all the cards must be Success cards. If one or more Fail
        cards are revealed, the mission fails. Certain missions may require two Fail cards to fail, depending on the
        number of players in the game.
      </li>
    </ul>

    <h3>3. Progression of Play</h3>
    <ul>
      <li>
        After the outcome of the mission has been determined, the Leader token moves to the next player in clockwise
        order.
      </li>
      <li>A new round begins with a new team proposal, and the same process repeats for a total of five missions.</li>
      <li>
        Players must use their powers of persuasion, deduction, and bluffing to influence team selection, the vote, and
        discussion to further their side's agenda.
      </li>
    </ul>
    <v-divider :thickness="5"></v-divider>

    <h2>Conclusion of Gameplay</h2>
    <p>
      The gameplay continues through five missions, with the game ending once either the Loyal Servants of Arthur
      successfully complete three missions or the Minions of Mordred cause three missions to fail. In the case that the
      Loyal Servants of Arthur succeed, the Minions of Mordred have one final opportunity to win by correctly
      identifying <RoleLink role="merlin" />, if they do so the Minions win.
    </p>

    <p>
      Through strategic discussion, careful observation, and clever tactics, each side must do their best to achieve
      their objectives without revealing their true allegiances, making each round of The Resistance: Avalon play out
      uniquely and full of suspense.
    </p>
    <v-divider :thickness="5"></v-divider>

    <h2>Mission Team Size</h2>

    <div class="table">
      <table>
        <thead>
          <tr>
            <th>Number of Players</th>
            <th>Mission 1</th>
            <th>Mission 2</th>
            <th>Mission 3</th>
            <th>Mission 4</th>
            <th>Mission 5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>5 Players</td>
            <td>2</td>
            <td>3</td>
            <td>2</td>
            <td>3</td>
            <td>3</td>
          </tr>
          <tr>
            <td>6 Players</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>3</td>
            <td>4</td>
          </tr>
          <tr>
            <td>7 Players</td>
            <td>2</td>
            <td>3</td>
            <td>3</td>
            <td>4*</td>
            <td>4</td>
          </tr>
          <tr>
            <td>8 Players</td>
            <td>3</td>
            <td>4</td>
            <td>4</td>
            <td>5*</td>
            <td>5</td>
          </tr>
          <tr>
            <td>9 Players</td>
            <td>3</td>
            <td>4</td>
            <td>4</td>
            <td>5*</td>
            <td>5</td>
          </tr>
          <tr>
            <td>10 Players</td>
            <td>3</td>
            <td>4</td>
            <td>4</td>
            <td>5*</td>
            <td>5</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>*<b>Note</b>: On missions marked with an asterisk (*), two Fail cards are required for the mission to fail.</p>
    <v-divider :thickness="5"></v-divider>

    <h2>Recommended Roles Setup</h2>
    <div class="game-setup">
      <h3>5 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <RoleLink role="merlin" />, <RoleLink role="percival" />,
      <RoleLink role="servant" /><br />
      <strong>Minions of Mordred:</strong> <RoleLink role="mordred" />, <RoleLink role="morgana" />
    </div>

    <div class="game-setup">
      <h3>6 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <RoleLink role="merlin" />, <RoleLink role="percival" />,
      <RoleLink role="servant" />, <RoleLink role="servant" /><br />
      <strong>Minions of Mordred:</strong> <RoleLink role="mordred" />, <RoleLink role="morgana" />
    </div>

    <div class="game-setup">
      <h3>7 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <RoleLink role="merlin" />, <RoleLink role="percival" />,
      <RoleLink role="servant" />, <RoleLink role="servant" /><br />
      <strong>Minions of Mordred:</strong> <RoleLink role="mordred" />, <RoleLink role="morgana" />,
      <RoleLink role="minion" /><br />
      <em>Addons:</em> Lady of the lake
    </div>

    <div class="game-setup">
      <h3>8 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <RoleLink role="merlin" />, <RoleLink role="percival" />,
      <RoleLink role="servant" />, <RoleLink role="servant" />, <RoleLink role="servant" /><br />
      <strong>Minions of Mordred:</strong> <RoleLink role="mordred" />, <RoleLink role="morgana" />,
      <RoleLink role="minion" /><br />
      <em>Addons:</em> Lady of the lake
    </div>

    <div class="game-setup">
      <h3>9 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <RoleLink role="merlin" />, <RoleLink role="percival" />,
      <RoleLink role="tristan" />, <RoleLink role="isolde" />, <RoleLink role="servant" />,
      <RoleLink role="servant" /><br />
      <strong>Minions of Mordred:</strong> <RoleLink role="mordred" />, <RoleLink role="morgana" />,
      <RoleLink role="minion" /><br />
    </div>

    <div class="game-setup">
      <h3>10 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <RoleLink role="merlin" />, <RoleLink role="percival" />,
      <RoleLink role="tristan" />, <RoleLink role="isolde" />, <RoleLink role="servant" />,
      <RoleLink role="servant" /><br />
      <strong>Minions of Mordred:</strong> <RoleLink role="mordred" />, <RoleLink role="morgana" />,
      <RoleLink role="minion" />, <RoleLink role="oberon" /><br />
      <em>Addons:</em> Lady of the lake
    </div>

    <p>
      <b>Note</b>: In the original version, there is a distinct role of the <b>Assassin</b>. We suggest delegating this
      function to any of the evil roles, or alternatively, making the decision collectively among the evil players.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import RoleLink from '@/components/game/information/RoleLink.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    RoleLink,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.information {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rules {
  .evil-loyalty-icon,
  .good-loyalty-icon {
    margin: 0 4px;
    width: 30px;
    height: 30px;
  }
}

h2 {
  margin-top: 20px;
}

table {
  width: 50%;
  border-collapse: collapse;
  text-align: center;
}

th,
td {
  border: 1px solid black;
  padding: 5px;
}

th {
  background-color: #2c3e50;
}

@media (max-width: 600px) {
  th,
  td {
    padding: 3px;
    font-size: 13px;
  }

  .table {
    overflow-x: auto;
  }
}
</style>
