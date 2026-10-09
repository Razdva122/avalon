const shield =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 20 6v6c0 5-8 9-8 9S4 17 4 12V6Z"/></svg>';
const blade =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 17 11-13 3-1-1 4-11 12M4 15l7 7M7 18l-4 4"/></svg>';
const check =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const mic =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v2a6 6 0 0 0 12 0v-2M12 19v3M9 22h6"/></svg>';
const flag =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V3m0 1c4-3 8 3 14 0v10c-6 3-10-3-14 0"/></svg>';
const names = ['Алексей', 'Мария', 'Дмитрий', 'Анна', 'Илья', 'Елена', 'Ольга', 'Михаил', 'Сергей', 'Наталья'];
let scene = 'combined',
  design = 'refined',
  count = 10,
  extras = 'normal',
  selection = [1],
  pulseStyle = 'combo',
  pulseSpeed = '3';
const scenarios = {
  select: {
    title: 'Выбор команды',
    instruction: 'Алексей собирает команду',
    action: 'Отправить команду',
    team: [],
    wait: [0],
    selected: [1, 3, 7, 9],
  },
  vote: {
    title: 'Голосование за команду',
    instruction: 'Ожидаем голоса игроков',
    action: 'Проголосовать',
    team: [0, 1, 3, 7],
    wait: [0, 2, 5, 9],
    selected: [],
  },
  mission: {
    title: 'Миссия',
    instruction: 'Ожидаем решения участников',
    action: 'Успех / Провал',
    team: [0, 1, 3, 7],
    wait: [0, 3, 7],
    selected: [],
  },
  combined: {
    title: 'Использование Экскалибура',
    instruction: 'Анна выбирает участника миссии',
    action: 'Подтвердить выбор',
    team: [0, 1, 3, 7],
    wait: [3],
    selected: [1],
  },
  loyalty: {
    title: 'Проверка лояльности',
    instruction: 'Елена проверяет Дмитрия',
    action: 'Подтвердить выбор',
    team: [],
    wait: [5],
    selected: [2],
  },
  votes: {
    title: 'Результат голосования',
    instruction: 'Команда одобрена',
    action: 'Продолжить',
    team: [0, 1, 3, 7],
    wait: [],
    selected: [],
    votes: true,
  },
  assassin: {
    title: 'Покушение',
    instruction: 'Илья выбирает цель',
    action: 'Подтвердить цель',
    team: [],
    wait: [4],
    selected: [2],
    killer: 4,
  },
};
const feature = (name, id, active = false, used = false) => ({
  name,
  src: `/packages/ui/src/assets/images/features/${id}.webp`,
  active,
  used,
});
const card = (name, id, active = false) => ({
  name,
  src: `/packages/ui/src/assets/icons/plot-cards/${id}.webp`,
  active,
});
function itemsFor(i) {
  if (extras === 'none') return [];
  const items =
    {
      0: [card('Веди к победе', 'leadToVictory')],
      1: [card('Засада', 'ambush', true), card('Иду на вы', 'charge'), card('Восстанови свою честь', 'restoreHonor')],
      3: [feature('Экскалибур', 'excalibur', scene === 'combined'), card('Король возвращается', 'kingReturns')],
      5: [feature('Леди озера', 'lady_of_lake', scene === 'loyalty'), card('Мы нашли тебя', 'weFoundYou')],
      7: [card('Покажи свою силу', 'showStrength'), card('Покажи свою природу', 'showNature')],
      8: [card('Ты ли это?', 'areYouTheOne')],
      9: [card('Восстанови свою честь', 'restoreHonor')],
    }[i] || [];
  if (extras === 'dense' && [1, 3, 5, 7].includes(i)) {
    const candidates = [
      card('Веди к победе', 'leadToVictory'),
      card('Иду на вы', 'charge'),
      card('Покажи свою природу', 'showNature'),
      card('Покажи свою силу', 'showStrength'),
      card('Король возвращается', 'kingReturns'),
    ];
    items.push(...candidates.filter((item) => !items.some((existing) => existing.src === item.src)).slice(0, 3));
  }
  return items;
}
function loyaltyFor(i) {
  return extras !== 'none' && [1, 2, 7].includes(i) ? (i === 2 ? 'red' : 'blue') : null;
}
function equipmentMarkup(i) {
  const items = itemsFor(i);
  return `<div class="equipment-tray">${items.map((item) => `<button type="button" class="equipment${item.active ? ' active' : ''}${item.used ? ' used' : ''}" data-equipment="${i}" title="${item.name}" aria-label="${names[i]}: ${item.name}${item.active ? ' — активен сейчас' : ''}"><img src="${item.src}" alt=""></button>`).join('')}</div>`;
}
function render() {
  const s = scenarios[scene];
  document.getElementById('board').className = 'board ' + (design === 'old' ? 'old' : 'new ' + design);
  document.getElementById('phase').textContent = s.title;
  document.getElementById('instruction').textContent = s.instruction;
  document.getElementById('game-action').textContent = s.action;
  document.getElementById('count-label').textContent = `${count} игроков`;
  document.getElementById('balance-label').innerHTML =
    count === 10
      ? '6 <span style="color:#fff">vs</span> <span style="color:#efaaa5">4</span>'
      : '4 <span style="color:#fff">vs</span> <span style="color:#efaaa5">3</span>';
  document.querySelectorAll('.mission').forEach((token, i) => {
    token.classList.toggle('done', i < (scene === 'assassin' ? 3 : 2));
    token.classList.toggle('active', i === (scene === 'assassin' ? 3 : 2));
    token.textContent = i < (scene === 'assassin' ? 3 : 2) ? '✓' : String(i + 1);
  });
  document
    .querySelectorAll('[data-scene]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === scene)));
  document.getElementById('players').innerHTML = names
    .slice(0, count)
    .map((name, i) => {
      const angle = (i * 2 * Math.PI) / count + Math.PI / 2;
      const sent = s.team.includes(i),
        wait = s.wait.includes(i),
        selected = selection.includes(i),
        killer = s.killer === i,
        loyalty = loyaltyFor(i);
      const teamLabel = ['vote', 'votes'].includes(scene) ? 'В команде' : 'На миссии';
      const state = [
        selected ? 'выбран' : '',
        sent ? teamLabel : '',
        wait ? 'ожидание действия' : '',
        killer ? 'убийца' : '',
      ]
        .filter(Boolean)
        .join(', ');
      return `<div class="seat ${selected ? 'selected ' : ''}${sent ? 'sent ' : ''}${wait ? 'wait ' : ''}${killer ? 'killer' : ''}" style="left:${420 + 310 * Math.cos(angle)}px;top:${420 + 310 * Math.sin(angle)}px"><button class="player" data-player="${i}" type="button" aria-pressed="${selected}" aria-label="${name}: ${state || 'без активного состояния'}. Изменить выбор"><span class="portrait"><span class="pulse-aura" aria-hidden="true"></span><img class="frame" src="/packages/ui/src/assets/images/core/player-frame.webp" alt=""><span class="role"></span>${sent ? `<span class="mission-arc" aria-hidden="true"></span><span class="badge mission-flag" role="img" aria-label="${teamLabel}" title="${teamLabel}">${flag}</span>` : ''}<span class="ring"></span><span class="mission-ring" aria-hidden="true"></span>${killer ? `<span class="badge killer-badge">${blade}</span>` : ''}<span class="badge check-badge">${check}</span>${i === 0 && scene !== 'assassin' ? '<img class="crown" src="/packages/ui/src/assets/images/core/crown.webp" alt="Лидер">' : ''}${s.votes ? `<span class="vote-mark ${[2, 6, 8].includes(i) ? 'reject' : ''}">${[2, 6, 8].includes(i) ? '×' : '✓'}</span>` : ''}</span><span class="name">${wait ? '<span class="dot"></span>' : ''}<span class="name-text">${name}</span></span></button>${equipmentMarkup(i, loyalty)}${loyalty ? `<span class="loyalty" role="img" aria-label="${name}: объявленная лояльность — ${loyalty === 'blue' ? 'добро' : 'зло'}"><img src="/packages/ui/src/assets/images/core/${loyalty}_team_no_background.webp" alt=""></span>` : ''}${extras !== 'none' && [0, 6].includes(i) ? `<span class="voice ${Math.sin((i * 2 * Math.PI) / count + Math.PI) > 0.75 ? 'left' : ''}" role="img" aria-label="${name}: говорит">${mic}</span>` : ''}</div>`;
    })
    .join('');
  document.getElementById('legend').innerHTML =
    `<span class="gold">${check}Жёлтое кольцо и галочка — выбран</span><span class="mission-legend">${flag}Верхняя дуга и флаг — участник команды / миссии</span><span class="blue">Синяя пульсация — ожидаем действие</span><span class="red">${blade}Красная пульсация и кинжал — убийца</span>`;
  applyPulse();
  document.querySelectorAll('[data-player]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.player);
      selection = selection.includes(i) ? selection.filter((n) => n !== i) : [...selection, i];
      document.getElementById('feedback').textContent =
        names[i] + ': ' + (selection.includes(i) ? 'выбран' : 'выбор снят');
      render();
    }),
  );
  document.querySelectorAll('[data-equipment]').forEach((b) =>
    b.addEventListener('click', () => {
      document.getElementById('feedback').textContent = b.getAttribute('aria-label');
    }),
  );
}
document.querySelectorAll('[data-scene]').forEach((b) =>
  b.addEventListener('click', () => {
    scene = b.dataset.scene;
    selection = scenarios[scene].selected.filter((i) => i < count);
    document.getElementById('feedback').textContent = '';
    render();
  }),
);
function applyPulse() {
  const board = document.getElementById('board');
  board.dataset.pulse = pulseStyle;
  board.style.setProperty('--pulse-duration', pulseSpeed + 's');
}
document.getElementById('pulse-style').addEventListener('change', (e) => {
  pulseStyle = e.target.value;
  applyPulse();
});
document.getElementById('pulse-speed').addEventListener('change', (e) => {
  pulseSpeed = e.target.value;
  applyPulse();
});
document.getElementById('seat-count').addEventListener('change', (e) => {
  count = Number(e.target.value);
  selection = scenarios[scene].selected.filter((i) => i < count);
  render();
});
document.getElementById('extras').addEventListener('change', (e) => {
  extras = e.target.value;
  render();
});
document.getElementById('pause').addEventListener('click', (e) => {
  const stopped = document.body.classList.toggle('paused');
  e.currentTarget.textContent = stopped ? 'Включить пульсацию' : 'Остановить пульсацию';
  e.currentTarget.setAttribute('aria-pressed', String(stopped));
});
document
  .getElementById('game-action')
  .addEventListener(
    'click',
    () => (document.getElementById('feedback').textContent = 'Это превью: действие в партию не отправляется.'),
  );
new ResizeObserver(() => {
  const v = document.querySelector('.viewport');
  const scale = Math.min(1, v.clientWidth / 840);
  document.getElementById('board').style.transform = `scale(${scale})`;
  v.style.height = `${840 * scale}px`;
}).observe(document.querySelector('.viewport'));
render();
