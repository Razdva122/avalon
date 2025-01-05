<template>
  <div class="info-page-content">
    <h1 class="title">{{ $t('about.title') }}</h1>
    <div v-html="$t('about.content')"></div>

    <div v-html="$t('about.description')"></div>

    <div class="image">
      <img class="preview" alt="preview" src="@/assets/images/preview.webp" />
    </div>

    <div>
      <LocalizedTextWrapper keypath="about.roles" />
    </div>

    <div>
      <LocalizedTextWrapper keypath="about.extraRoles" />
    </div>

    <div>
      {{ $t('about.features') }}
    </div>

    <div class="socials">
      {{ $t('about.code') }} <b><a href="https://github.com/Razdva122/avalon" target="_blank">github</a></b
      >.
    </div>
    <div class="socials">
      {{ $t('about.contact') }} <b><a href="https://discord.gg/DR9cEDDNdN" target="_blank">discord</a></b
      >.
    </div>

    <div>
      <strong>{{ $t('about.disclaimerTitle') }}</strong>
    </div>
    <div class="disclaimer">
      {{ $t('about.disclaimerContent') }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import PreviewLink from '@/components/view/information/PreviewLink.vue';

export default defineComponent({
  components: {
    PreviewLink,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.socials {
  font-size: 24px;
}

.preview {
  width: 100%;
  max-width: 600px;
}

.image {
  text-align: center;
}

.disclaimer {
  font-size: 12px;
}
</style>
