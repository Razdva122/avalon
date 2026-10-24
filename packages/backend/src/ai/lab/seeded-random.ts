// Import before anything that loads lodash, which keeps its own reference to Math.random.
// With AI_LAB_SEED set, seat order, roles and the first leader repeat exactly, so two bot versions
// can be compared on the same deal.
const seed = process.env.AI_LAB_SEED;
if (seed) {
  let state = Number(seed) >>> 0;
  // mulberry32
  Math.random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export {};
