<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>{{ $t('addons.plotCards') }}</h1>
    <SchemaImage
      class="preview-image"
      :src="getImagePathByID('features', 'plot_cards')"
      :alt="$t('addons.plotCards')"
      :description="$t('addons.plotCards')"
    />
    <p>
      <strong>{{ $t('addons.plotCards') }}</strong>
      <LocalizedTextWrapper keypath="plotCards.intro" />
    </p>

    <h2>{{ $t('plotCards.howItWorks') }}</h2>
    <p><LocalizedTextWrapper keypath="plotCards.mechanics" /></p>

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
    <p><LocalizedTextWrapper keypath="plotCards.typesIntro" /></p>

    <h3>{{ $t('plotCards.usableCards') }}</h3>
    <p><LocalizedTextWrapper keypath="plotCards.usableIntro" /></p>
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
    <p><LocalizedTextWrapper keypath="plotCards.instantIntro" /></p>
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
    <p><LocalizedTextWrapper keypath="plotCards.effectsIntro" /></p>
    <ul class="card-list">
      <li class="card-item">
        <div class="card-header">
          <PlotCard class="card-icon" cardName="charge" />
          <strong>{{ $t('cardsInfo.charge') }}</strong>
        </div>
        <LocalizedTextWrapper keypath="plotCards.chargeDesc" />
      </li>
    </ul>

    <h2>{{ $t('plotCards.gameplayTips') }}</h2>
    <ol>
      <li>
        <strong>{{ $t('plotCards.strategicUse') }}</strong>
        <LocalizedTextWrapper keypath="plotCards.strategicTips" />
      </li>
      <li>
        <strong>{{ $t('plotCards.timing') }}</strong>
        <LocalizedTextWrapper keypath="plotCards.timingTips" />
      </li>
      <li>
        <strong>{{ $t('plotCards.information') }}</strong>
        <LocalizedTextWrapper keypath="plotCards.informationTips" />
      </li>
      <li>
        <strong>{{ $t('plotCards.deception') }}</strong>
        <LocalizedTextWrapper keypath="plotCards.deceptionTips" />
      </li>
    </ol>

    <h2>{{ $t('plotCards.faq') }}</h2>
    <div class="faq-section">
      <div class="faq-item">
        <h4>{{ $t('plotCards.canCombine') }}</h4>
        <p><LocalizedTextWrapper keypath="plotCards.canCombineAnswer" /></p>
      </div>
      <div class="faq-item">
        <h4>{{ $t('plotCards.whenDistributed') }}</h4>
        <p><LocalizedTextWrapper keypath="plotCards.whenDistributedAnswer" /></p>
      </div>
      <div class="faq-item">
        <h4>{{ $t('plotCards.seeOthers') }}</h4>
        <p><LocalizedTextWrapper keypath="plotCards.seeOthersAnswer" /></p>
      </div>
      <div class="faq-item">
        <h4>{{ $t('plotCards.mustUse') }}</h4>
        <p><LocalizedTextWrapper keypath="plotCards.mustUseAnswer" /></p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import { getImagePathByID } from '@/helpers/images';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
    PlotCard,
  },
  data() {
    return {
      getImagePathByID,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 24px;
  margin-bottom: 16px;
}

h3 {
  margin-top: 20px;
  margin-bottom: 12px;
  color: var(--v-primary-base);
}

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

.faq-section {
  margin-top: 16px;

  .faq-item {
    margin-bottom: 20px;

    h4 {
      font-weight: bold;
      margin-bottom: 8px;
    }
  }
}
</style>
