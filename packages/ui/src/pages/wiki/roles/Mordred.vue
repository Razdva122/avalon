<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.mordred') }} {{ $t('roles.role') }}
    </h1>

    <SchemaImage
      class="preview-image"
      :src="calculateRoleUrl('mordred')"
      :alt="$t('roles.mordred')"
      :description="$t('roles.mordred')"
    />

    <h2>{{ $t('mordred.generalInformation') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="mordred.playingAsMordred" />
    </p>

    <TopRolePlayer role="mordred" class="my-4" />

    <h2>{{ $t('mordred.generalTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('mordred.hiddenIdentity') }}</strong
        ><LocalizedTextWrapper keypath="mordred.hiddenIdentityContent" />
      </li>
      <li>
        <strong>{{ $t('mordred.distrust') }}</strong> {{ $t('mordred.distrustContent') }}
      </li>
      <li>
        <strong>{{ $t('mordred.coordinateMinions') }}</strong> {{ $t('mordred.coordinateMinionsContent') }}
      </li>
      <li>
        <strong>{{ $t('mordred.leadShadows') }}</strong> {{ $t('mordred.leadShadowsContent') }}
      </li>
      <li>
        <strong>{{ $t('mordred.protectIdentity') }}</strong>
        <LocalizedTextWrapper keypath="mordred.protectIdentityContent" />
      </li>
    </ul>

    <h2>{{ $t('mordred.strategicTips') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('mordred.confusePlayers') }}</strong> {{ $t('mordred.confusePlayersContent') }}
      </li>
      <li>
        <strong>{{ $t('mordred.useDisinformation') }}</strong> {{ $t('mordred.useDisinformationContent') }}
      </li>
      <li>
        <strong>{{ $t('mordred.cultivateAlliances') }}</strong> {{ $t('mordred.cultivateAlliancesContent') }}
      </li>
      <li>
        <strong>{{ $t('mordred.controlNarrative') }}</strong> {{ $t('mordred.controlNarrativeContent') }}
      </li>
      <li>
        <strong><LocalizedTextWrapper keypath="mordred.identifyMerlin" /></strong
        ><LocalizedTextWrapper keypath="mordred.identifyMerlinContent" />
      </li>
    </ul>

    <p>
      <LocalizedTextWrapper keypath="mordred.commandTheShadows" />
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
</style>
