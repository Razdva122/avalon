import './mission.js?v=witch-1';
const world = document.querySelector('.native-board');
const viewport = document.querySelector('.native-viewport');
const seats = document.querySelector('#seat-count');
const team = document.querySelector('#team-size');
const outcome = document.querySelector('#outcome');
const people = [
  ['Алексей', 'merlin'],
  ['Мария', 'morgana'],
  ['Дмитрий', 'percival'],
  ['Анна', 'isolde'],
  ['Иван', 'tristan'],
  ['Елена', 'cleric'],
  ['Михаил', 'mordred'],
  ['Ольга', 'servant'],
  ['Сергей', 'minion'],
  ['Наталья', 'guinevere'],
];
function renderSeats() {
  // Mission 4 requires two fails only in games with seven or more players.
  if (['double', 'resilient'].includes(outcome.value) && Number(seats.value) < 7) seats.value = '7';
  const count = Number(seats.value);
  document.querySelector('#native-players').innerHTML = people
    .slice(0, count)
    .map(([name, avatar], i) => {
      const angle = (i * 2 * Math.PI) / count + Math.PI / 2;
      const x = 420 + 310 * Math.cos(angle);
      const y = 420 + 310 * Math.sin(angle);
      return `<div class="native-seat${i < Number(team.value) ? ' on-mission' : ''}" style="left:${x}px;top:${y}px"><img class="native-avatar" src="/packages/ui/src/assets/images/roles/${avatar}.webp" alt=""><img class="native-frame" src="/packages/ui/src/assets/images/core/player-frame.webp" alt=""><span class="native-name">${name}</span>${i === 0 ? '<img class="native-crown" src="/packages/ui/src/assets/images/core/crown.webp" alt="Лидер">' : ''}</div>`;
    })
    .join('');
  const evil = count <= 6 ? 2 : count <= 9 ? 3 : 4;
  document.querySelector('#native-balance').innerHTML =
    `<span class="good">${count - evil}</span> vs <span class="evil">${evil}</span>`;
}
new ResizeObserver(() => {
  const scale = Math.min(1, viewport.clientWidth / 840);
  world.style.transform = `scale(${scale})`;
  viewport.style.height = `${840 * scale}px`;
}).observe(viewport);
seats.addEventListener('change', renderSeats);
team.addEventListener('change', renderSeats);
outcome.addEventListener('change', renderSeats);
renderSeats();
