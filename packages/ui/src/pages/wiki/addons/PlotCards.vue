<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>{{ $t('plotCards.seoHeading') }}</h1>
    <div class="addon-overview">
      <SchemaImage
        class="addon-image"
        :src="getImagePathByID('features', 'plot_cards')"
        :alt="$t('addons.plotCards')"
        :description="$t('addons.plotCards')"
      />
      <p><LocalizedTextWrapper keypath="plotCards.seoIntro" /></p>
    </div>
    <section class="addon-rules">
      <h2>{{ $t('wiki.rules') }}</h2>
      <ol>
        <li v-for="number in 3" :key="number"><LocalizedTextWrapper :keypath="`plotCards.seoRule${number}`" /></li>
      </ol>
    </section>
    <section class="wiki-panel addon-limits">
      <h2>{{ $t('wiki.roleLimit') }}</h2>
      <p><LocalizedTextWrapper keypath="plotCards.seoLimit1" /></p>
      <p><LocalizedTextWrapper keypath="plotCards.seoLimit2" /></p>
    </section>
    <section class="addon-scenarios">
      <h2>{{ $t('wiki.roleScenarios') }}</h2>
      <ul>
        <li v-for="number in 2" :key="number"><LocalizedTextWrapper :keypath="`plotCards.seoScenario${number}`" /></li>
      </ul>
    </section>
    <nav class="wiki-nav" :aria-label="$t('wiki.title')">
      <LocaleLink :to="{ name: 'expansions' }">{{ $t('wiki.addonsTitle') }}</LocaleLink>
      <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.rolesTitle') }}</LocaleLink>
    </nav>
    <h2>{{ $t('plotCards.cardsInGame') }}</h2>
    <div class="cards-in-game">
      <div class="player-count">
        <h3>{{ $t('plotCards.fiveToSixPlayers') }}</h3>
        <div class="card-grid">
          <div class="card-item-small" v-for="i in 2" :key="'leadToVictory' + i">
            <PlotCard class="card-icon-small" cardName="leadToVictory" :displayTooltip="true" />
          </div>
          <div class="card-item-small" v-for="i in 2" :key="'ambush' + i">
            <PlotCard class="card-icon-small" cardName="ambush" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="kingReturns" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="restoreHonor" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="charge" :displayTooltip="true" />
          </div>
        </div>
      </div>

      <div class="player-count">
        <h3>{{ $t('plotCards.sevenPlusPlayers') }}</h3>
        <p>{{ $t('plotCards.additionalCards') }}</p>
        <div class="card-grid">
          <div class="card-item-small" v-for="i in 2" :key="'kingReturns' + i">
            <PlotCard class="card-icon-small" cardName="kingReturns" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="charge" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="showNature" :displayTooltip="true" />
          </div>
          <div class="card-item-small" v-for="i in 2" :key="'areYouTheOne' + i">
            <PlotCard class="card-icon-small" cardName="areYouTheOne" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="weFoundYou" :displayTooltip="true" />
          </div>
          <div class="card-item-small">
            <PlotCard class="card-icon-small" cardName="showStrength" :displayTooltip="true" />
          </div>
        </div>
      </div>
    </div>

    <h2>{{ $t('plotCards.cardTypes') }}</h2>

    <h3>{{ $t('plotCards.usableCards') }}</h3>
    <ul class="card-list">
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="leadToVictory" />
          <strong>{{ $t('cardsInfo.leadToVictory') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.leadToVictoryDesc" />
      </li>
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="ambush" />
          <strong>{{ $t('cardsInfo.ambush') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.ambushDesc" />
      </li>
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="kingReturns" />
          <strong>{{ $t('cardsInfo.kingReturns') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.kingReturnsDesc" />
      </li>
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="weFoundYou" />
          <strong>{{ $t('cardsInfo.weFoundYou') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.weFoundYouDesc" />
      </li>
    </ul>

    <h3>{{ $t('plotCards.instantCards') }}</h3>
    <ul class="card-list">
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="restoreHonor" />
          <strong>{{ $t('cardsInfo.restoreHonor') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.restoreHonorDesc" />
      </li>
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="showStrength" />
          <strong>{{ $t('cardsInfo.showStrength') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.showStrengthDesc" />
      </li>
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="showNature" />
          <strong>{{ $t('cardsInfo.showNature') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.showNatureDesc" />
      </li>
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="areYouTheOne" />
          <strong>{{ $t('cardsInfo.areYouTheOne') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.areYouTheOneDesc" />
      </li>
    </ul>

    <h3>{{ $t('plotCards.effectsCards') }}</h3>
    <ul class="card-list">
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="charge" />
          <strong>{{ $t('cardsInfo.charge') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.chargeDesc" />
      </li>
    </ul>

    <WikiPlayCta />
  </div>
</template>

<script setup lang="ts">
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import WikiPlayCta from '@/components/view/information/WikiPlayCta.vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import { getImagePathByID } from '@/helpers/images';
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';
@import '@/styles/wiki-addon.scss';
.card-list {
  list-style-type: none;
  padding-left: 0;
  margin-bottom: 20px;

  li {
    margin-bottom: 16px;
  }
}

.card-item {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.card-icon {
  border-radius: 20%;
  overflow: hidden;
  width: 60px;
  height: 60px;
  margin-right: 12px;
}

.cards-in-game {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}

.player-count {
  margin-bottom: 0px;

  h3 {
    margin-top: 0px;
  }
}

.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.card-item-small {
  border-radius: 20%;
  overflow: hidden;
  width: 50px;
  height: 50px;
}

.card-icon-small {
  width: 100%;
  height: 100%;
}
</style>
