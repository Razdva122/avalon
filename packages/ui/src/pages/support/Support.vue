<template>
  <main class="support-page">
    <header class="support-hero">
      <p class="eyebrow">{{ t('support.eyebrow') }}</p>
      <h1>{{ t('support.title') }}</h1>
      <p class="intro">{{ t('support.intro') }}</p>
    </header>
    <SupportBenefits :active="account?.premium === true" />
    <p v-if="error" class="error" role="alert">
      {{ t(`support.${error}`) }}
      <button type="button" @click="load()">{{ t('support.retry') }}</button>
    </p>
    <div class="support-columns">
      <section id="support-checkout" class="support-panel" tabindex="-1">
        <h2>{{ t('support.checkout') }}</h2>
        <p v-if="!info && loading" role="status">{{ t('support.refreshing') }}</p>
        <p v-else-if="info && !info.enabled" class="notice">{{ t('support.unavailable') }}</p>
        <p v-else-if="info && !store.state.profile" class="notice">{{ t('support.login') }}</p>
        <form v-else-if="info?.enabled" @submit.prevent="checkout">
          <label for="support-network">{{ t('support.network') }}</label>
          <div class="network-select">
            <NetworkIcon v-if="selectedNetwork" :network="selectedNetwork.id" />
            <select id="support-network" v-model="network" :disabled="busy" required>
              <option v-if="network && !selectedNetwork" :value="network" disabled>
                {{ networkLabel(network) }} — {{ t('support.unavailable') }}
              </option>
              <option v-for="item in info.networks" :key="item.id" :value="item.id">{{ item.label }}</option>
            </select>
          </div>
          <p v-if="network && !selectedNetwork" class="notice" role="status">{{ t('support.unavailable') }}</p>
          <template v-if="selectedNetwork">
            <label for="support-address">{{ t('support.recipient') }}</label>
            <div class="recipient-address">
              <textarea
                id="support-address"
                :value="selectedNetwork.address"
                readonly
                :rows="selectedNetwork.id === 'btc' ? 3 : 2"
              />
            </div>
            <div class="address-actions">
              <button type="button" @click="copyAddress">{{ t(copied ? 'support.copied' : 'support.copy') }}</button>
              <button type="button" :aria-expanded="showQR" aria-controls="support-qr" @click="showQR = !showQR">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM21 12v3M12 3v3M12 12h3M3 12h3M12 18v3"
                  />
                </svg>
                {{ t(showQR ? 'support.hideQR' : 'support.showQR') }}
              </button>
            </div>
            <WalletQR v-if="showQR" id="support-qr" :address="selectedNetwork.address" :label="selectedNetwork.label" />
            <p v-if="copyFailed" class="hint" role="status">{{ t('support.copyFailed') }}</p>
            <p class="hint">{{ t('support.paymentHint') }}</p>
            <p v-if="selectedNetwork.contract" class="hint token-contract">
              {{ t('support.tokenContract') }}: {{ selectedNetwork.contract }}
            </p>
            <p class="hint">{{ t(network === 'btc' ? 'support.btcConfirmation' : 'support.tokenConfirmation') }}</p>
          </template>
          <label for="support-txid">{{ t('support.txid') }}</label>
          <input
            id="support-txid"
            v-model="txid"
            type="text"
            maxlength="66"
            autocomplete="off"
            spellcheck="false"
            :disabled="busy"
            aria-describedby="support-txid-help"
            required
          />
          <p id="support-txid-help" class="hint">{{ t('support.txidHint') }}</p>
          <label class="checkbox"><input v-model="anonymous" type="checkbox" />{{ t('support.anonymous') }}</label>
          <p class="hint">{{ t('support.anonymousHint') }}</p>
          <button
            class="primary"
            type="submit"
            :disabled="busy || loading || !account || !selectedNetwork || !isSupportTxid(network, txid)"
          >
            {{ t(busy ? 'support.refreshing' : 'support.pay') }}
          </button>
          <p v-if="formError" class="error" role="alert">{{ t(`support.${formError}`) }}</p>
          <p v-if="submissionStatus" class="notice" role="status">
            {{ t('support.claimSaved') }} {{ t(`support.${submissionStatus}`) }}
          </p>
        </form>
      </section>
      <section class="support-panel">
        <h2>{{ t('support.recent') }}</h2>
        <p v-if="info && !info.donations.length" class="hint">{{ t('support.empty') }}</p>
        <ol class="donations">
          <li v-for="donation in info?.donations || []" :key="donation.id">
            <div class="donor">
              <router-link
                v-if="donation.userID && donation.name"
                class="donor-account"
                :to="{ name: 'user_stats', params: { uuid: donation.userID } }"
              >
                <Avatar class="donor-avatar" :avatarID="donation.avatar || 'servant'" alt="" />
                <span class="donor-name">{{ donation.name }}</span>
              </router-link>
              <span v-else>{{ t('support.anonymousName') }}</span>
              <small>{{ donation.date }}</small>
            </div>
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
            <strong v-if="order.status === 'finished'">${{ order.amountUSD.toFixed(2) }}</strong>
            <span v-if="order.amountCrypto"> · {{ order.amountCrypto }} {{ order.asset }}</span>
            <span> · {{ t(`support.${order.status}`) }}</span>
            <small>{{ networkLabel(order.network) }}</small>
            <small v-if="order.txid">Txid: {{ order.txid }}</small>
            <small>{{ order.id }}</small>
          </div>
          <div class="order-actions">
            <button
              v-if="!['finished', 'duplicate'].includes(order.status)"
              type="button"
              :disabled="busy"
              @click="refreshOrder(order.id)"
            >
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
import Avatar from '@/components/user/Avatar.vue';
import SupportBenefits from './SupportBenefits.vue';
import NetworkIcon from './NetworkIcon.vue';
import WalletQR from './WalletQR.vue';
import { isSupportTxid } from './checkout';
import { supportRequest, SupportInfo, SupportAccount, SupportPayment } from '@/api/support';
const { t } = useI18n();
const store = useStore();
const info = ref<SupportInfo | null>(null);
const account = ref<SupportAccount | null>(null);
const network = ref('');
const txid = ref('');
const copied = ref(false);
const showQR = ref(false);
const copyFailed = ref(false);
const formError = ref('');
const submissionStatus = ref('');
const selectedNetwork = computed(() => info.value?.networks.find((n) => n.id === network.value));
function networkLabel(id?: string) {
  return (
    (
      {
        btc: 'Bitcoin',
        tron: 'USDT · TRON (TRC20)',
        eth: 'USDT · Ethereum (ERC20)',
        bsc: 'Binance-Peg USDT · BNB Smart Chain (BEP20)',
      } as Record<string, string>
    )[id || ''] || ''
  );
}
async function copyAddress() {
  copyFailed.value = false;
  try {
    await navigator.clipboard.writeText(selectedNetwork.value!.address);
    copied.value = true;
  } catch {
    copyFailed.value = true;
  }
}
watch(network, () => {
  copied.value = false;
  copyFailed.value = false;
  formError.value = '';
  submissionStatus.value = '';
});
const anonymous = ref(true);
const hideSupport = ref(false);
const showBadge = ref(true);
const loading = ref(false);
const busy = ref(false);
const saved = ref(false);
const error = ref('');
let generation = 0;
let timer: ReturnType<typeof setInterval> | undefined;
function report(e: unknown) {
  error.value =
    e instanceof Error && ['authError', 'rateError', 'alreadyClaimed', 'invalidTxid', 'unavailable'].includes(e.message)
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
    if (!network.value) network.value = publicInfo.networks[0]?.id || '';
    account.value = personal;
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
  if (!selectedNetwork.value || !isSupportTxid(network.value, txid.value)) {
    formError.value = 'invalidTxid';
    return;
  }
  busy.value = true;
  formError.value = '';
  submissionStatus.value = '';
  try {
    const payment = await supportRequest<SupportPayment>('/transfers', 'POST', {
      network: network.value,
      txid: txid.value.trim(),
      anonymous: anonymous.value,
    });
    submissionStatus.value = payment.status;
    await load(false);
  } catch (e) {
    report(e);
    formError.value = error.value;
    error.value = '';
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
      account.value?.orders.some((order) => ['waiting', 'confirming', 'provider_unavailable'].includes(order.status))
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
.support-panel {
  padding: 26px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 18px;
  background: rgba(var(--v-theme-inset), 0.4);
}
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
#support-checkout {
  scroll-margin-top: 80px;
}
label {
  display: block;
  font-size: 14px;
  margin: 16px 0 7px;
}
input[type='text'],
textarea,
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
  cursor: not-allowed;
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
.network-select {
  display: flex;
  align-items: center;
  gap: 10px;
}
.network-select select {
  min-width: 0;
}
.address-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.address-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.recipient-address {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.recipient-address textarea {
  resize: none;
  min-width: 0;
  font-family: monospace;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.recipient-address button {
  flex-shrink: 0;
  align-self: center;
}
@media (max-width: 700px) {
  .recipient-address {
    flex-direction: column;
  }
  .recipient-address button {
    align-self: flex-start;
  }
}
.token-contract {
  overflow-wrap: anywhere;
}
.support-panel {
  min-width: 0;
}
.orders li > div {
  min-width: 0;
}
button {
  min-height: 44px;
}
textarea:focus-visible {
  outline: 2px solid #b38637;
  outline-offset: 3px;
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
.donor-account {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}
.donor-account:hover .donor-name {
  text-decoration: underline;
}
.donor-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
}
.donor-name {
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: 500;
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
  .support-columns {
    grid-template-columns: 1fr;
  }
  .support-page {
    padding: 76px 14px 32px;
  }
  .support-panel {
    padding: 20px;
  }
  .orders li {
    flex-direction: column;
  }
}
</style>
