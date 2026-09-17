// Generated previews are separate from full artwork, with one shared URL per avatar.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const source = path.resolve(__dirname, '../src/assets/images');
const output = path.resolve(__dirname, '../src/assets/avatars');

async function generateAvatars() {
  const groups = {
    roles: fs.readdirSync(path.join(source, 'roles')).filter((name) => name.endsWith('.webp')),
    premium: fs.readdirSync(path.join(source, 'premium')).filter((name) => name.endsWith('.webp')),
    core: ['blue_team_no_background.webp', 'red_team_no_background.webp'],
    features: ['lady_of_lake.webp', 'lady_of_sea.webp', 'excalibur.webp'],
  };
  fs.rmSync(output, { recursive: true, force: true });
  let count = 0;
  for (const [group, files] of Object.entries(groups)) {
    fs.mkdirSync(path.join(output, group), { recursive: true });
    for (const name of files) {
      await sharp(path.join(source, group, name))
        .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, alphaQuality: 100, effort: 4 })
        .toFile(path.join(output, group, name));
      count++;
    }
  }
  console.log(`Generated ${count} avatar previews (max 512 px).`);
}

generateAvatars().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
