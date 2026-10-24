import positions from './fixtures/human-table-positions.json';
import { guardDecision } from './guards';
import type { BotRequest } from './client';

// Positions from the human-table evaluations where a guard fires, with the revealed Evil seats (regenerate with
// lab/decision-bench.ts --fixture). Guards act on probabilities, so hindsight will sometimes disagree with one; over
// real positions no guard may break more choices than it fixes, and together they must fix three times as many.
type Position = (typeof positions)[number];
const request = (position: Position) => position.request as unknown as BotRequest;

/** Whether a choice was right given the revealed roles: a roster or vote is judged by whether the team can fail. */
function right(position: Position, choice: string) {
  const state = request(position).state;
  const failsRequired = state.settings.missions[state.mission]?.failsRequired ?? 1;
  const evilOn = (seats: number[]) => seats.filter((seat) => position.evil.includes(seat)).length;
  if (state.stage === 'selectTeam') return evilOn(choice.split(',').map(Number)) < failsRequired;
  if (state.stage === 'votingForTeam') {
    const team = state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index);
    // Evil passes a two-player opener (the card guard; 25 of 28 openers succeeded in the latest rounds), so an Evil
    // seat on it does not make approving wrong.
    if (!(state.history || []).some((event) => event.type === 'mission') && team.length === 2)
      return choice === 'approve';
    return (evilOn(team) >= failsRequired ? 'reject' : 'approve') === choice;
  }
  return choice === position.right;
}

function tally() {
  const rows: Record<string, { fixed: number; broken: number }> = {};
  for (const position of positions) {
    // Oberon cannot see its allies, so hindsight is no fair judge of its mission cards.
    if (position.role === 'oberon' && request(position).state.stage === 'onMission') continue;
    for (const choice of position.tried) {
      const guard = guardDecision(request(position), choice);
      if (!guard || guard.choice === choice) continue;
      const key = guard.reason
        .replace(/[\d%]+/g, '')
        .replace(/[\s,]+/g, ' ')
        .trim()
        .slice(0, 48);
      const row = (rows[key] ??= { fixed: 0, broken: 0 });
      if (!right(position, choice) && right(position, guard.choice)) row.fixed++;
      if (right(position, choice) && !right(position, guard.choice)) row.broken++;
    }
  }
  return rows;
}

test('on real positions each guard fixes at least as many choices as it breaks, and all together far more', () => {
  const rows = tally();
  for (const [guard, { fixed, broken }] of Object.entries(rows))
    expect({ guard, fixed, broken, ok: broken <= fixed }).toMatchObject({ guard, ok: true });
  const fixed = Object.values(rows).reduce((sum, row) => sum + row.fixed, 0);
  const broken = Object.values(rows).reduce((sum, row) => sum + row.broken, 0);
  expect(fixed).toBeGreaterThanOrEqual(3 * broken);
});
