<template>
  <section class="role-deal-scene" :data-phase="phase" :aria-label="t('roleDeal.yourRole')">
    <div ref="flights" class="role-deal-flights" aria-hidden="true"></div>
    <div
      v-show="['showcase', 'shuffling', 'dealing'].includes(phase)"
      ref="publicDeck"
      class="role-deal-pack"
      :class="{ 'role-deal-pack-closed': deckClosed }"
    >
      <div
        v-for="(deckRole, index) in deckRoles"
        :key="index"
        class="role-deal-pack-card"
        :data-deck-role="deckRole"
        :data-loyalty="rolesShortInfo[deckRole].loyalty"
        :style="deckPosition(index)"
      >
        <div class="role-deal-turn">
          <div class="avalon-cards-back role-deal-back role-deal-reverse" aria-hidden="true">
            <div class="avalon-cards-back-ornament"></div>
            <span>Avalon</span>
          </div>
          <div class="role-deal-face" :data-loyalty="rolesShortInfo[deckRole].loyalty">
            <div class="role-deal-art" :style="calculateRolePortraitStyle(deckRole)">
              <img :src="calculateRoleUrl(deckRole)" alt="" />
            </div>
            <img
              class="role-deal-seal"
              :src="teamImage(deckRole)"
              :alt="t('game.' + rolesShortInfo[deckRole].loyalty)"
            />
            <h2>{{ t('roles.' + deckRole) }}</h2>
          </div>
        </div>
      </div>
    </div>
    <div class="role-deal-content">
      <p class="role-deal-heading" role="status" aria-live="polite">
        {{
          t(
            phase === 'showcase'
              ? 'roleDeal.composition'
              : phase === 'shuffling'
                ? 'roleDeal.shuffling'
                : phase === 'dealing'
                  ? 'roleDeal.dealing'
                  : 'roleDeal.yourRole',
          )
        }}
      </p>
      <div v-show="!['showcase', 'shuffling', 'dealing'].includes(phase)" ref="card" class="role-deal-card">
        <div v-if="!revealed" class="avalon-cards-back role-deal-back" aria-hidden="true">
          <div class="avalon-cards-back-ornament"></div>
          <span>Avalon</span>
        </div>
        <div v-else class="role-deal-face" :data-loyalty="roleInfo.loyalty">
          <div class="role-deal-art" :style="calculateRolePortraitStyle(role)">
            <img :src="calculateRoleUrl(role)" alt="" />
          </div>
          <img class="role-deal-seal" :src="teamImage(role)" :alt="t('game.' + roleInfo.loyalty)" />
          <h2>{{ t('roles.' + role) }}</h2>
        </div>
      </div>
      <p v-if="phase === 'reading'" class="role-deal-description">{{ roleInfo.info }}</p>
      <v-btn v-if="phase === 'sealed'" ref="action" color="warning" @click="reveal">{{ t('roleDeal.reveal') }}</v-btn>
      <v-btn v-else-if="phase === 'reading'" ref="action" color="info" @click="finish">{{ t('roleDeal.ready') }}</v-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TVisibleRole } from '@avalon/types';
import { getImagePathByID } from '@/helpers/images';
import { calculateRoleUrl, calculateRolePortraitStyle } from '@/helpers/styles';
import { rolesShortInfo } from '@/components/view/information/const';

const props = defineProps<{
  board: HTMLElement;
  playerID: string;
  role: TVisibleRole;
  playerIds: string[];
  deckRoles: TVisibleRole[];
}>();
const emit = defineEmits<{ complete: [] }>();
const { t } = useI18n();
const phase = ref<'showcase' | 'shuffling' | 'dealing' | 'sealed' | 'opening' | 'reading' | 'returning'>('showcase');
const publicDeck = ref<HTMLElement>();
const deckClosed = ref(false);
const revealed = ref(false);
const flights = ref<HTMLElement>();
const card = ref<HTMLElement>();
const action = ref<{ $el: HTMLButtonElement }>();
const roleInfo = computed(() => rolesShortInfo[props.role]);
const animations = new Set<Animation>();
let generation = 0;
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function teamImage(role: TVisibleRole) {
  return getImagePathByID(
    'core',
    rolesShortInfo[role].loyalty === 'good' ? 'blue_team_no_background' : 'red_team_no_background',
  );
}

function cancel() {
  generation++;
  animations.forEach((animation) => animation.cancel());
  animations.clear();
  flights.value?.replaceChildren();
}
onUnmounted(cancel);

async function motion(
  element: Element,
  frames: Keyframe[],
  duration: number,
  delay = 0,
  easing = 'cubic-bezier(.23,1,.32,1)',
) {
  const animation = element.animate(reduce() ? frames.map((frame) => ({ opacity: frame.opacity ?? 1 })) : frames, {
    duration: reduce() && frames.some((frame) => frame.transform || frame.opacity !== 1) ? 150 : duration,
    delay: reduce() ? 0 : delay,
    easing,
    fill: 'both',
  });
  animations.add(animation);
  await animation.finished.catch(() => {});
}

function position(id: string) {
  const seat = Array.from(props.board.querySelectorAll<HTMLElement>('[data-player-id]')).find(
    (seat) => seat.dataset.playerId === id,
  );
  const portrait = seat?.querySelector('.player-frame')?.getBoundingClientRect();
  if (!portrait) return;
  const board = props.board.getBoundingClientRect();
  const scale = board.width / props.board.offsetWidth;
  return {
    x: (portrait.x + portrait.width / 2 - board.x) / scale,
    y: (portrait.y + portrait.height / 2 - board.y) / scale,
  };
}

async function focusAction() {
  await nextTick();
  action.value?.$el.focus({ preventScroll: true });
}

function deckPosition(index: number) {
  const columns = Math.min(5, props.deckRoles.length);
  const rows = Math.ceil(props.deckRoles.length / columns);
  const row = Math.floor(index / columns);
  const rowCount = Math.min(columns, props.deckRoles.length - row * columns);
  return {
    left: `${300 - (rowCount * 82 - 10) / 2 + (index % columns) * 82}px`,
    top: `${300 - (rows * 134 - 10) / 2 + row * 134}px`,
  };
}

async function prepareDeck(token: number) {
  if (!publicDeck.value) return;
  const cards = Array.from(publicDeck.value.children) as HTMLElement[];
  await motion(publicDeck.value, [{ opacity: 1 }, { opacity: 1 }], 2400);
  if (token !== generation) return;
  phase.value = 'shuffling';
  if (reduce()) {
    await motion(publicDeck.value, [{ opacity: 1 }, { opacity: 0 }], 150);
    if (token !== generation) return;
    deckClosed.value = true;
    await nextTick();
    if (token !== generation) return;
    await motion(publicDeck.value, [{ opacity: 0 }, { opacity: 1 }], 150);
  } else {
    await Promise.all(
      cards.map((element, index) =>
        motion(
          element.querySelector('.role-deal-turn')!,
          [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
          600,
          index * 45,
          'cubic-bezier(.77,0,.175,1)',
        ),
      ),
    );
  }
  if (token !== generation) return;
  const offsets = cards.map((element, index) => ({
    x: 264 - element.offsetLeft + index * 0.6,
    y: 238 - element.offsetTop + index * 0.6,
  }));
  await Promise.all(
    cards.map((element, index) =>
      motion(
        element,
        [
          { transform: 'translate(0,0)' },
          { transform: `translate(${offsets[index].x}px,${offsets[index].y}px) rotate(${index % 2 ? 3 : -3}deg)` },
        ],
        500,
        0,
        'cubic-bezier(.77,0,.175,1)',
      ),
    ),
  );
  if (token !== generation) return;
  for (let round = 0; round < 2; round++) {
    await Promise.all(
      cards.map((element, index) => {
        const { x, y } = offsets[index];
        element.style.zIndex = String(round ? cards.length - index : index);
        return motion(
          element,
          [
            { transform: `translate(${x}px,${y}px) rotate(0deg)` },
            {
              offset: 0.5,
              transform: `translate(${x + (index % 2 ? 64 : -64)}px,${y - 12}px) rotate(${index % 2 ? 12 : -12}deg)`,
            },
            { transform: `translate(${x}px,${y}px) rotate(${index % 2 ? -3 : 3}deg)` },
          ],
          1000,
          (index % 3) * 80,
          'cubic-bezier(.77,0,.175,1)',
        );
      }),
    );
    if (token !== generation) return;
  }
}

onMounted(async () => {
  const token = generation;
  const preload = new Image();
  preload.src = calculateRoleUrl(props.role);
  await nextTick();
  if (token !== generation) return;
  await prepareDeck(token);
  if (token !== generation) return;
  phase.value = 'dealing';
  if (!reduce()) {
    await Promise.all(
      props.playerIds.map(async (id, index) => {
        const target = position(id);
        if (!target || !flights.value) return;
        const traveller = document.createElement('div');
        traveller.className = 'role-deal-traveller avalon-cards-back';
        traveller.innerHTML = '<div class="avalon-cards-back-ornament"></div><span>Avalon</span>';
        traveller.style.zIndex = String(props.playerIds.length - index);
        const x = target.x - 300;
        const y = target.y - 300;
        const departure = index * 150;
        const sourceCard = publicDeck.value?.children[index];
        if (sourceCard) void motion(sourceCard, [{ opacity: 1 }, { opacity: 0 }], 80, departure);
        flights.value.append(traveller);
        await motion(
          traveller,
          [
            { transform: 'translate(0,0) rotate(3deg) scale(1)', opacity: 0 },
            { offset: 0.04, transform: 'translate(0,0) rotate(3deg) scale(1)', opacity: 1 },
            {
              offset: 0.5,
              transform: `translate(${x * 0.5}px,${y * 0.5 - 24}px) rotate(${x < 0 ? -6 : 6}deg) scale(.75)`,
              opacity: 1,
            },
            {
              transform: `translate(${x}px,${y}px) rotate(0deg) scale(.42)`,
              opacity: 1,
            },
          ],
          500,
          departure,
        );
        if (token !== generation) return;
        await motion(traveller, [{ opacity: 1 }, { opacity: 0 }], 160);
        traveller.remove();
      }),
    );
  }
  if (token !== generation) return;
  phase.value = 'sealed';
  await nextTick();
  if (token !== generation || !card.value) return;
  const own = position(props.playerID) ?? { x: 300, y: 570 };
  await motion(
    card.value,
    [
      { transform: `translate(${own.x - 300}px,${own.y - 265}px) scale(.4)`, opacity: 0 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
    ],
    250,
  );
  if (token === generation) await focusAction();
});

async function reveal() {
  if (phase.value !== 'sealed' || !card.value) return;
  const token = generation;
  phase.value = 'opening';
  await motion(card.value, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.04)' }], 150);
  if (token !== generation) return;
  revealed.value = true;
  await nextTick();
  if (token !== generation || !card.value) return;
  await motion(card.value, [{ transform: 'scaleX(.04)' }, { transform: 'scaleX(1)' }], 150);
  if (token !== generation) return;
  phase.value = 'reading';
  await focusAction();
}

async function finish() {
  if (phase.value !== 'reading' || !card.value) return;
  const token = generation;
  phase.value = 'returning';
  const own = position(props.playerID) ?? { x: 300, y: 570 };
  const bounds = card.value.getBoundingClientRect();
  const board = props.board.getBoundingClientRect();
  const scale = board.width / props.board.offsetWidth;
  const centerX = (bounds.x + bounds.width / 2 - board.x) / scale;
  const centerY = (bounds.y + bounds.height / 2 - board.y) / scale;
  await motion(
    card.value,
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      {
        transform: `translate(${own.x - centerX}px,${own.y - centerY}px) scale(.35)`,
        opacity: 0,
      },
    ],
    250,
  );
  if (token === generation) emit('complete');
}
</script>

<style scoped lang="scss">
.role-deal-scene {
  position: absolute;
  inset: 0;
  z-index: 6;
  color: #f3e7cf;
  font-family: Georgia, serif;
}
.role-deal-content {
  position: absolute;
  left: 140px;
  top: 100px;
  width: 320px;
  height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.role-deal-heading {
  font-size: 24px;
  line-height: 1.2;
  margin: 0;
  text-align: center;
  text-shadow: 0 2px 4px #000;
}
.role-deal-card {
  flex-shrink: 0;
  position: relative;
  width: 156px;
  height: 220px;
  border-radius: 8px;
  box-shadow: 0 8px 20px #0008;
}
.role-deal-back {
  width: 100%;
  height: 100%;
}
.role-deal-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(ellipse at 30% 20%, #fff7 0%, transparent 65%),
    radial-gradient(ellipse at 85% 95%, #aa86512b 0%, transparent 60%), #e9dfc7;
  border: 1px solid #a88e60;
  border-radius: 5px;
  overflow: hidden;
  text-align: center;
  color: #30291e;
  box-shadow:
    inset 0 0 12px #85643830,
    inset 0 0 0 2px #f5ecd4;
}
.role-deal-face::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid #aa8d5a70;
  border-radius: 2px;
  pointer-events: none;
}
.role-deal-art {
  position: relative;
  z-index: 1;
  width: calc(100% - 12px);
  height: 144px;
  margin-top: 6px;
  overflow: hidden;
  border: 1px solid #aa8d5a70;
  background: #191b1c;
}
.role-deal-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--role-image-position, 50% 0);
  transform: scale(var(--role-image-scale, 1));
  transform-origin: var(--role-image-position, 50% 0);
}
.role-deal-seal {
  position: absolute;
  right: -9px;
  bottom: -10px;
  width: 78px;
  height: 78px;
  object-fit: contain;
  transform: rotate(-15deg);
  mix-blend-mode: multiply;
  opacity: 0.32;
  pointer-events: none;
}
.role-deal-face[data-loyalty='evil'] .role-deal-seal {
  transform: rotate(8deg);
}
.role-deal-face h2 {
  position: absolute;
  bottom: 22px;
  z-index: 1;
  left: 12px;
  right: 12px;
  margin: 0;
  padding-top: 0;
  font-size: 22px;
  line-height: 1.1;
  font-weight: 600;
  overflow-wrap: normal;
}
.role-deal-description {
  padding: 10px 14px;
  margin: 0;
  width: 320px;
  font:
    16px/1.35 Arial,
    sans-serif;
  text-align: center;
  background: #16221fea;
  border-radius: 8px;
}
.role-deal-scene[data-phase='dealing'] .role-deal-content {
  top: 130px;
}
.role-deal-flights {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.role-deal-flights :deep(.role-deal-traveller) {
  position: absolute;
  left: 264px;
  top: 238px;
  width: 72px;
  height: 124px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px #0008;
}
.role-deal-flights :deep(.role-deal-traveller span) {
  font-size: 14px;
}
.role-deal-pack {
  position: absolute;
  inset: 0;
}
.role-deal-pack-card {
  position: absolute;
  width: 72px;
  height: 124px;
  border-radius: 6px;
  box-shadow: 0 4px 12px #0008;
  perspective: 600px;
}
.role-deal-turn {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}
.role-deal-turn > .role-deal-face,
.role-deal-turn > .role-deal-reverse {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.role-deal-reverse {
  transform: rotateY(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .role-deal-reverse {
    transform: none;
  }
  .role-deal-pack-closed .role-deal-face {
    display: none;
  }
}
.role-deal-pack-card .role-deal-art {
  width: calc(100% - 8px);
  height: 78px;
  margin-top: 4px;
}
.role-deal-pack-card .role-deal-seal {
  width: 46px;
  height: 46px;
  right: -6px;
  bottom: -6px;
}
.role-deal-pack-card .role-deal-face::after {
  inset: 4px;
}
.role-deal-pack-card .role-deal-face h2 {
  left: 3px;
  right: 3px;
  bottom: 13px;
  padding-top: 0;
  font-size: 12px;
}
.role-deal-pack-card .avalon-cards-back span {
  font-size: 14px;
}
.role-deal-scene[data-phase='showcase'] .role-deal-content,
.role-deal-scene[data-phase='shuffling'] .role-deal-content {
  top: 130px;
}
</style>
