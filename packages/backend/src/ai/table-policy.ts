import { AiPause, compactRequest, excludesMissionPartners } from './client';
import type { BotRequest } from './client';
import { aiText } from './language';

// Explicit table conventions requested by the owner, not alignment deduction.
// Applies identically to Good and Evil, including an Evil player's deliberate bluff.
export function tablePolicy(request: BotRequest) {
  const c = compactRequest(request);
  const positions = c.missions.filter((m) => m.participated && excludesMissionPartners(m));
  const targets = new Set(positions.flatMap((m) => m.team.filter((seat) => seat !== c.you?.seat)));
  let choices = request.choices;
  let publicReason: string | undefined;
  if (['selectTeam', 'votingForTeam'].includes(request.state.stage)) {
    if (choices.every((choice) => ['approve', 'reject'].includes(choice))) {
      const blocked = (c.proposedTeam || []).filter((seat) => targets.has(seat));
      if (blocked.length) {
        choices = choices.filter((choice) => choice === 'reject');
        const mission = positions.find((m) => m.team.some((seat) => seat !== undefined && blocked.includes(seat)))!;
        publicReason = aiText(request.language).failedMission(
          mission.n,
          mission.fails!,
          mission.team.filter((seat) => seat !== c.you?.seat),
        );
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
