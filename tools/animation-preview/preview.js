const art = '/packages/ui/src/assets/images/roles/';
const icons = '/packages/ui/src/assets/icons/';
const variants = [
  {
    id: 'cut',
    group: 'lovers',
    name: 'Общий разрез',
    description:
      'Две карты раскрываются рядом. Один удар проходит через пару, и обе карты расходятся по линии разрыва.',
    steps: ['0,0 с · Пара карт на столе', '0,5 с · Одновременное раскрытие', '1,5 с · Один удар по двум картам'],
    duration: 3,
  },
  {
    id: 'bond',
    group: 'lovers',
    name: 'Разорванная связь',
    description: 'Розовая нить соединяет любовников. При попадании она рвётся, и карты отступают в разные стороны.',
    steps: ['0,0 с · Между картами возникает нить', '0,5 с · Раскрытие пары', '1,6 с · Связь разрывается'],
    duration: 3,
  },
  {
    id: 'rose',
    group: 'lovers',
    name: 'Увядшая роза',
    description: 'Роза между портретами теряет лепестки. Карты любовников темнеют и медленно опускаются на стол.',
    steps: ['0,0 с · Роза над закрытой парой', '0,5 с · Карты переворачиваются', '1,5 с · Лепестки осыпаются'],
    duration: 3.4,
  },
  {
    id: 'strikes',
    group: 'cleric',
    name: 'Два удара',
    description:
      'Сначала раскрывается и разрывается карта Клирика. Затем такой же удар получает вторая выбранная роль.',
    steps: ['0,4 с · Раскрытие Клирика', '1,2 с · Первый удар', '2,0 с · Раскрытие и удар по второй цели'],
    duration: 3.8,
  },
  {
    id: 'seal',
    group: 'cleric',
    name: 'Сломанная печать',
    description:
      'Золотая печать с крестом скрепляет две карты. После раскрытия целей печать раскалывается, карты теряют свет.',
    steps: ['0,4 с · Раскрытие Клирика', '1,4 с · Проверка второй цели', '2,3 с · Печать раскалывается'],
    duration: 3.6,
  },
  {
    id: 'verdict',
    group: 'cleric',
    name: 'Приговор',
    description:
      'На раскрытые карты по очереди ложится печать «Убит». При ошибке вторая карта получает отметку «Промах».',
    steps: ['0,4 с · Первая карта и первый приговор', '1,6 с · Вторая карта', '2,3 с · Второй приговор'],
    duration: 3.5,
  },
];
const stage = document.querySelector('#stage');
const outcome = document.querySelector('#outcome');
let selected = variants[0];
let animations = [];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const outcomes = {
  lovers: [
    ['hit', 'Оба угаданы'],
    ['second-miss', 'Один из пары не угадан'],
    ['first-miss', 'Оба не угаданы'],
  ],
  cleric: [
    ['hit', 'Клирик и вторая роль угаданы'],
    ['second-miss', 'Промах по второй роли'],
    ['first-miss', 'Промах по Клирику'],
  ],
};
const motion = (element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,.65,.3,1)') => {
  const factor = document.querySelector('#slow').checked ? 2 : 1;
  const animation = element.animate(frames, {
    duration: duration * factor,
    delay: delay * factor,
    fill: 'both',
    easing,
  });
  animations.push(animation);
  return animation;
};
function card(role, index) {
  const playerName = index === 0 ? 'Алексей' : 'Мария';
  const front = `<div class="face"><img src="${art}${role}.webp" alt=""><strong>${playerName}</strong></div>`;
  return `<div class="card-slot" data-index="${index}"><div class="turn"><div class="back">Avalon</div>${front}</div><div class="fragment left">${front}</div><div class="fragment right">${front}</div><div class="survived"></div></div>`;
}
function clear() {
  animations.forEach((a) => a.cancel());
  animations = [];
  document.querySelector('#play').textContent = '▶ Запустить сцену';
}
function setup() {
  clear();
  const result = outcome.value;
  const first =
    selected.group === 'lovers'
      ? result === 'first-miss'
        ? 'percival'
        : 'tristan'
      : result === 'first-miss'
        ? 'percival'
        : 'cleric';
  const second =
    selected.group === 'lovers'
      ? result === 'hit'
        ? 'isolde'
        : 'servant'
      : result === 'second-miss'
        ? 'percival'
        : 'servant';
  // A failed first Cleric attempt ends the assassination before a second target is chosen.
  const hasSecond = selected.group === 'lovers' || result !== 'first-miss';
  stage.innerHTML = card(first, 0) + (hasSecond ? card(second, 1) : '');
  if (!hasSecond) stage.querySelector('.card-slot').style.left = '116px';
  document.querySelector('#outcome-note').textContent =
    selected.group === 'lovers'
      ? 'Пара побеждена, только если угаданы оба любовника. При ошибке связь настоящей пары сохраняется.'
      : 'При промахе по Клирику покушение заканчивается сразу. Вторая цель появляется только после попадания по Клирику.';
}
function reveal(slot, delay) {
  const duration = 520;
  motion(
    slot.querySelector('.turn'),
    [
      { transform: 'scaleX(1)', easing: 'ease-in' },
      { offset: 0.5, transform: 'scaleX(0.04)', easing: 'ease-out' },
      { transform: 'scaleX(1)' },
    ],
    duration,
    delay,
    'linear',
  );
  motion(slot.querySelector('.back'), [{ opacity: 1 }, { opacity: 0 }], 1, delay + duration / 2);
  motion(slot.querySelector('.turn > .face'), [{ opacity: 0 }, { opacity: 1 }], 1, delay + duration / 2);
}
function protect(slot, delay) {
  motion(slot.querySelector('.survived'), [{ opacity: 0 }, { opacity: 1 }], 400, delay);
}
function tear(slot, delay) {
  motion(slot.querySelector('.turn'), [{ opacity: 1 }, { opacity: 0 }], 1, delay);
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ]) {
    motion(
      slot.querySelector(`.fragment.${side}`),
      [
        { opacity: 0, transform: 'translate(0,0) rotate(0deg)' },
        { offset: 0.01, opacity: 1, transform: 'translate(0,0) rotate(0deg)' },
        { opacity: 1, transform: `translate(${sign * 13}px,${sign < 0 ? 5 : 12}px) rotate(${sign * 9}deg)` },
      ],
      620,
      delay,
    );
  }
}
function add(markup) {
  stage.insertAdjacentHTML('beforeend', markup);
  return stage.lastElementChild;
}
function slash(delay, index) {
  const element = add('<div class="slash"></div>');
  if (index !== undefined) {
    element.style.width = '140px';
    element.style.left = `${index ? 199 : 23}px`;
  }
  motion(
    element,
    [
      { opacity: 0, transform: 'rotate(-14deg) scaleX(0)' },
      { offset: 0.4, opacity: 0.9, transform: 'rotate(-14deg) scaleX(1)' },
      { opacity: 0, transform: 'rotate(-14deg) scaleX(1)' },
    ],
    350,
    delay,
  );
}
function play() {
  setup();
  const hit = outcome.value === 'hit';
  const firstMiss = outcome.value === 'first-miss';
  const slots = [...stage.querySelectorAll('.card-slot')];
  const secondDelay = selected.group === 'cleric' ? 1550 : 450;
  slots.forEach((slot, i) => reveal(slot, i ? secondDelay : 350));
  if (selected.id === 'cut' || selected.id === 'strikes') {
    if (selected.id === 'cut') slash(1420);
    slots.forEach((slot, i) => {
      const successful = selected.group === 'lovers' ? hit : !firstMiss && (i === 0 || hit);
      const delay = selected.group === 'lovers' ? 1570 : i ? 2510 : 1230;
      if (selected.id === 'strikes') slash(delay - 100, slots.length === 1 ? undefined : i);
      if (successful) tear(slot, delay);
      else protect(slot, delay);
    });
  } else if (selected.id === 'bond') {
    const link = add('<div class="link"></div>');
    motion(
      link,
      [
        { opacity: 0, transform: 'scaleX(0)' },
        { opacity: 1, transform: 'scaleX(1)' },
      ],
      650,
      400,
    );
    if (hit) {
      motion(
        link,
        [
          { opacity: 1, transform: 'scaleX(1)' },
          { offset: 0.4, opacity: 1, transform: 'scaleX(.3)' },
          { opacity: 0, transform: 'scaleX(0)' },
        ],
        460,
        1580,
      );
      slots.forEach((slot, i) =>
        motion(
          slot,
          [
            { transform: `rotate(${i ? 5 : -5}deg)` },
            {
              transform: `translate(${i ? 22 : -22}px,14px) rotate(${i ? 13 : -13}deg)`,
              filter: 'brightness(.58) saturate(.4)',
            },
          ],
          850,
          1620,
        ),
      );
    } else {
      motion(link, [{ opacity: 1 }, { opacity: 0 }], 350, 1500);
      slots.forEach((slot) => protect(slot, 1680));
    }
  } else if (selected.id === 'rose') {
    const rose = add(`<img class="emblem" src="${icons}lovers_rose.webp" alt="">`);
    motion(
      rose,
      [
        { opacity: 0, transform: 'scale(.65)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      650,
      200,
    );
    if (hit) {
      motion(
        rose,
        [{ opacity: 1 }, { opacity: 0, transform: 'translateY(30px) scale(.7)', filter: 'grayscale(1)' }],
        1100,
        1500,
      );
      for (let i = 0; i < 10; i++) {
        const petal = add('<div class="particle"></div>');
        motion(
          petal,
          [
            { opacity: 0, transform: 'translate(0,0)' },
            { offset: 0.15, opacity: 0.8 },
            { opacity: 0, transform: `translate(${(i - 4.5) * 19}px,${75 + (i % 3) * 16}px) rotate(${i * 39}deg)` },
          ],
          1200,
          1550 + i * 40,
        );
      }
      slots.forEach((slot, i) =>
        motion(
          slot,
          [
            { transform: `rotate(${i ? 5 : -5}deg)`, filter: 'brightness(1)' },
            { transform: `translateY(15px) rotate(${i ? 8 : -8}deg)`, filter: 'brightness(.55) saturate(.2)' },
          ],
          1100,
          1650,
        ),
      );
    } else {
      slots.forEach((slot) => protect(slot, 1600));
    }
  } else if (selected.id === 'seal') {
    const seal = add(`<div class="seal"><img src="${icons}cleric_cross.webp" alt=""></div>`);
    motion(
      seal,
      [
        { opacity: 0, transform: 'scale(.6)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      500,
      200,
    );
    if (hit) {
      motion(
        seal,
        [
          { opacity: 1, transform: 'scale(1)' },
          { offset: 0.3, opacity: 1, transform: 'scale(1.12) rotate(8deg)' },
          { opacity: 0, transform: 'scale(1.5) rotate(20deg)' },
        ],
        650,
        2370,
      );
      for (let i = 0; i < 8; i++) {
        const shard = add('<div class="particle" style="background:#cfb974;border-radius:0"></div>');
        const angle = (i * Math.PI) / 4;
        motion(
          shard,
          [
            { opacity: 0 },
            { offset: 0.12, opacity: 1 },
            {
              opacity: 0,
              transform: `translate(${Math.cos(angle) * 90}px,${Math.sin(angle) * 70 + 20}px) rotate(${i * 50}deg)`,
            },
          ],
          850,
          2400,
        );
      }
      slots.forEach((slot, i) =>
        motion(
          slot,
          [
            { transform: `rotate(${i ? 5 : -5}deg)` },
            { filter: 'brightness(.5) saturate(.3)', transform: `translateY(12px) rotate(${i ? 9 : -9}deg)` },
          ],
          700,
          2450,
        ),
      );
    } else {
      motion(seal, [{ opacity: 1 }, { opacity: 0 }], 300, firstMiss ? 1200 : 2370);
      if (!firstMiss) tear(slots[0], 1250);
      protect(slots[firstMiss ? 0 : 1], firstMiss ? 1250 : 2400);
    }
  } else {
    slots.forEach((slot, i) => {
      const successful = !firstMiss && (i === 0 || hit);
      const stamp = add(`<div class="judgment${i ? ' second' : ''}">${successful ? 'Убит' : 'Промах'}</div>`);
      if (slots.length === 1) stamp.style.left = '131px';
      if (!successful) {
        stamp.style.background = '#274334eb';
        stamp.style.color = '#c5e8b8';
      }
      motion(
        stamp,
        [
          { opacity: 0, transform: 'scale(1.8) rotate(-12deg)' },
          { offset: 0.75, opacity: 1, transform: 'scale(.95) rotate(-12deg)' },
          { opacity: 1, transform: 'scale(1) rotate(-12deg)' },
        ],
        380,
        i ? 2400 : 1200,
      );
      if (!successful) protect(slot, i ? 2550 : 1350);
    });
  }
  document.querySelector('#play').textContent = '↻ Повторить сцену';
  if (reducedMotion.matches) animations.forEach((animation) => animation.finish());
}
function selectVariant(variant) {
  const oldGroup = selected.group;
  selected = variant;
  if (oldGroup !== selected.group || !outcome.options.length) {
    outcome.replaceChildren(...outcomes[selected.group].map(([value, label]) => new Option(label, value)));
  }
  document.querySelector('#selected-title').textContent = selected.name;
  document.querySelector('#selected-description').textContent = selected.description;
  document.querySelector('#sequence').replaceChildren(
    ...selected.steps.map((text) => {
      const item = document.createElement('span');
      item.textContent = text;
      return item;
    }),
  );
  document.querySelector('#scene-type').textContent = selected.group === 'lovers' ? 'Убийство любовников' : 'Клирик +1';
  document.querySelector('#duration').textContent = `≈ ${selected.duration.toLocaleString('ru')} секунды`;
  document.querySelectorAll('.option').forEach((button) => {
    const active = button.dataset.id === selected.id;
    button.setAttribute('aria-pressed', String(active));
    button.querySelector('.choice').textContent = active ? 'Выбран' : 'Смотреть';
  });
  setup();
}
for (const group of ['lovers', 'cleric']) {
  variants
    .filter((variant) => variant.group === group)
    .forEach((variant, i) => {
      const button = document.createElement('button');
      button.className = 'option';
      button.dataset.id = variant.id;
      button.innerHTML = `<span class="number">Вариант ${i + 1}</span><span class="choice"></span><strong>${variant.name}</strong><p>${variant.description}</p>`;
      button.addEventListener('click', () => {
        selectVariant(variant);
        play();
      });
      document.querySelector(`#${group}-options`).appendChild(button);
    });
}
document.querySelector('#play').addEventListener('click', play);
document.querySelector('#reset').addEventListener('click', setup);
outcome.addEventListener('change', play);
selectVariant(selected);
