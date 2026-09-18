<template>
  <figure class="wallet-qr">
    <canvas v-show="!failed" ref="canvas" role="img" :aria-label="`${label}: ${address}`" />
    <p v-if="failed" role="alert">{{ t('support.qrFailed') }}</p>
    <figcaption>
      <strong>{{ label }}</strong>
      <p>{{ t('support.qrHint') }}</p>
    </figcaption>
  </figure>
</template>
<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import QRCode from 'qrcode';
const props = defineProps<{ address: string; label: string }>();
const { t } = useI18n();
const canvas = ref<HTMLCanvasElement>();
const failed = ref(false);
watchEffect(
  () => {
    if (!canvas.value) return;
    failed.value = false;
    // Canvas rendering is synchronous: a network change cannot leave an older QR visible.
    QRCode.toCanvas(
      canvas.value,
      props.address,
      {
        width: 256,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000ff', light: '#ffffffff' },
      },
      (error) => {
        failed.value = Boolean(error);
      },
    );
  },
  { flush: 'post' },
);
</script>
<style scoped>
.wallet-qr {
  margin: 16px 0 0;
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.18);
  border-radius: 12px;
  text-align: center;
}
canvas {
  display: block;
  width: 256px;
  max-width: 100%;
  height: auto;
  margin: 0 auto 12px;
  border-radius: 4px;
}
figcaption p {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: 0.75;
}
</style>
