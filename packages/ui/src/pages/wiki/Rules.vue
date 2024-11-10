<template>
  <div class="info-page-content rules">
    <WikiBreadCrumbs />
    <h1 class="title">Avalon: The Resistance - Official rules</h1>

    <h2>Game Objective</h2>

    <p>
      Avalon: The Resistance is a strategic board game where players are tasked with completing a series of missions
      while dealing with hidden traitors known as Minions of Mordred. The game is set in the legendary world of King
      Arthur and the Knights of the Round Table.
    </p>

    <h3>
      Objective for the
      <span class="good-loyalty-icon"></span>
      Loyal Servants of Arthur
    </h3>
    <p>
      The Loyal <PreviewLink target="servant" /> must successfully complete three out of five missions. They must work
      together to propose teams for each mission and vote on team compositions, always trying to keep traitors off the
      teams to prevent missions from failing.
    </p>

    <h3>
      Objective for the
      <span class="evil-loyalty-icon"></span>
      Minions of Mordred
    </h3>
    <p>
      The <PreviewLink target="minion" /> aim to sow discord and mistrust among the <PreviewLink target="servant" />.
      Their goal is to cause three missions to fail <span class="evil-loyalty-icon"></span> by infiltrating teams and
      sabotaging missions. They must communicate covertly and strategize to mislead the loyalists and cast doubt on the
      true allegiances of other players.
    </p>

    <h3>Additional Objectives</h3>
    <p>
      The game intensifies with special roles, such as <PreviewLink target="merlin" />, who knows the identities of the
      Minions but must keep his identity secret to avoid assassination at the end of the game. The Minions of Mordred
      can win by correctly identifying and assassinating <PreviewLink target="merlin" /> after three missions have
      succeeded.
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
        Once a team has been approved, members of the team secretly choose a Success
        <span class="good-loyalty-icon"></span> or Fail <span class="evil-loyalty-icon"></span> card to determine the
        outcome of the mission.
      </li>
      <li>
        All players submit their chosen cards to the Leader, who shuffles them to conceal which player submitted which
        card.
      </li>
      <li>
        The cards are then revealed. For a mission to succeed, all the cards must be Success
        <span class="good-loyalty-icon"></span> cards. If one or more Fail <span class="evil-loyalty-icon"></span>
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
      identifying <PreviewLink target="merlin" />, if they do so the Minions win.
    </p>

    <p>
      Through strategic discussion, careful observation, and clever tactics, each side must do their best to achieve
      their objectives without revealing their true allegiances, making each round of Avalon: The Resistance play out
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

    <p>
      <b>Note</b>: On missions marked with an asterisk (*), two Fail <span class="evil-loyalty-icon"></span> cards are
      required for the mission to fail.
    </p>

    <v-divider :thickness="5"></v-divider>

    <h2>Recommended Roles Setup</h2>
    <h3>General tips</h3>
    <p>
      For an enriching gaming experience, we suggest a group size of <strong>7 to 10 players</strong> where the
      intricacies and excitement of the game truly shine.
    </p>

    <p>
      For newcomers, it's advisable to begin your Avalon journey with the <strong>basic roles</strong>. As you become
      more accustomed to the gameplay, you can incrementally introduce additional roles, enhancing complexity and
      engagement <strong>step by step</strong>.
    </p>

    <p>After the first games, we recommend adding roles in the following order:</p>

    <p>
      <PreviewLink target="merlin" /> -> <PreviewLink target="percival" /> -> <PreviewLink target="morgana" /> ->
      <PreviewLink target="oberon" /> -> <PreviewLink target="mordred" /> -> <PreviewLink target="ladyOfLake" /> ->
      <PreviewLink target="tristan" /> +
      <PreviewLink target="isolde" />
    </p>

    <div class="game-setup">
      <h3>5 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" /><br />
      <strong>Minions of Mordred:</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />
    </div>

    <div class="game-setup">
      <h3>6 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" />, <PreviewLink target="servant" /><br />
      <strong>Minions of Mordred:</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />
    </div>

    <div class="game-setup">
      <h3>7 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" />, <PreviewLink target="servant" /><br />
      <strong>Minions of Mordred:</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" /><br />
      <em>Expansions:</em> <PreviewLink target="ladyOfLake" />
    </div>

    <div class="game-setup">
      <h3>8 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" />, <PreviewLink target="servant" />, <PreviewLink target="servant" /><br />
      <strong>Minions of Mordred:</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" /><br />
      <em>Expansions:</em> <PreviewLink target="ladyOfLake" />
    </div>

    <div class="game-setup">
      <h3>9 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="tristan" />, <PreviewLink target="isolde" />, <PreviewLink target="servant" />,
      <PreviewLink target="servant" /><br />
      <strong>Minions of Mordred:</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" /><br />
    </div>

    <div class="game-setup">
      <h3>10 Players:</h3>
      <strong>Loyal Servants of Arthur:</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="tristan" />, <PreviewLink target="isolde" />, <PreviewLink target="servant" />,
      <PreviewLink target="servant" /><br />
      <strong>Minions of Mordred:</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" />, <PreviewLink target="oberon" /><br />
      <em>Expansions:</em> <PreviewLink target="ladyOfLake" />
    </div>

    <p>
      <b>Note</b>: In the original version, there is a distinct role of the <b>Assassin</b>. We suggest delegating this
      function to any of the evil roles, or alternatively, making the decision collectively among the evil players.
    </p>

    <h3>Excalibur:</h3>
    <p>
      We recommend adding <PreviewLink target="excalibur" /> to games for any number of players, but only in the company
      of experienced players.
    </p>

    <v-divider :thickness="5"></v-divider>

    <h2>Game setup in offline:</h2>
    <p>
      The default setup includes characters such as Merlin, Percival, and Morgana. However, you have the flexibility to
      customize the game by selecting the roles that best fit your group.
    </p>
    <Options :roles="roles" buttonText="Roles" />
    <ol class="mt-2">
      <li>Everyone close your eyes and extend your hand info a fist in front of you.</li>
      <li>
        <strong><PreviewLink target="minion" text="Minions of Mordred(*)" /></strong>
        <span v-if="roles.oberon || roles.evilLancelot">
          (not
          <strong
            ><PreviewLink v-if="roles.oberon" target="oberon" />
            <PreviewLink v-if="roles.evilLancelot" target="evilLancelot" /></strong
          >)</span
        >
        open your eyes and look around so that you know all agents of Evil.
      </li>
      <li v-if="roles.evilLancelot">
        <strong><PreviewLink v-if="roles.evilLancelot" target="evilLancelot" /></strong> - extend your thumb so
        <strong><PreviewLink target="minion" text="Minions of Mordred(*)" /></strong> will known of you.
      </li>
      <li>
        <strong><PreviewLink target="minion" text="Minions of Mordred(*)" /></strong> close your eyes.
      </li>
      <template v-if="roles.guinevere">
        <li>
          <strong><PreviewLink target="goodLancelot" /></strong> extend your thumb into the air.
        </li>
        <li>
          <strong><PreviewLink target="guinevere" /></strong>, open your eyes and look around so that you know both
          lancelots.
        </li>
      </template>
      <li v-if="roles.evilLancelot">
        <strong>
          <PreviewLink v-if="roles.evilLancelot" target="evilLancelot" />
          <template v-if="roles.guinevere"> and <PreviewLink target="goodLancelot" /> </template>
        </strong>
        - put your thumb down and re-form your hand into a fist.
      </li>
      <li>All players should have their eyes closed and hands in a fist in front of them.</li>
      <template v-if="roles.merlinPure || roles.merlin">
        <li v-if="roles.merlin">
          <strong><PreviewLink target="minion" text="Minions of Mordred(*)" /></strong>
          <span v-if="roles.mordred"
            >(not <strong><PreviewLink target="mordred" /></strong> himself)</span
          >
          - extend your thumb so that
          <strong><PreviewLink :target="roles.merlin ? 'merlin' : 'merlinPure'" /></strong> will know of you.
        </li>
        <template v-if="roles.merlinPure">
          <li>
            <strong><PreviewLink target="merlinPure" /></strong>, open your eyes to see the agents of evil.
          </li>
          <template
            v-for="role in [
              { target: 'oberon' },
              { target: 'lunatic' },
              { target: 'brute' },
              { target: 'evilLancelot', text: 'Evil Lancelot' },
              { target: 'trickster' },
              { target: 'morgana' },
            ] as const"
          >
            <li v-if="roles[role.target]">
              <strong><PreviewLink :target="role.target" :text="'text' in role ? role.text : role.target" /></strong>
              extend your thumb into the air.
            </li>
          </template>
          <li>
            <span>Ordinary </span><strong><PreviewLink target="minion" text="Minions" /></strong>
            <span v-if="roles.mordred"
              >(not <strong><PreviewLink target="mordred" /></strong> himself)</span
            >
            - extend your thumb into the air.
          </li>
        </template>
        <li v-if="roles.merlin">
          <strong><PreviewLink target="merlin" /></strong>, open your eyes and see the agents of evil.
        </li>
        <li>
          <strong><PreviewLink target="minion" text="Minions of Mordred(*)" /></strong> - put your thumbs down and
          re-form your hands into a fist.
        </li>
        <li>
          <strong
            ><PreviewLink target="merlin" v-if="roles.merlin" /><PreviewLink
              target="merlinPure"
              v-if="roles.merlinPure" /></strong
          >, close your eyes.
        </li>
        <template v-if="roles.percival">
          <li>
            <strong
              ><PreviewLink target="merlin" v-if="roles.merlin" /><PreviewLink
                target="merlinPure"
                v-if="roles.merlinPure" /></strong
            ><span v-if="roles.morgana">
              and <strong><PreviewLink target="morgana" /></strong></span
            >, extend your thumb into the air so <strong><PreviewLink target="percival" /></strong> will know you.
          </li>
          <li>
            <strong><PreviewLink target="percival" /></strong>, open your eyes and see
            <strong
              ><PreviewLink target="merlin" v-if="roles.merlin" /><PreviewLink
                target="merlinPure"
                v-if="roles.merlinPure" /></strong
            ><span v-if="roles.morgana">
              and <strong><PreviewLink target="morgana" /></strong></span
            >.
          </li>
          <li>
            <strong
              ><PreviewLink target="merlin" v-if="roles.merlin" /><PreviewLink
                target="merlinPure"
                v-if="roles.merlinPure" /></strong
            ><span v-if="roles.morgana">
              and <strong><PreviewLink target="morgana" /></strong
            ></span>
            - put your thumbs down and re-form your hands into a fist.
          </li>
          <li>
            <strong><PreviewLink target="percival" /></strong>, close your eyes.
          </li>
        </template>
      </template>
      <li v-if="roles.tristan">
        <strong><PreviewLink target="tristan" /></strong> and <strong><PreviewLink target="isolde" /></strong> open your
        eyes and look around to know each other.
      </li>
      <li>All players have their eyes closed and hands in a fist in front of them.</li>
      <li>Everyone open your eyes.</li>
    </ol>

    <p>
      <strong>Note</strong>: For the purposes of game setup, the term "<strong
        ><PreviewLink target="minion" text="Minions of Mordred(*)" /></strong
      >" refers to all agents of Evil unless otherwise stated.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import Options from '@/components/view/options/Options.vue';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    Options,
  },
  data() {
    const roles = {
      merlinPure: 0,
      merlin: 1,
      mordred: 0,
      morgana: 1,
      trickster: 0,
      oberon: 0,
      percival: 1,
      tristan: 0,
      isolde: 0,
      evilLancelot: 0,
      goodLancelot: 0,
      guinevere: 0,
      lunatic: 0,
      brute: 0,
      witch: 0,
    };

    return {
      roles,
    };
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
    width: 25px;
    height: 25px;
  }

  h3 {
    .evil-loyalty-icon,
    .good-loyalty-icon {
      width: 30px;
      height: 30px;
    }
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
