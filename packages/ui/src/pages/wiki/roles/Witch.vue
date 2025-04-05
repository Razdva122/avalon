<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.witch') }} {{ $t('roles.role') }}
    </h1>
    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('witch')"
      :alt="$t('roles.witch')"
      :description="$t('roles.witch')"
    />

    <h2>{{ $t('witch.generalInformation') }}</h2>
    <p><LocalizedTextWrapper keypath="witch.intro" /></p>

    <TopRolePlayer role="witch" class="my-4" />

    <h2>{{ $t('witch.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('witch.sowSeedsTitle') }}</strong>
        {{ $t('witch.sowSeedsText') }}
      </li>
      <li>
        <strong>{{ $t('witch.collaborateTitle') }}</strong>
        {{ $t('witch.collaborateText') }}
      </li>
      <li>
        <strong>{{ $t('witch.utilizePowerTitle') }}</strong>
        {{ $t('witch.utilizePowerText') }}
      </li>
      <li>
        <strong>{{ $t('witch.maintainDisguiseTitle') }}</strong>
        {{ $t('witch.maintainDisguiseText') }}
      </li>
    </ul>

    <h2>{{ $t('witch.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('witch.createUncertaintyTitle') }}</strong>
        {{ $t('witch.createUncertaintyText') }}
      </li>
      <li>
        <strong>{{ $t('witch.influenceGameplayTitle') }}</strong>
        {{ $t('witch.influenceGameplayText') }}
      </li>
      <li>
        <strong>{{ $t('witch.hideEarlyMissionsTitle') }}</strong>
        {{ $t('witch.hideEarlyMissionsText') }}
      </li>
    </ul>

    <p><LocalizedTextWrapper keypath="witch.conclusion" /></p>
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
</style>
