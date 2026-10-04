module.exports = async function cleanupBuildkitCaches({ github, context, core }) {
  // Finish pagination before mutations so deletions cannot shift subsequent pages.
  const caches = await github.paginate(github.rest.actions.getActionsCacheList, {
    ...context.repo,
    per_page: 100,
  });
  const obsolete = caches.filter(
    ({ ref, key }) =>
      /^refs\/(?:tags|heads\/refs\/tags)\/v/.test(ref) &&
      /^(?:index-ui-build-\d+-|buildkit-blob-\d+-sha256:)/.test(key),
  );
  core.info(`Found ${obsolete.length} obsolete BuildKit caches across ${caches.length} caches.`);
  for (const cache of obsolete) {
    try {
      await github.rest.actions.deleteActionsCacheById({ ...context.repo, cache_id: cache.id });
      core.info(`Deleted cache ${cache.id} (${cache.ref}, ${cache.key}).`);
    } catch (error) {
      if (error.status !== 404) throw error;
      core.info(`Cache ${cache.id} is already gone.`);
    }
  }
};
