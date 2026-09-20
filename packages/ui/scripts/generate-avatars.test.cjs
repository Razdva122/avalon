const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');

test('avatar generation preserves optimized animation bytes and resizes static artwork', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'avalon-avatar-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'src/assets/images');
  for (const group of ['roles', 'premium', 'core', 'features']) {
    await fs.mkdir(path.join(source, group), { recursive: true });
  }
  const still = await sharp({ create: { width: 600, height: 600, channels: 3, background: '#abcdef' } })
    .webp()
    .toBuffer();
  for (const name of [
    'roles/merlin',
    'core/blue_team_no_background',
    'core/red_team_no_background',
    'features/lady_of_lake',
    'features/lady_of_sea',
    'features/excalibur',
  ]) {
    await fs.writeFile(path.join(source, name + '.webp'), still);
  }
  const animation = await sharp(Buffer.concat([Buffer.alloc(16 * 16 * 3, 20), Buffer.alloc(16 * 16 * 3, 220)]), {
    raw: { width: 16, height: 32, channels: 3, pageHeight: 16 },
  })
    .webp({ loop: 0, delay: [150, 350] })
    .toBuffer();
  await fs.writeFile(path.join(source, 'premium/animated.webp'), animation);
  await fs.mkdir(path.join(root, 'scripts'));
  const script = path.join(root, 'scripts/generate-avatars.cjs');
  await fs.copyFile(path.join(__dirname, 'generate-avatars.cjs'), script);
  execFileSync(process.execPath, [script], {
    env: { ...process.env, NODE_PATH: path.resolve(__dirname, '../../../node_modules') },
  });
  const generated = await fs.readFile(path.join(root, 'src/assets/avatars/premium/animated.webp'));
  assert.deepEqual(generated, animation, 'animation frames, timing and compression must be preserved');
  const resized = await sharp(path.join(root, 'src/assets/avatars/roles/merlin.webp')).metadata();
  assert.equal(resized.width, 512);
  assert.equal(resized.height, 512);
});
