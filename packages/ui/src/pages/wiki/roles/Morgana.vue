<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.morgana') }} {{ $t('roles.role') }}
    </h1>
    <WikiRoleGuide role="morgana" />

    <h2>{{ $t('morgana.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="morgana.playingAsMorgana" />
    </p>

    <TopRolePlayer role="morgana" class="my-4" />

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

    <p>
      <LocalizedTextWrapper keypath="morgana.thrivingAsMorgana" />
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiRoleGuide from '@/components/view/information/WikiRoleGuide.vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiRoleGuide,
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
    TopRolePlayer,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';

h2 {
  margin-top: 20px;
}
</style>
