<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.oberon') }} {{ $t('roles.role') }}
    </h1>
    <WikiRoleGuide role="oberon" />

    <h2>{{ $t('oberon.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="oberon.playingAsOberon" />
    </p>

    <h2>{{ $t('oberon.archetypes') }}</h2>
    <div>
      <LocalizedTextWrapper keypath="oberon.archetypesDescription" />
    </div>
    <ul>
      <SchemaImage
        class="archetype-image evil-role"
        :src="calculateRoleUrl('wraith')"
        :alt="$t('roles.wraith')"
        :description="$t('roles.wraith')"
      />
      <li>
        <strong>{{ $t('oberon.wraithArchetype') }}</strong>
        <LocalizedTextWrapper keypath="oberon.wraithDescription" />
      </li>
    </ul>

    <TopRolePlayer role="oberon" class="my-4" />

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

    <p>
      <LocalizedTextWrapper keypath="oberon.playingСonclusion" />
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
