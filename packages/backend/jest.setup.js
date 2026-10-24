/* eslint-disable no-undef */
// The speaker step (src/ai/speaker.ts) adds a model call to every spoken turn. Tests of the decision call run without
// it; speaker tests turn it on themselves.
process.env.AI_SPEAKER ??= 'off';
