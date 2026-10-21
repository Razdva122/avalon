const { execFileSync } = require('node:child_process');

function checkReleasePreflight(exec = execFileSync) {
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  if (exec('git', ['status', '--porcelain'], options).trim()) {
    throw Error('Commit your changes before checking the release budget.');
  }
  const api = (endpoint, paginate = false) => {
    try {
      const result = JSON.parse(
        exec(
          'gh',
          ['api', `repos/{owner}/{repo}/${endpoint}`, ...(paginate ? ['--paginate', '--slurp'] : [])],
          options,
        ),
      );
      return paginate ? result.flat() : result;
    } catch {
      throw Error('Не удалось проверить флаг размера в GitHub. Проверьте сеть и gh auth status.');
    }
  };
  // Only a previous release creates debt. A normal release never waits for HEAD CI.
  const run = api('actions/workflows/publish.yml/runs?per_page=1').workflow_runs[0];
  if (!run) return;
  const statuses = api(`commits/${run.head_sha}/statuses?per_page=100`, true);
  const flag = statuses.find(({ context }) => context === `avalon/bundle-budget/release-${run.id}`);
  if (flag?.state === 'success') return;
  // Existing successful releases from before this policy have no budget status.
  if (!flag && run.status === 'completed' && run.conclusion === 'success') return;
  if (!flag && run.status !== 'completed') {
    throw Error(`Проверка предыдущего выпуска ещё не завершена или завершилась ошибкой: ${run.html_url}`);
  }
  const sha = exec('git', ['rev-parse', 'HEAD'], options).trim();
  const repair = api(`commits/${sha}/statuses?per_page=100`, true).find(
    ({ context }) => context === 'avalon/bundle-budget',
  );
  if (repair?.state === 'success' && Date.parse(repair.created_at) > Date.parse(flag?.created_at || run.updated_at))
    return;
  throw Error(
    `В предыдущем выпуске ${flag ? 'обнаружено превышение размера бандла' : 'не завершена проверка сборки'}. Исправьте проблему, отправьте исправление в master и дождитесь успешной проверки "Check UI before release" для текущего коммита. ${flag?.target_url || run.html_url}`,
  );
}

if (require.main === module) {
  try {
    checkReleasePreflight();
    console.log('Выпуск разрешён: нет неисправленного превышения размера бандла.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { checkReleasePreflight };
