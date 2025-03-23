<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.oberon') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('oberon')"
      :alt="$t('roles.oberon')"
      :description="$t('roles.oberon')"
    />

    <h2>{{ $t('oberon.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="oberon.playingAsOberon" />
    </p>

    <h2>{{ $t('oberon.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('oberon.embraceMystery') }}</strong>
        {{ $t('oberon.useUnknownStatus') }}
      </li>
      <li>
        <strong>{{ $t('oberon.observeClosely') }}</strong>
        {{ $t('oberon.payAttention') }}
      </li>
      <li>
        <strong>{{ $t('oberon.actIndependently') }}</strong>
        {{ $t('oberon.withoutCoordination') }}
      </li>
      <li>
        <strong>{{ $t('oberon.misleadSubtly') }}</strong>
        {{ $t('oberon.makeStatements') }}
      </li>
      <li>
        <strong>{{ $t('oberon.takeRisks') }}</strong>
        {{ $t('oberon.needToMakeBoldMoves') }}
      </li>
    </ul>

    <h2>{{ $t('oberon.strategicTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('oberon.createUncertainty') }}</strong>
        {{ $t('oberon.aimToDestabilize') }}
      </li>
      <li>
        <strong>{{ $t('oberon.beUnpredictable') }}</strong>
        <LocalizedTextWrapper keypath="oberon.varyGameplay" />
      </li>
      <li>
        <strong>{{ $t('oberon.listenForClues') }}</strong>
        {{ $t('oberon.useToAdvantage') }}
      </li>
      <li>
        <strong>{{ $t('oberon.avoidDrawingAttention') }}</strong>
        {{ $t('oberon.focusOnKeyPlays') }}
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="oberon.playingСonclusion" />
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
