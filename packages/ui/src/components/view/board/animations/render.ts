// Choreography finishes within three seconds; keep the revealed cards for reading.
export const ASSASSINATION_REVEAL_DURATION = 10000;
export const LOYALTY_REVEAL_DURATION = 1800;

type Position = { x: number; y: number; radius: number };

type AssassinationOptions = {
  roleImage: string;
  playerName: string;
  survivorImage: string;
  survivorName: string;
  hit: boolean;
  reducedMotion: boolean;
};

type LoyaltyOptions = {
  teamImage: string;
  ladyImage: string;
  source: Position;
  target: Position;
  width: number;
  height: number;
  reducedMotion: boolean;
};

const escapeHTML = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

/** Own only this scene, so cleanup cannot remove another board effect. */
function createScene(container: HTMLElement, className: string) {
  const root = document.createElement('div');
  root.className = className;
  // The board's existing role/result and history UI provide the accessible content.
  root.setAttribute('aria-hidden', 'true');
  container.appendChild(root);
  const animations: Animation[] = [];
  const motion = (
    element: Element,
    frames: Keyframe[],
    duration: number,
    delay = 0,
    easing = 'cubic-bezier(.22,.65,.3,1)',
    fill: FillMode = 'both',
  ) => {
    const animation = element.animate(frames, { duration, delay, easing, fill });
    animations.push(animation);
    return animation;
  };
  const cleanup = () => {
    animations.forEach((animation) => animation.cancel());
    root.remove();
  };
  return { root, motion, cleanup };
}

const face = (art: string, name: string, owner: 'selected' | 'survivor'): string =>
  `<div class="avalon-cards-face"><div class="avalon-cards-art"><img src="${escapeHTML(art)}" alt=""></div><div class="avalon-cards-title" data-card-owner="${owner}" title="${escapeHTML(name)}">${escapeHTML(name)}</div></div>`;

const back = '<div class="avalon-cards-back"><div class="avalon-cards-back-ornament"></div><span>Avalon</span></div>';

// A narrow, uneven paper cut shared by the front and its mirrored back.
const tear: [number, number][] = [
  [66, 0],
  [65.4, 4.2],
  [67, 7],
  [65.8, 10.5],
  [66.5, 13.8],
  [64.6, 17.8],
  [66, 21],
  [65.2, 24.9],
  [66.2, 29],
  [64.8, 32.4],
  [66.3, 35.7],
  [65.4, 39.6],
  [66, 43.1],
  [64.6, 47],
  [66.3, 51.2],
  [65.2, 55.1],
  [66, 58],
  [65.7, 63],
];

function damagedSide(content: string, reverse = false): string {
  const mirror = ([x, y]: [number, number]): [number, number] => [reverse ? 128 - x : x, y];
  const points = tear.map(mirror);
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  const polygon = (vertices: [number, number][]) =>
    `polygon(${vertices
      .map(mirror)
      .map(([x, y]) => `${x}px ${y}px`)
      .join(',')})`;
  const body = polygon([[0, 0], ...tear, [128, 63], [128, 186], [0, 186]]);
  const flap = polygon([tear[0], [128, 0], [128, 63], ...tear.slice(1).reverse()]);
  const fibers = [3, 5, 7, 9, 11, 13, 15, 16]
    .map(
      (index, i) =>
        `M${points[index][0]} ${points[index][1]}l${(reverse ? 1 : -1) * (1.2 + (i % 3) * 0.5)} ${i % 2 ? '-.5' : '1.2'}`,
    )
    .join(' ');

  return `<div class="avalon-cards-side ${reverse ? 'avalon-cards-reverse' : 'avalon-cards-front'}" style="--avalon-cards-body-clip:${body};--avalon-cards-flap-clip:${flap};--avalon-cards-origin:${reverse ? 31 : 97}px 63px"><svg class="avalon-cards-gap" viewBox="0 0 128 186"><path class="avalon-cards-cut" d="${path}" fill="none" stroke="#25190e" stroke-width="2.1" stroke-dasharray="70" stroke-dashoffset="70"/></svg><div class="avalon-cards-body">${content}</div><div class="avalon-cards-flap"><div class="avalon-cards-fragment">${content}</div><svg class="avalon-cards-fibers" viewBox="0 0 128 186"><path class="avalon-cards-edge" d="${path}" fill="none" stroke="#efe0bb" stroke-width="1.15" stroke-dasharray="70" stroke-dashoffset="70"/><path class="avalon-cards-threads" d="${fibers}" fill="none" stroke="#e9d7af" stroke-width=".65" stroke-linecap="round" opacity="0"/></svg></div></div>`;
}

export function renderAssassination(container: HTMLElement, options: AssassinationOptions): () => void {
  const { root, motion, cleanup } = createScene(
    container,
    `avalon-assassination${options.hit ? '' : ' avalon-assassination-miss'}${options.reducedMotion ? ' avalon-assassination-reduced' : ''}`,
  );
  const front = face(options.roleImage, options.playerName, 'selected');
  root.innerHTML = `<div class="avalon-cards-scene"><div class="avalon-cards-table-shadow"></div><div class="avalon-cards-target"><div class="avalon-cards-turn avalon-cards-card">${damagedSide(back, true)}${damagedSide(front)}</div></div><div class="avalon-cards-halves"><div class="avalon-cards-half avalon-cards-half-left">${front}</div><div class="avalon-cards-half avalon-cards-half-right">${front}</div></div>${options.hit ? '' : `<div class="avalon-cards-survivor avalon-cards-card">${face(options.survivorImage, options.survivorName, 'survivor')}</div>`}</div>`;

  if (options.reducedMotion) return cleanup;
  const find = (selector: string): Element => root.querySelector(selector)!;
  root.querySelectorAll('.avalon-cards-side').forEach((side) => {
    const sign = side.classList.contains('avalon-cards-reverse') ? -1 : 1;
    motion(
      side.querySelector('.avalon-cards-flap')!,
      [
        { transform: 'translateX(0) rotateX(0deg)' },
        { offset: 0.75, transform: `translateX(${sign * 0.8}px) rotateX(${sign * -15}deg)` },
        { transform: `translateX(${sign * 0.6}px) rotateX(${sign * -12}deg)` },
      ],
      320,
      40,
    );
    motion(side.querySelector('.avalon-cards-cut')!, [{ strokeDashoffset: '70' }, { strokeDashoffset: '0' }], 280, 40);
    motion(side.querySelector('.avalon-cards-edge')!, [{ strokeDashoffset: '70' }, { strokeDashoffset: '0' }], 280, 40);
    motion(side.querySelector('.avalon-cards-threads')!, [{ opacity: 0 }, { opacity: 0.85 }], 160, 160);
  });
  motion(
    find('.avalon-cards-turn'),
    [
      { transform: 'rotateY(0deg) translateZ(0)' },
      { offset: 0.45, transform: 'rotateY(-87deg) translateZ(15px)' },
      { offset: 0.86, transform: 'rotateY(-187deg) translateZ(2px)' },
      { transform: 'rotateY(-180deg) translateZ(0)' },
    ],
    900,
    450,
  );
  motion(
    find('.avalon-cards-table-shadow'),
    [
      { opacity: 0.7, transform: 'scale(1)' },
      { offset: 0.4, opacity: 0.4, transform: 'scale(1.12)' },
      { opacity: 0.7, transform: 'scale(1)' },
    ],
    900,
    450,
  );
  motion(find('.avalon-cards-target'), [{ opacity: 1 }, { opacity: 0 }], 1, 1600);
  motion(find('.avalon-cards-halves'), [{ opacity: 0 }, { opacity: 1 }], 1, 1600);
  motion(
    find('.avalon-cards-half-left'),
    [
      { transform: 'translateX(0) rotate(0)' },
      { offset: 0.72, transform: 'translate(-15px,5px) rotate(-11deg)' },
      { transform: 'translate(-12px,4px) rotate(-9deg)' },
    ],
    580,
    1600,
  );
  motion(
    find('.avalon-cards-half-right'),
    [
      { transform: 'translateX(0) rotate(0)' },
      { offset: 0.72, transform: 'translate(16px,12px) rotate(12deg)' },
      { transform: 'translate(13px,10px) rotate(10deg)' },
    ],
    580,
    1600,
  );
  if (!options.hit) {
    motion(
      find('.avalon-cards-halves'),
      [
        { transform: 'translateX(0) rotate(-5deg)' },
        { offset: 0.86, transform: 'translateX(-88px) rotate(-5deg)' },
        { transform: 'translateX(-84px) rotate(-5deg)' },
      ],
      560,
      2100,
    );
    // Fill forwards avoids replacing the earlier flip shadow during this delay.
    motion(
      find('.avalon-cards-table-shadow'),
      [{ transform: 'translateX(0) scale(1)' }, { transform: 'translateX(-84px) scale(1)' }],
      560,
      2100,
      undefined,
      'forwards',
    );
    motion(
      find('.avalon-cards-survivor'),
      [
        { opacity: 0, transform: 'translateX(190px) rotate(11deg)' },
        { offset: 0.13, opacity: 1 },
        { offset: 0.86, opacity: 1, transform: 'translateX(-4px) rotate(2deg)' },
        { opacity: 1, transform: 'translateX(0) rotate(3deg)' },
      ],
      680,
      2250,
    );
  }
  return cleanup;
}

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));

export function renderLoyalty(container: HTMLElement, options: LoyaltyOptions): () => void {
  // The player supplies the immediate, persistent badge in reduced-motion mode.
  if (options.reducedMotion) return () => {};
  const { root, motion, cleanup } = createScene(container, 'avalon-loyalty-scene');
  const { width, height, target, source } = options;
  const unit = Math.min(1, width / 670);
  const heroSize = Math.max(48, 74 * unit);
  // Player.vue uses a 32 px badge; the whole table already scales on phones.
  const badgeSize = 32;
  const center = { x: width * 0.5, y: height * 0.51 };
  const inward = { x: center.x - source.x, y: center.y - source.y };
  const inwardLength = Math.hypot(inward.x, inward.y) || 1;
  const distanceInside = source.radius + heroSize * 0.78;
  const showAt = {
    x: clamp(source.x + (inward.x / inwardLength) * distanceInside, heroSize * 0.6, width - heroSize * 0.6),
    y: clamp(source.y + (inward.y / inwardLength) * distanceInside, heroSize * 0.6, height - heroSize * 0.6),
  };
  const badgeAt = {
    // Seats can extend beyond the felt: land on the portrait, not the table boundary.
    x: target.x + target.radius * 0.64,
    y: target.y + target.radius * 0.6,
  };
  const origin = {
    x: source.x + (inward.x / inwardLength) * (source.radius + 7 * unit),
    y: source.y + (inward.y / inwardLength) * (source.radius + 7 * unit),
  };
  const delta = { x: badgeAt.x - showAt.x, y: badgeAt.y - showAt.y };
  const length = Math.hypot(delta.x, delta.y) || 1;
  const normal = { x: -delta.y / length, y: delta.x / length };
  const middle = { x: (showAt.x + badgeAt.x) * 0.5, y: (showAt.y + badgeAt.y) * 0.5 };
  const side = (center.x - middle.x) * normal.x + (center.y - middle.y) * normal.y >= 0 ? 1 : -1;
  const bend = Math.min(width * 0.095, length * 0.24);
  const control = { x: middle.x + normal.x * bend * side, y: middle.y + normal.y * bend * side };
  const curve = (progress: number) => ({
    x: (1 - progress) ** 2 * showAt.x + 2 * (1 - progress) * progress * control.x + progress ** 2 * badgeAt.x,
    y: (1 - progress) ** 2 * showAt.y + 2 * (1 - progress) * progress * control.y + progress ** 2 * badgeAt.y,
  });
  const at = (position: { x: number; y: number }, scale: number, rotation = 0, tilt = 0) =>
    `translate(${position.x - heroSize * 0.5}px,${position.y - heroSize * 0.5}px) rotate(${rotation}deg) rotateY(${tilt}deg) scale(${scale})`;
  const finalScale = badgeSize / heroSize;
  const sourceMarkSize = Math.max(18, 23 * unit);
  root.innerHTML = `<div class="avalon-loyalty-source-rim" style="left:${source.x - source.radius - 3}px;top:${source.y - source.radius - 3}px;width:${source.radius * 2 + 6}px;height:${source.radius * 2 + 6}px"></div><div class="avalon-loyalty-source-mark" style="left:${source.x - source.radius * 0.65 - sourceMarkSize * 0.5}px;top:${source.y + source.radius * 0.6 - sourceMarkSize * 0.5}px;width:${sourceMarkSize}px;height:${sourceMarkSize}px"><img src="${escapeHTML(options.ladyImage)}" alt=""></div><div class="avalon-loyalty-target-rim" style="left:${target.x - target.radius - 3}px;top:${target.y - target.radius - 3}px;width:${target.radius * 2 + 6}px;height:${target.radius * 2 + 6}px"></div><div class="avalon-loyalty-emblem" style="width:${heroSize}px;height:${heroSize}px"><img src="${escapeHTML(options.teamImage)}" alt=""><div class="avalon-loyalty-sheen"></div></div>`;
  const find = (selector: string): Element => root.querySelector(selector)!;
  motion(
    find('.avalon-loyalty-emblem'),
    [
      { offset: 0, opacity: 0, transform: at(origin, 0.28, -18, -38), easing: 'cubic-bezier(.2,.65,.3,1)' },
      { offset: 0.16, opacity: 1, transform: at(showAt, 1.045, 6, 8), easing: 'cubic-bezier(.22,.65,.3,1)' },
      { offset: 0.23, opacity: 1, transform: at(showAt, 1, -3) },
      { offset: 0.37, opacity: 1, transform: at(showAt, 1, -3) },
      { offset: 0.47, opacity: 1, transform: at(curve(0.17), 0.94, 0, 3) },
      { offset: 0.59, opacity: 1, transform: at(curve(0.43), 0.81, 5, 6) },
      { offset: 0.72, opacity: 1, transform: at(curve(0.74), 0.61, 2, 2) },
      { offset: 0.83, opacity: 1, transform: at(badgeAt, finalScale * 1.05), easing: 'cubic-bezier(.22,.65,.3,1)' },
      {
        offset: 0.91,
        opacity: 1,
        transform: at({ x: badgeAt.x, y: badgeAt.y + 0.8 }, finalScale * 0.97, 1),
        easing: 'cubic-bezier(.22,.65,.3,1)',
      },
      { offset: 1, opacity: 1, transform: at(badgeAt, finalScale) },
    ],
    LOYALTY_REVEAL_DURATION,
    0,
    'linear',
  );
  motion(
    find('.avalon-loyalty-source-rim'),
    [{ offset: 0, opacity: 0 }, { offset: 0.16, opacity: 0.9 }, { offset: 0.55, opacity: 0.65 }, { opacity: 0 }],
    1300,
    60,
  );
  motion(
    find('.avalon-loyalty-source-mark'),
    [
      { offset: 0, opacity: 0, transform: 'scale(.8)' },
      { offset: 0.18, opacity: 1, transform: 'scale(1)' },
      { offset: 0.66, opacity: 1 },
      { opacity: 0, transform: 'scale(1)' },
    ],
    1300,
    60,
  );
  motion(
    find('.avalon-loyalty-sheen'),
    [
      { opacity: 0, transform: 'translateX(-115%) rotate(-17deg)' },
      { offset: 0.4, opacity: 0.18 },
      { offset: 0.68, opacity: 0.12 },
      { opacity: 0, transform: 'translateX(115%) rotate(-17deg)' },
    ],
    460,
    240,
    'linear',
  );
  motion(
    find('.avalon-loyalty-target-rim'),
    [
      { opacity: 0, transform: 'scale(1.06)' },
      { offset: 0.52, opacity: 0.75, transform: 'scale(1)' },
      { opacity: 0.42, transform: 'scale(1)' },
    ],
    700,
    1050,
  );
  return cleanup;
}
