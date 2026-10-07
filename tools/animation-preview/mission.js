const variants = [
  {
    id: 'fan',
    name: 'Веер решений',
    description:
      'Карты выходят из общей стопки, раскладываются веером и открываются по очереди. Затем знак результата занимает место на шкале миссий.',
    steps: [
      '0,0 с · Стопка раскладывается веером',
      '0,6 с · Последовательное раскрытие',
      '2,6 с · Итог переходит на шкалу',
    ],
    duration: 3.8,
  },
  {
    id: 'last',
    name: 'Последняя карта',
    description:
      'Сначала раскрываются остальные решения. Последняя карта остаётся закрытой чуть дольше, затем открывается и завершает подсчёт.',
    steps: ['0,0 с · Карты ложатся на стол', '0,5 с · Открываются первые карты', '2,0 с · Последняя карта и итог'],
    duration: 4,
  },
  {
    id: 'seal',
    name: 'Печать похода',
    description:
      'Карты раскрываются вместе. На них ложится печать «Успех» или «Провал», после чего стопка уступает место знаку результата.',
    steps: ['0,0 с · Одновременное раскрытие', '1,2 с · Печать на картах', '2,0 с · Стопка и знак результата'],
    duration: 3.4,
  },
];
const outcomes = {
  hidden: { label: 'Скрыто ведьмой · исход неизвестен', hidden: true, required: 1 },
  success: { label: 'Успех · 0 карт провала', fails: 0, required: 1 },
  fail: { label: 'Провал · 1 карта провала', fails: 1, required: 1 },
  double: { label: 'Провал · 2 карты провала', fails: 2, required: 2 },
  resilient: { label: 'Успех · 1 из 2 нужных провалов', fails: 1, required: 2 },
};
const stage = document.querySelector('#stage');
const outcome = document.querySelector('#outcome');
const team = document.querySelector('#team-size');
const track = document.querySelector('#mission-track');
let selected = variants[0];
let animations = [];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const witchArt = '/packages/ui/src/assets/images/roles/witch.webp';
const teamArt = (success) => `/packages/ui/src/assets/images/core/${success ? 'blue' : 'red'}_team_no_background.webp`;
const motion = (element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,.65,.3,1)', fill = 'both') => {
  const factor = document.querySelector('#slow').checked ? 2 : 1;
  const animation = element.animate(frames, { duration: duration * factor, delay: delay * factor, fill, easing });
  animations.push(animation);
};
function setup() {
  animations.forEach((animation) => animation.cancel());
  animations = [];
  const config = outcomes[outcome.value];
  for (const option of team.options) option.disabled = config.required === 2 && Number(option.value) < 4;
  if (config.required === 2 && Number(team.value) < 4) team.value = '4';
  const count = Number(team.value);
  const mission = config.required === 2 ? 3 : 1;
  stage.classList.toggle('witch-hidden', Boolean(config.hidden));
  document.querySelector('#scene-type').textContent = config.hidden ? 'Поход скрыт ведьмой' : 'Результат миссии';
  document.querySelector('#selected-title').textContent = config.hidden ? 'Веер под чарами' : selected.name;
  document.querySelector('#selected-description').textContent = config.hidden
    ? 'Закрытые карты раскладываются веером. Чары проходят по рубашкам, затем знак ведьмы занимает место на шкале. Решения участников и исход похода остаются тайной.'
    : selected.description;
  document.querySelector('#duration').textContent = config.hidden
    ? '≈ 2,8 секунды'
    : `≈ ${selected.duration.toLocaleString('ru')} секунды`;
  document.querySelector('#sequence').replaceChildren(
    ...(config.hidden
      ? ['0,0 с · Веер закрытых карт', '0,8 с · Чары скрывают решения', '2,0 с · Знак ведьмы на шкале']
      : selected.steps
    ).map((text) => {
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    }),
  );
  track.innerHTML = Array.from(
    { length: 5 },
    (_, i) =>
      `<div class="mission-token${i === mission ? ' active' : ''}" aria-label="Миссия ${i + 1}${i === mission ? ', ожидает результата' : ''}">${i < mission ? `<img src="${teamArt(i !== 1)}" alt="${i !== 1 ? 'Успех' : 'Провал'}">` : i + 1}</div>`,
  ).join('');
  // No player identifiers: order is presentation only, never ownership.
  stage.innerHTML = Array.from({ length: count }, (_, i) => {
    if (config.hidden)
      return `<div class="mission-card" style="left:${(360 - count * 74 - (count - 1) * 6) / 2 + i * 80}px;--angle:${(i - (count - 1) / 2) * 3}deg"><div class="turn"><div class="back">Avalon</div></div><div class="mission-rim"></div></div>`;
    const bad = i >= count - config.fails;
    return `<div class="mission-card${bad ? ' bad' : ''}" style="left:${(360 - count * 74 - (count - 1) * 6) / 2 + i * 80}px;--angle:${(i - (count - 1) / 2) * 3}deg"><div class="turn"><div class="back">Avalon</div><div class="face"><img src="${teamArt(!bad)}" alt=""><strong>${bad ? 'Провал' : 'Успех'}</strong></div></div><div class="mission-rim"></div></div>`;
  }).join('');
  const success = !config.hidden && config.fails < config.required;
  const resultArt = config.hidden ? witchArt : teamArt(success);
  const resultLabel = config.hidden ? 'Скрыто ведьмой' : success ? 'Успех' : 'Провал';
  stage.insertAdjacentHTML(
    'beforeend',
    `<div class="mission-badge"><img src="${resultArt}" alt="${resultLabel}"></div><div class="mission-seal${success ? '' : ' bad'}">${config.hidden ? '' : success ? 'Успех' : 'Провал'}</div>`,
  );
  document.querySelector('#outcome-note').textContent = config.hidden
    ? `Миссия ${mission + 1}. Ведьма скрыла результат. Карты успеха и провала не раскрываются.`
    : `Миссия ${mission + 1}. Для провала ${config.required === 2 ? 'нужны 2 карты' : 'нужна 1 карта'}. Карт провала: ${config.fails} из ${count}.`;
  document.querySelector('#play').textContent = '▶ Запустить сцену';
  return { config, count, mission, success, resultArt, resultLabel };
}
function flip(card, delay) {
  motion(
    card.querySelector('.turn'),
    [
      { transform: 'scaleX(1)', easing: 'ease-in' },
      { offset: 0.5, transform: 'scaleX(.04)', easing: 'ease-out' },
      { transform: 'scaleX(1)' },
    ],
    480,
    delay,
    'linear',
  );
  motion(card.querySelector('.back'), [{ opacity: 1 }, { opacity: 0 }], 1, delay + 240);
  motion(card.querySelector('.face'), [{ opacity: 0 }, { opacity: 1 }], 1, delay + 240);
}
function play() {
  const { config, count, mission, success, resultArt, resultLabel } = setup();
  const cards = [...stage.querySelectorAll('.mission-card')];
  const badge = stage.querySelector('.mission-badge');
  let resultAt;
  if (config.hidden) {
    cards.forEach((card, i) => {
      const x = Number.parseFloat(card.style.left);
      motion(
        card,
        [
          { transform: `translate(${143 - x}px,14px) rotate(${(i - 1) * 2}deg)` },
          { transform: `rotate(${(i - (count - 1) / 2) * 3}deg)` },
        ],
        500,
        i * 70,
      );
      motion(
        card.querySelector('.mission-rim'),
        [{ opacity: 0 }, { offset: 0.45, opacity: 1 }, { opacity: 0.25 }],
        650,
        760 + i * 110,
      );
    });
    resultAt = 1550;
  } else if (selected.id === 'fan') {
    cards.forEach((card, i) => {
      const x = Number.parseFloat(card.style.left);
      const angle = (i - (count - 1) / 2) * 3;
      motion(
        card,
        [
          { transform: `translate(${143 - x}px,14px) rotate(${(i - 1) * 2}deg)` },
          { transform: `translate(0,0) rotate(${angle}deg)` },
        ],
        500,
        i * 70,
      );
      flip(card, 620 + i * 260);
    });
    resultAt = 620 + (count - 1) * 260 + 620;
    cards
      .filter((card) => card.classList.contains('bad'))
      .forEach((card) =>
        motion(card.querySelector('.mission-rim'), [{ opacity: 0 }, { opacity: 1 }], 300, resultAt - 160),
      );
  } else if (selected.id === 'last') {
    cards.forEach((card, i) => {
      if (i === count - 1) {
        motion(
          card,
          [
            { transform: `translateY(0) rotate(${(i - (count - 1) / 2) * 3}deg)` },
            { transform: 'translateY(-10px) rotate(0deg)' },
          ],
          300,
          1600,
        );
        flip(card, 2000);
        motion(card.querySelector('.mission-rim'), [{ opacity: 0 }, { opacity: 1 }], 350, 2380);
      } else flip(card, 430 + i * 180);
    });
    resultAt = 2730;
  } else {
    cards.forEach((card) => flip(card, 350));
    motion(
      stage.querySelector('.mission-seal'),
      [
        { opacity: 0, transform: 'scale(1.65) rotate(-11deg)' },
        { offset: 0.78, opacity: 1, transform: 'scale(.96) rotate(-11deg)' },
        { opacity: 1, transform: 'scale(1) rotate(-11deg)' },
      ],
      380,
      1190,
    );
    cards.forEach((card, i) => {
      const x = Number.parseFloat(card.style.left);
      motion(
        card,
        [
          { transform: `translate(0,0) rotate(${(i - (count - 1) / 2) * 3}deg)` },
          { transform: `translate(${143 - x}px,0) rotate(${(i - 1) * 2}deg)` },
        ],
        500,
        1800,
      );
      motion(card, [{ opacity: 1 }, { opacity: 0 }], 250, 2260);
    });
    motion(stage.querySelector('.mission-seal'), [{ opacity: 1 }, { opacity: 0 }], 250, 2260, undefined, 'forwards');
    resultAt = 2390;
  }
  if (config.hidden || selected.id !== 'seal')
    cards.forEach((card) => motion(card, [{ opacity: 1 }, { opacity: 0.7 }], 350, resultAt));
  // Badge lands on the current mission token in stage-local coordinates.
  const token = track.children[mission];
  const stageRect = stage.getBoundingClientRect();
  const tokenRect = token.getBoundingClientRect();
  const unit = stageRect.width / 360;
  const x = (tokenRect.x + tokenRect.width / 2 - stageRect.x) / unit - 180;
  const y = (tokenRect.y + tokenRect.height / 2 - stageRect.y) / unit - 90;
  const tokenScale = tokenRect.width / unit / 80;
  motion(
    badge,
    [
      { opacity: 0, transform: 'scale(.6)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    340,
    resultAt,
  );
  motion(
    badge,
    [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${x}px,${y}px) scale(${tokenScale})` }],
    650,
    resultAt + 440,
  );
  motion(
    token,
    [
      { boxShadow: '0 0 0 3px #c7ae6233' },
      { boxShadow: `0 0 0 3px ${config.hidden ? '#b59acb' : success ? '#82b3c8' : '#bd7c6e'}99` },
    ],
    250,
    resultAt + 1000,
  );
  token.setAttribute('aria-label', `Миссия ${mission + 1}: ${resultLabel}`);
  token.insertAdjacentHTML('beforeend', `<img src="${resultArt}" alt="${resultLabel}">`);
  motion(token.querySelector('img'), [{ opacity: 0 }, { opacity: 1 }], 160, resultAt + 1010);
  motion(badge, [{ opacity: 1 }, { opacity: 0 }], 160, resultAt + 1010, undefined, 'forwards');
  motion(token, [{ color: '#c7baa0' }, { color: 'transparent' }], 1, resultAt + 1090);
  document.querySelector('#play').textContent = '↻ Повторить сцену';
  if (reducedMotion.matches) animations.forEach((animation) => animation.finish());
}
function choose(variant) {
  selected = variant;
  document.querySelector('#selected-title').textContent = variant.name;
  document.querySelector('#selected-description').textContent = variant.description;
  document.querySelector('#duration').textContent = `≈ ${variant.duration.toLocaleString('ru')} секунды`;
  document.querySelector('#sequence').replaceChildren(
    ...variant.steps.map((text) => {
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    }),
  );
  document.querySelectorAll('.option').forEach((button) => {
    const active = button.dataset.id === variant.id;
    button.setAttribute('aria-pressed', String(active));
    button.querySelector('.choice').textContent = active ? 'Выбран' : 'Смотреть';
  });
  setup();
}
for (const [value, config] of Object.entries(outcomes)) outcome.add(new Option(config.label, value));
outcome.value = 'success';
for (const [i, variant] of variants.entries()) {
  const button = document.createElement('button');
  button.className = 'option';
  button.dataset.id = variant.id;
  button.innerHTML = `<span class="number">Вариант ${i + 1}</span><span class="choice"></span><strong>${variant.name}</strong><p>${variant.description}</p>`;
  button.addEventListener('click', () => {
    choose(variant);
    play();
  });
  document.querySelector('#mission-options').appendChild(button);
}
document.querySelector('#play').addEventListener('click', play);
document.querySelector('#reset').addEventListener('click', setup);
outcome.addEventListener('change', play);
team.addEventListener('change', play);
choose(selected);
