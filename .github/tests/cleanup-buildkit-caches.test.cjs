const { test } = require('node:test');
const assert = require('node:assert/strict');
const cleanup = require('../scripts/cleanup-buildkit-caches.cjs');

const context = { repo: { owner: 'avalon-owner', repo: 'avalon' } };
const cache = (id, ref, key) => ({
  id,
  ref,
  key,
  version: 'cache-version',
  created_at: '2026-10-01T00:00:00Z',
  last_accessed_at: '2026-10-01T00:00:00Z',
  size_in_bytes: 1024,
});

function api(pages, { listError, deleteErrors = {} } = {}) {
  const events = [];
  const remaining = pages.flat();
  const messages = [];
  const list = () => {};
  return {
    events,
    remaining,
    messages,
    github: {
      rest: {
        actions: {
          getActionsCacheList: list,
          async deleteActionsCacheById(params) {
            assert.deepEqual(params, { ...context.repo, cache_id: params.cache_id });
            events.push(`delete:${params.cache_id}`);
            if (deleteErrors[params.cache_id]) throw deleteErrors[params.cache_id];
            remaining.splice(
              remaining.findIndex((entry) => entry.id === params.cache_id),
              1,
            );
          },
        },
      },
      async paginate(method, params) {
        assert.equal(method, list);
        assert.deepEqual(params, { ...context.repo, per_page: 100 });
        for (let index = 0; index < pages.length; index++) {
          events.push(`list:${index + 1}`);
          if (listError && index === pages.length - 1) throw listError;
        }
        return pages.flat();
      },
    },
    core: { info: (message) => messages.push(message) },
  };
}

test('deletes only legacy UI BuildKit keys on version-tag refs after all pages are listed', async () => {
  const state = api([
    [
      cache(1, 'refs/tags/v69.6.0', 'index-ui-build-1-audit'),
      cache(2, 'refs/heads/refs/tags/v69.7.0', 'buildkit-blob-1-sha256:abc'),
      cache(3, 'refs/heads/master', 'index-ui-build-1-main'),
      cache(4, 'refs/tags/v69.7.0', 'npm-dependencies'),
    ],
    [
      cache(5, 'refs/tags/v69.7.0', 'buildkit-blob-1-sha256:def'),
      cache(6, 'refs/heads/feature', 'buildkit-blob-1-sha256:abc'),
      cache(7, 'refs/pull/12/merge', 'index-ui-build-1-pr'),
      cache(8, 'refs/tags/latest', 'buildkit-blob-1-sha256:abc'),
      cache(9, 'refs/heads/v69.7.0', 'index-ui-build-1-branch'),
      cache(10, 'refs/tags/v69.7.0', 'index-other-tool-1-cache'),
    ],
  ]);
  await cleanup({ ...state, context });
  assert.deepEqual(
    state.remaining.map((entry) => entry.id),
    [3, 4, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(state.events, ['list:1', 'list:2', 'delete:1', 'delete:2', 'delete:5']);
});

test('a later pagination failure prevents every deletion and reports the API error', async () => {
  const failure = Object.assign(new Error('listing failed'), { status: 403 });
  const state = api([[cache(1, 'refs/tags/v69.7.0', 'index-ui-build-1-audit')], []], { listError: failure });
  await assert.rejects(cleanup({ ...state, context }), (error) => error === failure);
  assert.deepEqual(state.events, ['list:1', 'list:2']);
  assert.deepEqual(
    state.remaining.map((entry) => entry.id),
    [1],
  );
});

test('a cache already deleted elsewhere is reported and cleanup continues', async () => {
  const state = api(
    [
      [
        cache(1, 'refs/tags/v69.7.0', 'index-ui-build-1-audit'),
        cache(2, 'refs/tags/v69.7.0', 'buildkit-blob-1-sha256:abc'),
      ],
    ],
    { deleteErrors: { 1: Object.assign(new Error('already gone'), { status: 404 }) } },
  );
  await cleanup({ ...state, context });
  assert.deepEqual(state.events, ['list:1', 'delete:1', 'delete:2']);
  assert.ok(state.messages.some((message) => /1.*already.*(gone|deleted)/i.test(message)));
});

test('other deletion failures stop cleanup and report the original API error', async () => {
  const failure = Object.assign(new Error('permission denied'), { status: 403 });
  const state = api(
    [
      [
        cache(1, 'refs/tags/v69.7.0', 'index-ui-build-1-audit'),
        cache(2, 'refs/tags/v69.7.0', 'buildkit-blob-1-sha256:abc'),
      ],
    ],
    { deleteErrors: { 1: failure } },
  );
  await assert.rejects(cleanup({ ...state, context }), (error) => error === failure);
  assert.deepEqual(state.events, ['list:1', 'delete:1']);
  assert.deepEqual(
    state.remaining.map((entry) => entry.id),
    [1, 2],
  );
});
