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
      <li>{{ $t('rules.closeEyesExtendHand') }}</li>
      <li>
        <strong><PreviewLink target="minion" /></strong>
        <span v-if="roles.oberon || roles.evilLancelot">
          ({{ $t('rules.except') }}
          <strong>
            <PreviewLink v-if="roles.oberon" target="oberon" />
            <PreviewLink v-if="roles.evilLancelot" target="evilLancelot" /> </strong
          >)
        </span>
        {{ $t('rules.seeAllAgentsOfEvil') }}
      </li>
      <li v-if="roles.evilLancelot">
        <strong><PreviewLink target="evilLancelot" /></strong> {{ $t('rules.extendYourThumbSo') }}
        <strong><PreviewLink target="minion" /></strong> {{ $t('rules.willKnowOfYou') }}
      </li>
      <li>
        <strong><PreviewLink target="minion" /></strong> {{ $t('rules.closeEyes') }}
      </li>
      <template v-if="roles.guinevere">
        <li>
          <strong><PreviewLink target="goodLancelot" /></strong> {{ $t('rules.extendYourThumbSo') }}
        </li>
        <li>
          <strong><PreviewLink target="guinevere" /></strong> {{ $t('rules.guinevereLookAround') }}
        </li>
      </template>
      <li v-if="roles.evilLancelot">
        <strong>
          <PreviewLink target="evilLancelot" />
          <template v-if="roles.guinevere">&nbsp;<PreviewLink target="goodLancelot" /> </template>
        </strong>
        {{ $t('rules.putYourThumbDown') }}
      </li>
      <li>{{ $t('rules.allPlayersShouldHaveEyedClosed') }}</li>
      <template v-if="roles.merlinPure || roles.merlin">
        <li v-if="roles.merlin">
          <strong><PreviewLink target="minion" /></strong>
          <span v-if="roles.mordred"
            >&nbsp;({{ $t('rules.except') }} <strong><PreviewLink target="mordred" /></strong>)</span
          >
          {{ $t('rules.extendYourThumbSo') }}
          <span v-if="roles.merlin"
            ><strong><PreviewLink target="merlin" /></strong
          ></span>
          {{ $t('rules.willKnowOfYou') }}
        </li>
        <template v-if="roles.merlinPure">
          <li>
            <strong><PreviewLink target="merlinPure" /></strong> {{ $t('rules.merlinOpenEyes') }}
          </li>
          <template
            v-for="role in [
              { target: 'oberon' },
              { target: 'lunatic' },
              { target: 'brute' },
              { target: 'evilLancelot' },
              { target: 'trickster' },
              { target: 'morgana' },
              { target: 'witch' },
              { target: 'revealer' },
            ] as const"
          >
            <li v-if="roles[role.target]">
              <strong><PreviewLink :target="role.target" /></strong>
              {{ $t('rules.extendYourThumb') }}
            </li>
          </template>
          <li>
            <span> {{ $t('rules.ordinaryMinion') }}</span
            >&nbsp;<strong><PreviewLink target="minion" /></strong> {{ $t('rules.extendYourThumb') }}
          </li>
        </template>
        <li v-if="roles.merlin">
          <strong><PreviewLink target="merlin" /></strong> {{ $t('rules.merlinOpenEyes') }}
        </li>
        <li>
          <strong><PreviewLink target="minion" /></strong> {{ $t('rules.putYourThumbDown') }}
        </li>
        <li>
          <span v-if="roles.merlin"
            ><strong><PreviewLink target="merlin" /></strong
          ></span>
          <span v-if="roles.merlinPure"
            ><strong><PreviewLink target="merlinPure" /></strong
          ></span>
          {{ $t('rules.closeEyes') }}
        </li>
        <template v-if="roles.percival">
          <li>
            <span v-if="roles.merlin"
              ><strong><PreviewLink target="merlin" /></strong
            ></span>
            <span v-if="roles.merlinPure"
              ><strong><PreviewLink target="merlinPure" /></strong
            ></span>
            <span v-if="roles.morgana"
              ><strong>&nbsp;<PreviewLink target="morgana" /></strong
            ></span>
            {{ $t('rules.extendYourThumbSo') }} <strong><PreviewLink target="percival" /></strong>
            {{ $t('rules.willKnowOfYou') }}
          </li>
          <li>
            <strong><PreviewLink target="percival" /></strong> {{ $t('rules.percivalOpenEyes') }}
            <span v-if="roles.merlin"
              ><strong><PreviewLink target="merlin" /></strong
            ></span>
            <span v-if="roles.merlinPure"
              ><strong><PreviewLink target="merlinPure" /></strong
            ></span>
            <span v-if="roles.morgana"
              ><strong>&nbsp;<PreviewLink target="morgana" /></strong></span
            >.
          </li>
          <li>
            <span v-if="roles.merlin"
              ><strong><PreviewLink target="merlin" /></strong
            ></span>
            <span v-if="roles.merlinPure"
              ><strong><PreviewLink target="merlinPure" /></strong
            ></span>
            <span v-if="roles.morgana"
              ><strong>&nbsp;<PreviewLink target="morgana" /></strong
            ></span>
            {{ $t('rules.putYourThumbDown') }}
          </li>
          <li>
            <strong><PreviewLink target="percival" /></strong> {{ $t('rules.closeEyes') }}
          </li>
        </template>
      </template>
      <li v-if="roles.tristan">
        <strong><PreviewLink target="tristan" /> <PreviewLink target="isolde" /></strong>
        {{ $t('rules.loversOpenEyes') }}
      </li>
      <li>{{ $t('rules.allPlayersShouldHaveEyedClosed') }}</li>
      <li>{{ $t('rules.everyoneOpenEyes') }}</li>
    </ol>

    <p>
      <strong>{{ $t('rules.note') }}</strong> <LocalizedTextWrapper keypath="rules.gameSetupNote" />
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
      revealer: 0,
      cleric: 0,
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
  border: 1px solid rgb(var(--v-theme-text-primary));
  padding: 5px;
}

th {
  background-color: rgb(var(--v-theme-inset));
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
