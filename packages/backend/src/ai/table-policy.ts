import { AiPause, compactRequest } from './client';
import type { BotRequest } from './client';

// Explicit table conventions requested by the owner, not alignment deduction.
// Applies identically to Good and Evil, including an Evil player's deliberate bluff.
export function tablePolicy(request: BotRequest) {
  const c = compactRequest(request);
  const positions = c.missions.filter(
    (m) => m.participated && ((m.team.length === 2 && m.fails === 1) || (m.team.length === 3 && m.fails === 2)),
  );
  const targets = new Set(positions.flatMap((m) => m.team.filter((seat) => seat !== c.you?.seat)));
  let choices = request.choices;
  let publicReason: string | undefined;
  if (['selectTeam', 'votingForTeam'].includes(request.state.stage)) {
    if (choices.every((choice) => ['approve', 'reject'].includes(choice))) {
      const blocked = (c.proposedTeam || []).filter((seat) => targets.has(seat));
      if (blocked.length) {
        choices = choices.filter((choice) => choice === 'reject');
        const mission = positions.find((m) => m.team.some((seat) => seat !== undefined && blocked.includes(seat)))!;
        publicReason = `I am Good. Mission ${mission.n} had ${mission.fails} Fail card(s); ${mission.team.filter((seat) => seat !== c.you?.seat).join(' and ')} betrayed us. I reject teams with them.`;
      }
    } else if (choices.every((choice) => /^\d+(, \d+)*$/.test(choice))) {
      choices = choices.filter((choice) =>
        choice
          .split(', ')
          .map(Number)
          .every((seat) => !targets.has(seat)),
      );
      const withSelf = choices.filter((choice) =>
        choice
          .split(', ')
          .map(Number)
          .includes(c.you?.seat as number),
      );
      if (withSelf.length) choices = withSelf;
    }
    if (!choices.length)
      throw new AiPause('Нет команды, совместимой с заданными постулатами игрока. Партия приостановлена.');
  }
  return { choices, publicReason };
}
