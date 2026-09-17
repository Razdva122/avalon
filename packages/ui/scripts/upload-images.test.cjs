const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { uploadImages, readRelease, verifyImages } = require('./upload-images.cjs');
const { publicBase, storage } = require('../image-storage.cjs');
function release(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-upload-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'img'));
  const files = ['merlin.0123456789abcdef.webp', 'puppeteer.fedcba9876543210.png'].map((name) => {
    const bytes = Buffer.from(name);
    fs.writeFileSync(path.join(dir, 'img', name), bytes);
    return { name, size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  });
  fs.writeFileSync(path.join(dir, 'image-release.json'), JSON.stringify({ publicBase, files }));
  return { dir, files };
}
const env = { AWS_ACCESS_KEY_ID: 'test-id', AWS_SECRET_ACCESS_KEY: 'test-secret' };
const goodResponse = (file) =>
  new Response(null, {
    status: 200,
    headers: {
      'content-type': file.name.endsWith('.png') ? 'image/png' : 'image/webp',
      'content-length': String(file.size),
      'cache-control': storage.cacheControl,
    },
  });

test('rejects changed, empty, local or unversioned release artifacts before upload', (t) => {
  const { dir, files } = release(t);
  const manifest = path.join(dir, 'image-release.json');
  const write = (base, entries) => fs.writeFileSync(manifest, JSON.stringify({ publicBase: base, files: entries }));
  write('/', files);
  assert.throws(() => readRelease(dir), /publicBase/);
  write(publicBase, []);
  assert.throws(() => readRelease(dir), /empty/i);
  write(publicBase, [{ ...files[0], name: '../merlin.webp' }]);
  assert.throws(() => readRelease(dir), /filename/i);
  write(publicBase, files);
  fs.writeFileSync(path.join(dir, 'img', files[0].name), 'changed');
  assert.throws(() => readRelease(dir), /mismatch/i);
});

test('uploads only images with MIME and immutable cache metadata, then verifies every public URL', async (t) => {
  const { dir, files } = release(t);
  const commands = [],
    requests = [];
  await uploadImages(dir, {
    env,
    run: (command, args, options) => {
      commands.push({ command, args, options });
      return { status: 0 };
    },
    fetch: async (url, options) => {
      requests.push(url);
      assert.equal(options.method, 'HEAD');
      return goodResponse(files.find((file) => url.endsWith(file.name)));
    },
  });
  assert.equal(commands.length, 2);
  for (const { command, args, options } of commands) {
    assert.equal(command, 'aws');
    assert(args.includes('s3://avalon-game/assets/img/'));
    assert(args.includes('https://storage.yandexcloud.net'));
    assert(args.includes('public, max-age=31536000, immutable'));
    assert(!args.includes('--acl'), 'uploader must not need ACL administration rights');
    assert(!args.includes('--delete'));
    assert(
      args.includes('--size-only'),
      'unchanged hashed objects must not be uploaded again because of build timestamps',
    );
    assert(!args.some((arg) => arg.includes('test-secret')));
    assert.equal(options.env.AWS_DEFAULT_REGION, 'ru-central1');
  }
  assert(commands.some(({ args }) => args.includes('image/png')));
  assert(commands.some(({ args }) => args.includes('image/webp')));
  assert.equal(requests.length, files.length);
  assert(requests.every((url) => url.startsWith('https://storage.yandexcloud.net/avalon-game/assets/img/')));
});

test('missing credentials and failed AWS commands prevent success and public verification', async (t) => {
  const { dir } = release(t);
  await assert.rejects(uploadImages(dir, { env: {}, run: () => assert.fail('must not upload') }), /AWS_ACCESS_KEY_ID/);
  await assert.rejects(
    uploadImages(dir, { env, run: () => ({ status: 1 }), fetch: () => assert.fail('must not verify') }),
    /upload failed/i,
  );
});

test('public verification rejects missing images, incorrect bytes, MIME or cache metadata', async () => {
  const file = { name: 'merlin.0123456789abcdef.webp', size: 12 };
  for (const response of [
    new Response(null, { status: 404 }),
    new Response(null, {
      headers: { 'content-length': '13', 'content-type': 'image/webp', 'cache-control': storage.cacheControl },
    }),
    new Response(null, {
      headers: {
        'content-length': '12',
        'content-type': 'application/octet-stream',
        'cache-control': storage.cacheControl,
      },
    }),
    new Response(null, { headers: { 'content-length': '12', 'content-type': 'image/webp' } }),
  ]) {
    await assert.rejects(verifyImages([file], async () => response));
  }
});

test('public verification recovers from network failures with bounded backoff', async () => {
  const file = { name: 'merlin.0123456789abcdef.webp', size: 12 };
  const delays = [];
  let requests = 0;
  await verifyImages(
    [file],
    async () => {
      if (++requests < 3) throw new TypeError('fetch failed', { cause: new Error('ECONNRESET') });
      return goodResponse(file);
    },
    { sleep: async (ms) => delays.push(ms) },
  );
  assert.equal(requests, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test('public verification retries transient HTTP failures but still validates the recovered response', async () => {
  const file = { name: 'merlin.0123456789abcdef.webp', size: 12 };
  for (const status of [408, 429, 500, 502, 503, 504]) {
    let requests = 0;
    await verifyImages([file], async () => (++requests === 1 ? new Response(null, { status }) : goodResponse(file)), {
      sleep: async () => {},
    });
    assert.equal(requests, 2);
  }
  let requests = 0;
  await assert.rejects(
    verifyImages(
      [file],
      async () => {
        if (++requests === 1) throw new TypeError('fetch failed');
        return goodResponse({ ...file, size: 13 });
      },
      { sleep: async () => {} },
    ),
    /size mismatch/,
  );
  assert.equal(requests, 2, 'invalid metadata must fail immediately');
});

test('persistent HTTP failures stop verification; permanent failures are not retried', async () => {
  const file = { name: 'merlin.0123456789abcdef.webp', size: 12 };
  for (const [status, expectedRequests] of [
    [503, 4],
    [403, 1],
    [404, 1],
  ]) {
    let requests = 0;
    await assert.rejects(
      verifyImages(
        [file],
        async () => {
          requests++;
          return new Response(null, { status });
        },
        { sleep: async () => {} },
      ),
      (error) => {
        assert(error.message.includes(`${publicBase}img/${file.name}`));
        assert(error.message.includes(String(status)));
        return true;
      },
    );
    assert.equal(requests, expectedRequests);
  }
});
