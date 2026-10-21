const { execFileSync } = require('node:child_process');

function checkReleasePreflight(exec = execFileSync) {
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  if (exec('git', ['status', '--porcelain'], options).trim()) {
    throw Error('Commit and push your changes to master before checking the release preflight.');
  }
  const sha = exec('git', ['rev-parse', 'HEAD'], options).trim();
  let runs;
  try {
    runs = JSON.parse(
      exec(
        'gh',
        [
          'run',
          'list',
          '--workflow',
          'check-ui.yml',
          '--commit',
          sha,
          '--branch',
          'master',
          '--event',
          'push',
          '--limit',
          '1',
          '--json',
          'status,conclusion,headSha,url',
        ],
        options,
      ),
    );
  } catch {
    throw Error('Cannot verify the GitHub UI preflight. Install GitHub CLI, check gh auth status and retry.');
  }
  const run = runs[0];
  if (run?.headSha !== sha || run.status !== 'completed' || run.conclusion !== 'success') {
    throw Error(
      `UI preflight has not passed for commit ${sha.slice(0, 8)}. Push to master and wait for "Check UI before release" to succeed.${run?.url ? ` ${run.url}` : ''}`,
    );
  }
  return run;
}

if (require.main === module) {
  try {
    const run = checkReleasePreflight();
    console.log(`UI release preflight passed: ${run.url}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { checkReleasePreflight };
