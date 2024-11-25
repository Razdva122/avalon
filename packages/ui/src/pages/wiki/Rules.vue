<template>
  <div class="info-page-content rules">
    <WikiBreadCrumbs />
    <h1 class="title">{{ $t('rules.title') }}</h1>

    <h2>{{ $t('rules.gameObjective') }}</h2>

    <p>
      {{ $t('rules.gameDescription') }}
    </p>

    <i18n-t keypath="rules.objectiveArthur" tag="h3">
      <template v-slot:goodLoyaltyIcon>
        <span class="good-loyalty-icon"></span>
      </template>
    </i18n-t>

    <p>
      <LocalizedTextWrapper keypath="rules.missionObjective" />
    </p>

    <i18n-t keypath="rules.objectiveMordred" tag="h3">
      <template v-slot:evilLoyaltyIcon>
        <span class="evil-loyalty-icon"></span>
      </template>
    </i18n-t>

    <p>
      <LocalizedTextWrapper keypath="rules.minionObjective" />
    </p>

    <h3>{{ $t('rules.additionalObjectivesTitle') }}</h3>
    <p>
      <LocalizedTextWrapper keypath="rules.additionalObjectivesDescription" />
    </p>
    <v-divider :thickness="5"></v-divider>

    <h2>{{ $t('rules.gameplayRules') }}</h2>

    <h3>1. {{ $t('rules.teamProposalAndVoting') }}</h3>
    <ul>
      <li>
        {{ $t('rules.teamProposalDescription') }}
      </li>
      <li>
        {{ $t('rules.votingDescription') }}
      </li>
    </ul>

    <h3>2. {{ $t('rules.missionPhaseTitle') }}</h3>
    <ul>
      <i18n-t keypath="rules.teamApproved" tag="li">
        <template v-slot:goodLoyaltyIcon>
          <span class="good-loyalty-icon"></span>
        </template>
        <template v-slot:evilLoyaltyIcon>
          <span class="evil-loyalty-icon"></span>
        </template>
      </i18n-t>
      <li>{{ $t('rules.submitCardsToLeader') }}</li>
      <i18n-t keypath="rules.cardsRevealed" tag="li">
        <template v-slot:goodLoyaltyIcon>
          <span class="good-loyalty-icon"></span>
        </template>
        <template v-slot:evilLoyaltyIcon>
          <span class="evil-loyalty-icon"></span>
        </template>
      </i18n-t>
    </ul>

    <h3>3. {{ $t('rules.progressionOfPlayTitle') }}</h3>
    <ul>
      <li>{{ $t('rules.leaderTokenMove') }}</li>
      <li>{{ $t('rules.newRound') }}</li>
      <li>{{ $t('rules.playersUseSkills') }}</li>
    </ul>
    <v-divider :thickness="5"></v-divider>

    <h2>{{ $t('rules.conclusionOfGameplayTitle') }}</h2>
    <p><LocalizedTextWrapper keypath="rules.gameplayEndsCondition" /></p>

    <p>
      {{ $t('rules.strategicDiscussion') }}
    </p>
    <v-divider :thickness="5"></v-divider>

    <h2>{{ $t('rules.missionSizes') }}</h2>

    <div class="table">
      <table>
        <thead>
          <tr>
            <th>{{ $t('rules.numberOfPlayers') }}</th>
            <th>{{ $t('rules.missionNumber', { number: 1 }) }}</th>
            <th>{{ $t('rules.missionNumber', { number: 2 }) }}</th>
            <th>{{ $t('rules.missionNumber', { number: 3 }) }}</th>
            <th>{{ $t('rules.missionNumber', { number: 4 }) }}</th>
            <th>{{ $t('rules.missionNumber', { number: 5 }) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>{{ $t('rules.countPlayers', { count: 5 }) }}</th>
            <td>2</td>
            <td>3</td>
            <td>2</td>
            <td>3</td>
            <td>3</td>
          </tr>
          <tr>
            <th>{{ $t('rules.countPlayers', { count: 6 }) }}</th>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>3</td>
            <td>4</td>
          </tr>
          <tr>
            <th>{{ $t('rules.countPlayers', { count: 7 }) }}</th>
            <td>2</td>
            <td>3</td>
            <td>3</td>
            <td>4*</td>
            <td>4</td>
          </tr>
          <tr>
            <th>{{ $t('rules.countPlayers', { count: 8 }) }}</th>
            <td>3</td>
            <td>4</td>
            <td>4</td>
            <td>5*</td>
            <td>5</td>
          </tr>
          <tr>
            <th>{{ $t('rules.countPlayers', { count: 9 }) }}</th>
            <td>3</td>
            <td>4</td>
            <td>4</td>
            <td>5*</td>
            <td>5</td>
          </tr>
          <tr>
            <th>{{ $t('rules.countPlayers', { count: 10 }) }}</th>
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
      <b>{{ $t('rules.note') }}</b>
      <i18n-t keypath="rules.twoFailsNote" tag="span">
        <template v-slot:evilLoyaltyIcon>
          <span class="evil-loyalty-icon"></span>
        </template>
      </i18n-t>
    </p>

    <v-divider :thickness="5"></v-divider>

    <h2>{{ $t('rules.recommendTitle') }}</h2>
    <h3>{{ $t('rules.generalTipsTitle') }}</h3>
    <p v-html="$t('rules.generalTipsText')"></p>
    <p v-html="$t('rules.newcomersAdvice')"></p>
    <p>{{ $t('rules.recommendationAfterFirstGames') }}</p>

    <p>
      <PreviewLink target="merlin" /> -> <PreviewLink target="percival" /> -> <PreviewLink target="morgana" /> ->
      <PreviewLink target="oberon" /> -> <PreviewLink target="mordred" /> -> <PreviewLink target="ladyOfLake" /> ->
      <PreviewLink target="tristan" /> +
      <PreviewLink target="isolde" />
    </p>

    <div class="game-setup">
      <h3>{{ $t('rules.countPlayers', { count: 5 }) }}:</h3>
      <strong>{{ $t('rules.servantTeam') }}</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" /><br />
      <strong>{{ $t('rules.mordredTeam') }}</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />
    </div>

    <div class="game-setup">
      <h3>{{ $t('rules.countPlayers', { count: 6 }) }}:</h3>
      <strong>{{ $t('rules.servantTeam') }}</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" />, <PreviewLink target="servant" /><br />
      <strong>{{ $t('rules.mordredTeam') }}</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />
    </div>

    <div class="game-setup">
      <h3>{{ $t('rules.countPlayers', { count: 7 }) }}:</h3>
      <strong>{{ $t('rules.servantTeam') }}</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" />, <PreviewLink target="servant" /><br />
      <strong>{{ $t('rules.mordredTeam') }}</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" /><br />
      <em>{{ $t('rules.expansions') }}</em> <PreviewLink target="ladyOfLake" />
    </div>

    <div class="game-setup">
      <h3>{{ $t('rules.countPlayers', { count: 8 }) }}:</h3>
      <strong>{{ $t('rules.servantTeam') }}</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="servant" />, <PreviewLink target="servant" />, <PreviewLink target="servant" /><br />
      <strong>{{ $t('rules.mordredTeam') }}</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" /><br />
      <em>{{ $t('rules.expansions') }}</em> <PreviewLink target="ladyOfLake" />
    </div>

    <div class="game-setup">
      <h3>{{ $t('rules.countPlayers', { count: 9 }) }}:</h3>
      <strong>{{ $t('rules.servantTeam') }}</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="tristan" />, <PreviewLink target="isolde" />, <PreviewLink target="servant" />,
      <PreviewLink target="servant" /><br />
      <strong>{{ $t('rules.mordredTeam') }}</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" /><br />
    </div>

    <div class="game-setup">
      <h3>{{ $t('rules.countPlayers', { count: 10 }) }}:</h3>
      <strong>{{ $t('rules.servantTeam') }}</strong> <PreviewLink target="merlin" />, <PreviewLink target="percival" />,
      <PreviewLink target="tristan" />, <PreviewLink target="isolde" />, <PreviewLink target="servant" />,
      <PreviewLink target="servant" /><br />
      <strong>{{ $t('rules.mordredTeam') }}</strong> <PreviewLink target="mordred" />, <PreviewLink target="morgana" />,
      <PreviewLink target="minion" />, <PreviewLink target="oberon" /><br />
      <em>{{ $t('rules.expansions') }}</em> <PreviewLink target="ladyOfLake" />
    </div>

    <p>
      <b>{{ $t('rules.note') }}</b> <span v-html="$t('rules.assassinNote')"></span>
    </p>

    <h3>{{ $t('addons.excalibur') }}:</h3>
    <p>
      <LocalizedTextWrapper keypath="rules.excaliburHint" />
    </p>

    <v-divider :thickness="5"></v-divider>

    <h2>{{ $t('rules.offlineSetup') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="rules.defaultSetup" />
    </p>
    <Options :roles="roles" :buttonText="$t('options.roles')" />
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
      <strong>{{ $t('rules.note') }}</strong> For the purposes of game setup, the term "<strong
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
