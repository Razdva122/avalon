<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.percival') }} {{ $t('roles.role') }}
    </h1>
    <WikiRoleGuide role="percival" />

    <h2>{{ $t('percival.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="percival.percivalRole" />
    </p>

    <TopRolePlayer role="percival" class="my-4" />

    <h2>{{ $t('percival.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('percival.understandYourRole') }}</strong>
        <LocalizedTextWrapper keypath="percival.youAreProtector" />
      </li>
      <li>
        <strong>{{ $t('percival.payAttentionToBehavior') }}</strong>
        <LocalizedTextWrapper keypath="percival.observeBehaviors" />
      </li>
      <li>
        <strong>{{ $t('percival.beSubtle') }}</strong>
        <LocalizedTextWrapper keypath="percival.beCarefulWithDefense" />
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="percival.playingAsPercival" />
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
