import type { BotRequest, BotReply } from './client';

// A public claim is testimony, never a change to the engine's role or private knowledge.
export function claimContext(request: BotRequest) {
  const players = request.state.players || [];
  const own = players.find((p) => p.id === request.playerID);
  // Intent is understood by the model. Only explicit structured bot actions are recorded here.
  const validSeat = (seat: number) => players.some((p) => p.index === seat);
  const claims = (request.publicRoleClaims || []).filter(
    (c) => validSeat(c.by) && validSeat(c.target) && c.by !== c.target,
  );
  const previousStances = (request.previousClaimStances || []).filter(
    (s) => validSeat(s.seat) && s.seat !== own?.index,
  );
  const publicTurn =
    request.speak &&
    !request.councilDiscussion &&
    !request.optionalSpeech &&
    ['selectTeam', 'votingForTeam', 'checkLoyalty', 'announceLoyalty'].includes(request.state.stage);
  const eligible = own && ['merlin', 'percival', 'mordred', 'morgana', 'minion', 'oberon'].includes(own.role);
  return {
    claims,
    previousStances,
    targets: publicTurn && eligible ? players.filter((p) => p.id !== request.playerID).map((p) => p.index) : [],
    claimants: publicTurn ? claims.filter((c) => c.by !== own?.index).map((c) => c.by) : [],
    stanceTargets: publicTurn ? players.filter((p) => p.id !== request.playerID).map((p) => p.index) : [],
  };
}

export function validateClaims(request: BotRequest, reply: BotReply) {
  const { targets, stanceTargets } = claimContext(request);
  const target = reply.claimMorgana;
  if (target != null && !targets.includes(target)) throw Error('Invalid Percival claim target');
  const stances = reply.claimStances || [];
  if (
    !Array.isArray(stances) ||
    new Set(stances.map((s) => s?.seat)).size !== stances.length ||
    stances.some((s) => !s || !stanceTargets.includes(s.seat) || !['trust', 'distrust'].includes(s.stance))
  )
    throw Error('Invalid public claim position');
}

export const claimInstructions =
  'Understand role claims by meaning in chat and humanStatements, including indirect wording, quotations, denials, corrections and withdrawals. Attribute each statement to its author. Claims are testimony, never changes to your actual role or private knowledge. publicRoleClaims contains historical structured bot declarations, not all human claims or necessarily still active claims. ' +
  'You choose whether and when to respond, believe, challenge, bluff or counterclaim. Use claimStances only for positions you actually express this turn, among claimStanceTargets; otherwise return []. Use claimMorgana only when deliberately claiming Percival this turn, targeting claimTargets. Write that claim or stance yourself in publicReason, naturally in your own voice: the server adds no wording. An earlier stance may be retained, questioned or revised with new evidence. A false Percival claim could also be Merlin using cover. Never identify the other wizard as Merlin or publish a private list of Evil. Other role claims can be assessed in publicReason and evidence.';
