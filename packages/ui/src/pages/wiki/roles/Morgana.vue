<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.morgana') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('morgana')"
      :alt="$t('roles.morgana')"
      :description="$t('roles.morgana')"
    />

    <h2>{{ $t('morgana.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="morgana.playingAsMorgana" />
    </p>

    <h2>{{ $t('morgana.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('morgana.masterArtOfDeceptionTitle') }}</strong>
        <LocalizedTextWrapper keypath="morgana.masterArtOfDeceptionDescription" />
      </li>
      <li>
        <strong>{{ $t('morgana.createConfusionTitle') }}</strong> {{ $t('morgana.createConfusionDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.coordinateEvilPlayersTitle') }}</strong>
        {{ $t('morgana.coordinateEvilPlayersDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.stayComposedTitle') }}</strong> {{ $t('morgana.stayComposedDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.adaptStrategyTitle') }}</strong> {{ $t('morgana.adaptStrategyDescription') }}
      </li>
    </ul>

    <h2>{{ $t('morgana.strategicTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('morgana.emphasizePlausibleDeniabilityTitle') }}</strong>
        {{ $t('morgana.emphasizePlausibleDeniabilityDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.divertAttentionTitle') }}</strong> {{ $t('morgana.divertAttentionDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.imitateMerlinsConcernTitle') }}</strong>
        {{ $t('morgana.imitateMerlinsConcernDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.questionOthersTitle') }}</strong> {{ $t('morgana.questionOthersDescription') }}
      </li>
      <li>
        <strong>{{ $t('morgana.fakeTrustworthinessTitle') }}</strong> {{ $t('morgana.fakeTrustworthinessDescription') }}
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="morgana.thrivingAsMorgana" />
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
