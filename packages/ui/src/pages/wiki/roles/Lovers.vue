<template>
  <div class="info-page-content lovers">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('lovers.title') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('isolde')"
      :alt="$t('roles.lovers')"
      :description="$t('roles.lovers')"
    />
    <img class="preview-image" :src="calculateRoleUrl('tristan')" alt="tristan" />
    <div class="credits">{{ $t('lovers.credits') }}</div>

    <h2>{{ $t('lovers.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="lovers.playingAsTheLovers" />
    </p>

    <div class="d-flex flex-wrap">
      <div class="flex-grow-1">
        <TopRolePlayer role="tristan" :displayRole="true" class="my-4" />
      </div>
      <div class="flex-grow-1">
        <TopRolePlayer role="isolde" :displayRole="true" class="my-4" />
      </div>
    </div>

    <h2>{{ $t('lovers.generalTips') }}</h2>
    <ul>
      <li v-html="$t('lovers.maintainIndividualPersonas')"></li>
      <li v-html="$t('lovers.protectEachOther')"></li>
      <li v-html="$t('lovers.disguiseYourGameplay')"></li>
      <li v-html="$t('lovers.beCarefulWithMeetings')"></li>
    </ul>

    <h2>{{ $t('lovers.strategicTips') }}</h2>
    <ul>
      <li v-html="$t('lovers.divideAndConquer')"></li>
      <li v-html="$t('lovers.coordinateWithoutCollusion')"></li>
      <li v-html="$t('lovers.establishIndependentTrust')"></li>
      <li v-html="$t('lovers.planForContingency')"></li>
    </ul>
    <p>
      <LocalizedTextWrapper keypath="lovers.uniqueAdvantage" />
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
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

h2 {
  margin-top: 20px;
}

.lovers {
  .preview-image {
    width: 25%;
    max-width: 350px;
  }
}

.credits {
  float: right;
  clear: right;
  font-size: 14px;
  width: 50%;
  max-width: 700px;
  text-align: center;
  opacity: 0.6;
}
</style>
