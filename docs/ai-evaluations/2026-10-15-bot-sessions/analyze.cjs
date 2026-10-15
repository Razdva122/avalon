const fs = require('node:fs');
const path = require('node:path');
const inputPath = path.resolve(process.argv[2] || path.join(__dirname, 'results.json'));
const directory = path.dirname(inputPath);
const report = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
function describe(calls) {
  const completed = calls.filter((c) => c.usage);
  const total = (key) => completed.reduce((n, c) => n + (c.usage[key] || 0), 0);
  const input = total('input_tokens');
  const cached = total('cached_input_tokens');
  const output = total('output_tokens');
  return {
    attemptedCalls: calls.length,
    measuredCalls: completed.length,
    input,
    cached,
    uncached: input - cached,
    output,
    inputPerCall: completed.length ? input / completed.length : null,
    uncachedPerCall: completed.length ? (input - cached) / completed.length : null,
    outputPerCall: completed.length ? output / completed.length : null,
    cachedInputShare: input ? cached / input : null,
    cacheHitCalls: completed.filter((c) => c.usage.cached_input_tokens > 0).length,
    failedCalls: calls.filter((c) => c.error).length,
    submittedInputBytes: completed.every((c) => typeof c.submittedInputBytes === 'number')
      ? completed.reduce((n, c) => n + c.submittedInputBytes, 0)
      : null,
  };
}
const summary = report.games.map((g) => {
  const traces = fs
    .readFileSync(path.join(directory, `${g.mode}-traces.jsonl`), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse);
  const votesWithKnownFail = traces.filter((t) => {
    const c = t.payload.context;
    return (
      t.stage === 'votingForTeam' &&
      c.you?.side === 'good' &&
      c.actionFacts?.failsRequired === 1 &&
      c.actionFacts.knownEvilOnTeam?.length > 0
    );
  });
  const decisiveEvilCards = traces.filter((t) => {
    const c = t.payload.context;
    return (
      t.stage === 'onMission' &&
      c.you?.side === 'evil' &&
      c.score?.failures === 2 &&
      c.missionRule?.failureAtLeast === 1
    );
  });
  const players = [...new Set(g.calls.filter((c) => c.stage !== 'end').map((c) => c.player))].map((player) => {
    const calls = g.calls.filter((c) => c.player === player && c.stage !== 'end' && c.usage);
    return {
      player,
      calls: calls.length,
      firstInput: calls[0]?.usage.input_tokens,
      lastInput: calls.at(-1)?.usage.input_tokens,
      peakInput: Math.max(...calls.map((c) => c.usage.input_tokens)),
    };
  });
  return {
    mode: g.mode,
    status: g.status,
    result: g.result,
    missions: g.state?.missionState,
    finalPublicRecord: traces.find((t) => t.stage === 'end')?.payload.context,
    minutes: g.wallMs / 60000,
    play: describe(g.calls.filter((c) => c.stage !== 'end')),
    reviews: describe(g.calls.filter((c) => c.stage === 'end')),
    all: describe(g.calls),
    stages: Object.fromEntries(
      [...new Set(g.calls.map((c) => c.stage))].map((stage) => [
        stage,
        describe(g.calls.filter((c) => c.stage === stage)),
      ]),
    ),
    players,
    pauses: g.pauses || [],
    automatedQualityChecks: {
      goodKnownFailVotes: votesWithKnownFail.length,
      goodKnownFailApprovals: votesWithKnownFail.filter((t) => t.choice === 'approve').map((t) => t._id),
      decisiveEvilCardOpportunities: decisiveEvilCards.length,
      decisiveEvilSuccessCards: decisiveEvilCards.filter((t) => t.choice === 'success').map((t) => t._id),
    },
    quotaBefore: g.quotaBefore,
    quotaAfter: g.quotaAfter,
  };
});
fs.writeFileSync(
  path.join(directory, path.basename(inputPath) === 'live-results.json' ? 'live-summary.json' : 'summary.json'),
  JSON.stringify(summary, null, 2) + '\n',
);
console.log(JSON.stringify(summary, null, 2));
