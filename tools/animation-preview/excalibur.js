const stage = document.querySelector('#stage');
const outcome = document.querySelector('#outcome');
const world = document.querySelector('.native-board');
const viewport = document.querySelector('.native-viewport');
let animations = [];
const motion = (element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,.65,.3,1)') => {
  const factor = document.querySelector('#slow').checked ? 2 : 1;
  animations.push(
    element.animate(frames, { duration: duration * factor, delay: delay * factor, easing, fill: 'both' }),
  );
};
const people = [
  ['Алексей', 'merlin'],
  ['Мария', 'morgana'],
  ['Дмитрий', 'percival'],
  ['Анна', 'isolde'],
  ['Иван', 'tristan'],
  ['Елена', 'cleric'],
  ['Михаил', 'mordred'],
];
document.querySelector('#native-players').innerHTML = people
  .map(([name, role], i) => {
    const angle = (i * 2 * Math.PI) / 7 + Math.PI / 2;
    return `<div class="native-seat${i < 3 ? ' on-mission' : ''}" style="left:${420 + 310 * Math.cos(angle)}px;top:${420 + 310 * Math.sin(angle)}px"><img class="native-avatar" src="/packages/ui/src/assets/images/roles/${role}.webp" alt=""><img class="native-frame" src="/packages/ui/src/assets/images/core/player-frame.webp" alt=""><span class="native-name">${name}</span></div>`;
  })
  .join('');
document.querySelector('#native-balance').textContent = '4 vs 3';
document.querySelector('#mission-track').innerHTML = [2, 3, 3, 4, 4]
  .map((n) => `<div class="mission-token">${n}</div>`)
  .join('');
new ResizeObserver(() => {
  const scale = Math.min(1, viewport.clientWidth / 840);
  world.style.transform = `scale(${scale})`;
  viewport.style.height = `${840 * scale}px`;
}).observe(viewport);
const swordIcon = `<svg viewBox="0 0 48 64" aria-hidden="true">
  <defs><linearGradient id="ex-blade" x1="0" x2="1"><stop stop-color="#819ba2"/><stop offset=".46" stop-color="#f5faf3"/><stop offset=".52" stop-color="#c7d7d8"/><stop offset="1" stop-color="#78939b"/></linearGradient><linearGradient id="ex-gold" x1="0" x2="1"><stop stop-color="#977038"/><stop offset=".45" stop-color="#f1d898"/><stop offset="1" stop-color="#a67e40"/></linearGradient></defs>
  <path d="M24 3l5 9-1.3 28h-7.4L19 12z" fill="url(#ex-blade)" stroke="#526d77" stroke-width=".8"/>
  <path d="M24 8v30" stroke="#f4faf5" stroke-width=".8" opacity=".7"/>
  <path d="M22 43h4v12h-4z" fill="#293f4b" stroke="#b59a60" stroke-width=".8"/>
  <path d="M22 46h4m-4 3h4m-4 3h4" stroke="#a58e61" stroke-width=".7"/>
  <path d="M11 43l1-5 9 2h6l9-2 1 5-11-1h-4z" fill="url(#ex-gold)" stroke="#967443" stroke-width=".8"/>
  <path d="M24 38l3 4-3 4-3-4z" fill="#79b8cf" stroke="#eed397" stroke-width="1"/>
  <path d="M24 54l4 4-4 4-4-4z" fill="url(#ex-gold)" stroke="#9d7e47" stroke-width=".7"/>
  <path d="M24 56l1.5 2-1.5 2-1.5-2z" fill="#568da4"/>
</svg>`;
function playerCenter(index) {
  const avatar = document.querySelectorAll('.native-avatar')[index].getBoundingClientRect();
  const board = world.getBoundingClientRect();
  const scale = board.width / 840;
  return { x: (avatar.x + avatar.width / 2 - board.x) / scale, y: (avatar.y + avatar.height / 2 - board.y) / scale };
}
function setup() {
  animations.forEach((a) => a.cancel());
  animations = [];
  world.querySelector('.ex-effects')?.remove();
  stage.innerHTML = '';
  const use = outcome.value === 'use';
  const source = playerCenter(0);
  const target = playerCenter(1);
  // Follow the outside of the table; leave central history and mission text clear.
  const path = `M ${source.x} ${source.y} C ${source.x - 120} ${source.y + 78}, ${target.x - 90} ${target.y + 125}, ${target.x} ${target.y}`;
  const effects = document.createElement('div');
  effects.className = 'ex-effects';
  effects.setAttribute('aria-hidden', 'true');
  effects.innerHTML = `<svg class="ex-arc" viewBox="0 0 840 840"><path class="ex-trail-glow" d="${path}" pathLength="1"/><path class="ex-trail" d="${path}" pathLength="1"/></svg><div class="ex-spark" style="offset-path:path('${path}')"></div><div class="ex-owner-badge" style="left:${source.x + 32}px;top:${source.y - 46}px">${swordIcon}</div><div class="ex-target-ring" style="left:${target.x - 54}px;top:${target.y - 54}px"></div><div class="ex-change" style="left:${target.x + 29}px;top:${target.y - 43}px">↻</div>`;
  world.append(effects);
  document.querySelector('#scene-type').textContent = use ? 'Экскалибур использован' : 'Экскалибур пропущен';
  document.querySelector('#duration').textContent = use ? '≈ 2,6 секунды' : '≈ 1,2 секунды';
  document.querySelector('#selected-title').textContent = use ? 'Дуга Экскалибура' : 'Меч гаснет';
  document.querySelector('#selected-description').textContent = use
    ? 'От Алексея к Марии проходит золотая дуга вдоль края стола. Рамка Марии вспыхивает, и на ней появляется знак смены решения.'
    : 'Знак меча у Алексея плавно гаснет. Другие игроки и решения похода остаются без изменений.';
  document.querySelector('#outcome-note').textContent = use
    ? 'Алексей → Мария. Решение изменено, его содержание не раскрывается.'
    : 'Алексей пропускает использование Экскалибура.';
  document.querySelector('#sequence').textContent = use
    ? `0,0 с · Знак у владельца
0,4 с · Дуга к выбранному игроку
1,3 с · Вспышка рамки и знак смены`
    : `0,0 с · Знак у владельца
0,3 с · Мягкое угасание
1,2 с · Возвращение к походу`;
  document.querySelector('#play').textContent = '▶ Запустить сцену';
  return { use, effects };
}
function play() {
  const { use, effects } = setup();
  const badge = effects.querySelector('.ex-owner-badge');
  if (use) {
    motion(
      badge,
      [
        { transform: 'scale(1)', boxShadow: '0 0 0 0 #dcc18500' },
        { offset: 0.5, transform: 'scale(1.15)', boxShadow: '0 0 0 9px #dcc18533' },
        { transform: 'scale(1)', boxShadow: '0 0 0 0 #dcc18500' },
      ],
      550,
    );
    effects
      .querySelectorAll('.ex-arc path')
      .forEach((path) =>
        motion(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 950, 350, 'cubic-bezier(.3,.05,.4,1)'),
      );
    motion(
      effects.querySelector('.ex-spark'),
      [
        { offsetDistance: '0%', opacity: 0 },
        { offset: 0.08, opacity: 1 },
        { offset: 0.94, opacity: 1 },
        { offsetDistance: '100%', opacity: 0 },
      ],
      950,
      350,
      'cubic-bezier(.3,.05,.4,1)',
    );
    motion(
      effects.querySelector('.ex-target-ring'),
      [
        { opacity: 0, transform: 'scale(.95)' },
        { offset: 0.28, opacity: 1, transform: 'scale(1.04)' },
        { offset: 0.65, opacity: 0.75, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.12)' },
      ],
      1300,
      1150,
    );
    motion(
      effects.querySelector('.ex-change'),
      [
        { opacity: 0, transform: 'scale(.6) rotate(-70deg)' },
        { opacity: 1, transform: 'scale(1) rotate(0deg)' },
      ],
      400,
      1300,
    );
    motion(effects.querySelector('.ex-arc'), [{ opacity: 1 }, { opacity: 0 }], 650, 1550);
    motion(badge, [{ opacity: 1 }, { opacity: 0 }], 500, 650);
  } else
    motion(
      badge,
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(.88)' },
      ],
      900,
      250,
    );
  document.querySelector('#play').textContent = '↻ Повторить сцену';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) animations.forEach((a) => a.finish());
}
document.querySelector('#play').addEventListener('click', play);
document.querySelector('#reset').addEventListener('click', setup);
outcome.addEventListener('change', play);
setup();
