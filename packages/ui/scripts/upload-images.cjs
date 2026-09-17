const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { setTimeout: sleep } = require('node:timers/promises');
const { storage, publicBase } = require('../image-storage.cjs');
const filenamePattern = /^[a-zA-Z0-9_-]+\.[a-f0-9]{16}\.(png|webp)$/;
const mime = (name) => (name.endsWith('.png') ? 'image/png' : 'image/webp');

function readRelease(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'image-release.json'), 'utf8'));
  assert.equal(manifest.publicBase, publicBase, 'Release publicBase does not match the configured bucket');
  assert(Array.isArray(manifest.files) && manifest.files.length, 'Image release is empty');
  const names = new Set();
  for (const file of manifest.files) {
    assert(filenamePattern.test(file.name), `Invalid image filename: ${file.name}`);
    assert(!names.has(file.name), `Duplicate image: ${file.name}`);
    names.add(file.name);
    const source = path.join(dir, 'img', file.name);
    assert(fs.lstatSync(source).isFile(), `Not a regular image file: ${file.name}`);
    const bytes = fs.readFileSync(source);
    assert.equal(bytes.length, file.size, `Image size mismatch: ${file.name}`);
    assert.equal(
      crypto.createHash('sha256').update(bytes).digest('hex'),
      file.sha256,
      `Image hash mismatch: ${file.name}`,
    );
  }
  assert.deepEqual(
    new Set(fs.readdirSync(path.join(dir, 'img'))),
    names,
    'Image directory differs from the audited release',
  );
  return manifest.files;
}

function uploadCommands(dir, files) {
  return ['webp', 'png']
    .filter((ext) => files.some((file) => file.name.endsWith(`.${ext}`)))
    .map((ext) => [
      '--endpoint-url',
      storage.endpoint,
      's3',
      'sync',
      path.join(dir, 'img'),
      `s3://${storage.bucket}/${storage.prefix}img/`,
      '--exclude',
      '*',
      '--include',
      `*.${ext}`,
      // Names include the content hash; rebuild timestamps must not cause re-uploads.
      '--size-only',
      '--cache-control',
      storage.cacheControl,
      '--content-type',
      `image/${ext}`,
      '--no-progress',
    ]);
}

async function fetchImageHeaders(url, fetchImpl, wait) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetchImpl(url, {
        method: 'HEAD',
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      });
      const transient = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!transient || attempt === 4) return response;
    } catch (error) {
      if (attempt === 4) {
        throw new Error(`Unable to verify image ${url} after ${attempt} attempts: ${error.message}`, {
          cause: error,
        });
      }
    }
    await wait(500 * 2 ** (attempt - 1));
  }
}

async function verifyImages(files, fetchImpl = fetch, options = {}) {
  // Bound concurrency; every image must be publicly available before UI publication.
  for (let offset = 0; offset < files.length; offset += 8) {
    await Promise.all(
      files.slice(offset, offset + 8).map(async (file) => {
        const url = `${publicBase}img/${file.name}`;
        const response = await fetchImageHeaders(url, fetchImpl, options.sleep || sleep);
        assert.equal(response.status, 200, `Image is not public: ${url} (${response.status})`);
        assert.equal(response.headers.get('content-length'), String(file.size), `Public image size mismatch: ${url}`);
        assert.equal(response.headers.get('content-type'), mime(file.name), `Public image MIME mismatch: ${url}`);
        const directives = new Set(
          (response.headers.get('cache-control') || '').split(',').map((part) => part.trim().toLowerCase()),
        );
        for (const directive of ['public', 'max-age=31536000', 'immutable']) {
          assert(directives.has(directive), `Missing cache directive ${directive}: ${url}`);
        }
      }),
    );
  }
}

async function uploadImages(dir, options = {}) {
  const files = readRelease(dir);
  const env = options.env || process.env;
  assert(
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY,
    'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the Yandex static access key',
  );
  const run = options.run || spawnSync;
  for (const args of uploadCommands(dir, files)) {
    const result = run('aws', args, {
      stdio: 'inherit',
      env: { ...env, AWS_DEFAULT_REGION: storage.region, AWS_EC2_METADATA_DISABLED: 'true', AWS_PAGER: '' },
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, 'Image upload failed; UI publication must stop');
  }
  await verifyImages(files, options.fetch);
  return files.length;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = args.filter((arg) => arg.startsWith('--'));
  assert(
    flags.length <= 1 && flags.every((flag) => ['--dry-run', '--verify-only'].includes(flag)),
    'Use --dry-run or --verify-only',
  );
  const dirs = args.filter((arg) => !arg.startsWith('--'));
  assert(dirs.length <= 1, 'Expected one release directory');
  const dir = path.resolve(dirs[0] || path.join(__dirname, '../dist'));
  const files = readRelease(dir);
  if (flags.includes('--dry-run')) {
    console.log(JSON.stringify({ files: files.length, commands: uploadCommands(dir, files) }, null, 2));
  } else if (flags.includes('--verify-only')) {
    await verifyImages(files);
    console.log(`Verified ${files.length} published images.`);
  } else {
    console.log(`Uploaded and verified ${await uploadImages(dir)} images.`);
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { readRelease, uploadImages, verifyImages };
