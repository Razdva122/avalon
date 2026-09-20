<template>
  <div class="info-page-content wiki-page">
    <h1 class="title">{{ $t('wiki.title') }}</h1>
    <p>{{ $t('wiki.introduction') }}</p>

    <nav class="wiki-sections" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'rules' }">
        <span class="material-icons" aria-hidden="true">auto_stories</span>
        <strong>{{ $t('wiki.rules') }}</strong>
        <span>{{ $t('rules.gameplayRules') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'roles' }">
        <span class="material-icons" aria-hidden="true">person</span>
        <strong>{{ $t('wiki.roles') }}</strong>
        <span>{{ $t('wiki.rolesTitle') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'expansions' }">
        <span class="material-icons" aria-hidden="true">castle</span>
        <strong>{{ $t('wiki.addons') }}</strong>
        <span>{{ $t('wiki.addonsTitle') }}</span>
      </LocaleLink>
    </nav>

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
@import '@/styles/wiki-page.scss';

.information {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
</style>

<style scoped lang="scss">
.wiki-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 28px 0 40px;
  a {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 24px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
    border-radius: 16px;
    text-decoration: none;
    color: inherit;
    background: rgba(var(--v-theme-on-surface), 0.025);
    &:hover {
      border-color: rgb(var(--v-theme-primary));
      background: rgba(var(--v-theme-primary), 0.08);
    }
  }
  strong {
    font-size: 22px;
  }
  .material-icons {
    font-size: 30px;
    color: rgb(var(--v-theme-primary));
    margin-bottom: 4px;
  }
}
@media (max-width: 700px) {
  .wiki-sections {
    grid-template-columns: 1fr;
  }
}
</style>
