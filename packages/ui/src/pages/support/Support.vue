<template>
  <main class="support-page">
    <header class="support-hero">
      <p class="eyebrow">{{ t('support.eyebrow') }}</p>
      <h1>{{ t('support.title') }}</h1>
      <p class="intro">{{ t('support.intro') }}</p>
    </header>
    <section class="premium-panel">
      <span class="premium-mark">✦ PREMIUM</span>
      <h2>{{ t('support.premiumTitle') }}</h2>
      <p>{{ t('support.premiumDescription') }}</p>
      <div class="benefits">
        <article v-for="kind in ['badge', 'privacy', 'fair']" :key="kind">
          <h3>{{ t(`support.${kind}Title`) }}</h3>
          <p>{{ t(`support.${kind}Description`) }}</p>
        </article>
      </div>
    </section>
    <p v-if="error" class="error" role="alert">
      {{ t(`support.${error}`, { amount: minimumUSD }) }}
      <button type="button" @click="load()">{{ t('support.retry') }}</button>
    </p>
    <div class="support-columns">
      <section class="support-panel">
        <h2>{{ t('support.checkout') }}</h2>
        <div v-if="info?.enabled" class="hint" aria-live="polite">
          <p>{{ t('support.networkMinimumHint') }}</p>
          <p v-if="networkLoading">{{ t('support.refreshing') }}</p>
          <ul v-else>
            <li v-for="code in info.currencies" :key="code">
              {{ networkName(code) }} —
              {{
                networks.find((n) => n.currency === code)?.available
                  ? t('support.networkMinimum', {
                      amount: networks.find((n) => n.currency === code)?.minimumUSD?.toFixed(2),
                      tokens: networks.find((n) => n.currency === code)?.minimumUSDT,
                    })
                  : t('support.networkUnavailable')
              }}
            </li>
          </ul>
          <button type="button" :disabled="networkLoading" @click="loadNetworks">{{ t('support.refresh') }}</button>
        </div>
        <p v-if="!info && loading" role="status">{{ t('support.refreshing') }}</p>
        <p v-else-if="info && !info.enabled" class="notice">{{ t('support.unavailable') }}</p>
        <p v-else-if="info && !store.state.profile" class="notice">{{ t('support.login') }}</p>
        <form v-else-if="info?.enabled" @submit.prevent="checkout">
          <label for="support-amount">{{ t('support.amount') }}</label>
          <input
            id="support-amount"
            v-model="amount"
            type="number"
            :min="selectedNetwork?.minimumUSD || 1"
            max="10000"
            step="0.01"
            required
          />
          <p
            v-if="selectedNetwork?.available && Number(amount) < (selectedNetwork.minimumUSD || 1)"
            class="notice"
            role="status"
          >
            {{
              t('support.networkMinimum', {
                amount: selectedNetwork.minimumUSD?.toFixed(2),
                tokens: selectedNetwork.minimumUSDT,
              })
            }}
          </p>
          <div class="presets">
            <button
              v-for="value in [10, 20, 50]"
              :key="value"
              type="button"
              :aria-pressed="amount === String(value)"
              @click="amount = String(value)"
            >
              ${{ value }}
            </button>
          </div>
          <label for="support-network">{{ t('support.network') }}</label>
          <select id="support-network" v-model="currency" required>
            <option
              v-for="code in info.currencies"
              :key="code"
              :value="code"
              :disabled="!networks.find((n) => n.currency === code)?.available"
            >
              {{ networkName(code) }}
            </option>
          </select>
          <label class="checkbox"><input v-model="anonymous" type="checkbox" />{{ t('support.anonymous') }}</label>
          <p class="hint">{{ t('support.anonymousHint') }}</p>
          <button
            class="primary"
            type="submit"
            :disabled="
              busy ||
              loading ||
              !account ||
              networkLoading ||
              !selectedNetwork?.available ||
              Number(amount) < (selectedNetwork?.minimumUSD || 1)
            "
          >
            {{ t(busy ? 'support.refreshing' : 'support.pay') }}
          </button>
          <p class="hint">{{ t('support.paymentHint') }}</p>
        </form>
      </section>
      <section class="support-panel">
        <h2>{{ t('support.recent') }}</h2>
        <p v-if="info && !info.donations.length" class="hint">{{ t('support.empty') }}</p>
        <ol class="donations">
          <li v-for="donation in info?.donations || []" :key="donation.id">
            <span class="donor"
              >{{ donation.name || t('support.anonymousName') }}<small>{{ donation.date }}</small></span
            >
            <strong>${{ donation.amountUSD.toFixed(2) }}</strong>
          </li>
        </ol>
      </section>
    </div>
    <section v-if="account && store.state.profile" class="support-panel account">
      <h2>{{ t('support.account') }}</h2>
      <p>{{ t('support.total', { amount: account.totalUSD.toFixed(2) }) }}</p>
      <p class="premium-state">
        {{
          account.premium
            ? t('support.active')
            : t('support.remaining', { amount: Math.max(0, 10 - account.totalUSD).toFixed(2) })
        }}
      </p>
      <form @submit.prevent="savePrivacy">
        <label class="checkbox"><input v-model="hideSupport" type="checkbox" />{{ t('support.hideSupport') }}</label>
        <label class="checkbox"><input v-model="showBadge" type="checkbox" />{{ t('support.showBadge') }}</label>
        <button type="submit" :disabled="busy">{{ t('support.save') }}</button>
        <p v-if="saved" role="status">{{ t('support.saved') }}</p>
      </form>
      <h3 class="history-title">{{ t('support.history') }}</h3>
      <p class="hint">{{ t('support.pendingHint') }}</p>
      <p v-if="!account.orders.length">{{ t('support.noHistory') }}</p>
      <ul class="orders">
        <li v-for="order in account.orders" :key="order.id">
          <div>
            <strong>${{ order.amountUSD.toFixed(2) }}</strong> · {{ t(`support.${order.status}`)
            }}<small>{{ order.id }}</small>
          </div>
          <div class="order-actions">
            <a v-if="order.checkoutUrl" :href="order.checkoutUrl" target="_blank" rel="noopener noreferrer">{{
              t('support.resume')
            }}</a>
            <button v-if="order.status !== 'finished'" type="button" :disabled="busy" @click="refreshOrder(order.id)">
              {{ t('support.refresh') }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { supportRequest, SupportInfo, SupportAccount, SupportError } from '@/api/support';
const { t } = useI18n();
const store = useStore();
const info = ref<SupportInfo | null>(null);
const account = ref<SupportAccount | null>(null);
const amount = ref('10');
const currency = ref('');
const anonymous = ref(true);
const hideSupport = ref(false);
const showBadge = ref(true);
const loading = ref(false);
const busy = ref(false);
const saved = ref(false);
const error = ref('');
const minimumUSD = ref('');
const networks = ref<{ currency: string; available: boolean; minimumUSD?: number; minimumUSDT?: number }[]>([]);
const networkLoading = ref(false);
const selectedNetwork = computed(() => networks.value.find((n) => n.currency === currency.value));
async function loadNetworks() {
  networkLoading.value = true;
  try {
    const response = await supportRequest<{ networks: typeof networks.value }>('/networks');
    networks.value = response.networks;
  } catch {
    networks.value = [];
  } finally {
    networkLoading.value = false;
  }
}
let generation = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const networkName = (code: string) =>
  ({
    usdttrc20: 'USDT · TRON (TRC-20)',
    usdterc20: 'USDT · Ethereum (ERC-20)',
    usdtbsc: 'USDT · BNB Smart Chain',
    usdtton: 'USDT · TON',
    usdtsol: 'USDT · Solana',
  })[code] || code.toUpperCase();
function report(e: unknown) {
  minimumUSD.value = e instanceof SupportError ? e.minimumUSD?.toFixed(2) || '' : '';
  error.value =
    e instanceof Error &&
    ['authError', 'rateError', 'invoiceError', 'minimumError', 'awaitingNotification'].includes(e.message)
      ? e.message
      : 'error';
}
async function load(syncPrivacy = true) {
  const current = ++generation;
  loading.value = true;
  error.value = '';
  try {
    const [publicInfo, personal] = await Promise.all([
      supportRequest<SupportInfo>(),
      store.state.profile ? supportRequest<SupportAccount>('/me') : Promise.resolve(null),
    ]);
    if (current !== generation) return;
    info.value = publicInfo;
    if (syncPrivacy && publicInfo.enabled) void loadNetworks();
    account.value = personal;
    if (!publicInfo.currencies.includes(currency.value)) currency.value = publicInfo.currencies[0] || '';
    if (personal && syncPrivacy) {
      hideSupport.value = personal.hideSupport;
      showBadge.value = personal.showPremiumBadge;
    }
  } catch (e) {
    if (current === generation) report(e);
  } finally {
    if (current === generation) loading.value = false;
  }
}
async function checkout() {
  if (!/^\d+(\.\d{1,2})?$/.test(amount.value) || Number(amount.value) < 1 || Number(amount.value) > 10000) {
    error.value = 'invalidAmount';
    return;
  }
  if (!selectedNetwork.value?.available) return;
  if (Number(amount.value) < (selectedNetwork.value.minimumUSD || 1)) {
    minimumUSD.value = selectedNetwork.value.minimumUSD!.toFixed(2);
    error.value = 'minimumError';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const invoice = await supportRequest<{ url: string }>('/invoice', 'POST', {
      amountUSD: amount.value,
      currency: currency.value,
      anonymous: anonymous.value,
    });
    const url = new URL(invoice.url);
    if (url.protocol !== 'https:' || url.hostname !== 'nowpayments.io') throw new Error('invoiceError');
    window.location.assign(url.href);
  } catch (e) {
    report(e);
    if (e instanceof SupportError) void loadNetworks();
  } finally {
    busy.value = false;
  }
}
async function savePrivacy() {
  busy.value = true;
  saved.value = false;
  try {
    await supportRequest('/privacy', 'PATCH', { hideSupport: hideSupport.value, showPremiumBadge: showBadge.value });
    // Public profile cache may still contain the old visibility until refreshed.
    const id = store.state.profile?.id;
    if (id && store.state.users[id]?.status === 'ready') {
      store.commit('updateUsersState', {
        uuid: id,
        user: {
          status: 'ready',
          profile: { ...store.state.users[id].profile, premium: account.value?.premium && showBadge.value },
        },
      });
    }
    await load();
    saved.value = true;
  } catch (e) {
    report(e);
  } finally {
    busy.value = false;
  }
}
async function refreshOrder(id: string) {
  busy.value = true;
  try {
    await supportRequest(`/orders/${id}/refresh`, 'POST');
    await load(false);
  } catch (e) {
    report(e);
  } finally {
    busy.value = false;
  }
}
watch(
  () => store.state.profile?.token,
  () => {
    account.value = null;
    void load();
  },
);
onMounted(() => {
  void load();
  timer = setInterval(() => {
    if (
      !document.hidden &&
      !busy.value &&
      account.value?.orders.some((order) => ['waiting', 'confirming', 'confirmed', 'sending'].includes(order.status))
    )
      void load(false);
  }, 15000);
});
onUnmounted(() => {
  generation++;
  if (timer) clearInterval(timer);
});
</script>

<style scoped lang="scss">
.support-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 84px 20px 64px;
}
.support-hero {
  max-width: 760px;
  margin-bottom: 32px;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: #b38637;
  font-weight: 700;
}
h1 {
  font-size: clamp(30px, 5vw, 48px);
  line-height: 1.15;
  margin: 12px 0 18px;
}
h2 {
  font-size: 22px;
  margin-bottom: 14px;
}
h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
p {
  line-height: 1.65;
}
.intro {
  font-size: 18px;
  opacity: 0.8;
}
.premium-panel,
.support-panel {
  padding: 26px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 18px;
  background: rgba(var(--v-theme-inset), 0.4);
}
.premium-panel {
  border-color: #b3863760;
  background: linear-gradient(120deg, #b3863714, transparent);
}
.premium-mark {
  display: inline-block;
  background: #e7c675;
  color: #382a0c;
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}
.benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 26px;
}
.benefits p,
.hint {
  font-size: 13px;
  opacity: 0.75;
}
.support-columns {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 20px;
  margin: 24px 0;
}
label {
  display: block;
  font-size: 14px;
  margin: 16px 0 7px;
}
input[type='number'],
select {
  display: block;
  width: 100%;
  padding: 11px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
  border-radius: 8px;
  color: inherit;
  background: rgb(var(--v-theme-background));
}
.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.checkbox input {
  margin-top: 4px;
  accent-color: #a88032;
}
button {
  padding: 9px 13px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.2);
  border-radius: 8px;
}
button:disabled {
  opacity: 0.5;
  cursor: wait;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #b38637;
  outline-offset: 3px;
}
.primary {
  width: 100%;
  margin: 20px 0 12px;
  background: #e7c675;
  color: #382a0c;
  font-weight: 700;
}
.presets {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.presets button[aria-pressed='true'] {
  border-color: #b38637;
  background: #b3863720;
}
.donations,
.orders {
  list-style: none;
  padding: 0;
}
.donations li,
.orders li {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 15px 0;
  border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.1);
}
.donor {
  min-width: 0;
  overflow-wrap: anywhere;
}
small {
  display: block;
  opacity: 0.65;
  font-size: 11px;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.premium-state {
  font-weight: 700;
  margin: 8px 0 20px;
}
.history-title {
  margin-top: 30px;
}
.order-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  font-size: 12px;
}
.error {
  padding: 14px;
  border: 1px solid #c96b6b;
  border-radius: 8px;
  margin-top: 20px;
}
.notice {
  padding: 14px;
  background: #b3863715;
  border-radius: 8px;
}
@media (max-width: 700px) {
  .support-columns,
  .benefits {
    grid-template-columns: 1fr;
  }
  .support-page {
    padding: 76px 14px 32px;
  }
  .support-panel,
  .premium-panel {
    padding: 20px;
  }
  .orders li {
    flex-direction: column;
  }
}
</style>
