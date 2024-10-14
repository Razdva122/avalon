<template>
  <div class="info-page-content">
    <div class="information">
      <router-link :to="{ name: 'rules' }">
        <v-btn size="x-large">
          {{ $t('wiki.rules') }}
          <template v-slot:prepend>
            <span class="material-icons"> auto_stories </span>
          </template>
        </v-btn>
      </router-link>

      <router-link :to="{ name: 'roles' }">
        <v-btn size="x-large">
          {{ $t('wiki.roles') }}
          <template v-slot:prepend>
            <span class="material-icons"> person </span>
          </template>
        </v-btn>
      </router-link>

      <router-link :to="{ name: 'addons' }">
        <v-btn size="x-large">
          {{ $t('wiki.addons') }}
          <template v-slot:prepend>
            <span class="material-icons"> castle </span>
          </template>
        </v-btn>
      </router-link>
    </div>

    <h1 class="title">{{ $t('wiki.title') }}</h1>

    <h2>{{ $t('wiki.setup') }}</h2>
    <ul>
      <li v-html="$t('wiki.playerAssignment')"></li>
      <li v-html="$t('wiki.revealPhase')"></li>
    </ul>

    <h2>{{ $t('wiki.missionSelection') }}</h2>
    <ul>
      <li v-html="$t('wiki.leaderSelection')"></li>
      <li v-html="$t('wiki.teamProposal')"></li>
      <li v-html="$t('wiki.voteTeam')"></li>
    </ul>

    <h2>{{ $t('wiki.missionPhase') }}</h2>
    <ul>
      <li v-html="$t('wiki.missionOutcome')"></li>
      <li v-html="$t('wiki.revealMissionResult')"></li>
    </ul>

    <h2>{{ $t('wiki.specialRolesInteractions') }}</h2>
    <ul>
      <li v-html="$t('wiki.usingSpecialAbilities')"></li>
      <li v-html="$t('wiki.assassinationPhase')"></li>
    </ul>

    <h2>{{ $t('wiki.victoryConditions') }}</h2>
    <ul>
      <li v-html="$t('wiki.determineWinner')"></li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.information {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
