import type { BotRequest, BotReply } from './client';

// A public claim is testimony, never a change to the engine's role or private knowledge.
export function claimContext(request: BotRequest) {
  const players = request.state.players || [];
  const own = players.find((p) => p.id === request.playerID);
  const previousStances = new Map<number, 'trust' | 'distrust'>();
  const claimsBySeat = new Map<number, { by: number; target: number; status: 'claim' }>();
  for (const message of request.chat) {
    if (Number(message.name) === own?.index) {
      for (const match of message.text.matchAll(/\bI (trust|distrust) ([1-7])'s Percival claim\./g))
        previousStances.set(Number(match[2]), match[1] as 'trust' | 'distrust');
    }
    const target = message.text.match(/\bI am Percival\. ([1-7]) is Morgana\./)?.[1];
    const by = Number(message.name);
    if (
      target &&
      players.some((p) => p.index === by) &&
      players.some((p) => p.index === Number(target)) &&
      by !== Number(target)
    )
      claimsBySeat.set(by, { by, target: Number(target), status: 'claim' });
  }
  const claims = [...claimsBySeat.values()];
  const publicTurn =
    request.speak &&
    !request.privateDiscussion &&
    ['selectTeam', 'votingForTeam', 'checkLoyalty', 'announceLoyalty'].includes(request.state.stage);
  const eligible = own && ['merlin', 'percival', 'mordred', 'morgana', 'minion'].includes(own.role);
  return {
    claims,
    previousStances: [...previousStances].map(([seat, stance]) => ({ seat, stance })),
    targets: publicTurn && eligible ? players.filter((p) => p.id !== request.playerID).map((p) => p.index) : [],
    claimants: publicTurn ? claims.filter((c) => c.by !== own?.index).map((c) => c.by) : [],
  };
}

export function claimSpeech(request: BotRequest, reply: BotReply) {
  const { targets, claimants } = claimContext(request);
  const target = reply.claimMorgana;
  if (target != null && !targets.includes(target)) throw Error('Invalid Percival claim target');
  const stances = reply.claimStances || [];
  if (
    !Array.isArray(stances) ||
    stances.length !== claimants.length ||
    new Set(stances.map((s) => s?.seat)).size !== claimants.length ||
    stances.some((s) => !s || !claimants.includes(s.seat) || !['trust', 'distrust'].includes(s.stance))
  )
    throw Error('A public position on each Percival claim is required');
  return [
    ...stances.map((s) => `I ${s.stance} ${s.seat}'s Percival claim.`),
    ...(target == null ? [] : [`I am Percival. ${target} is Morgana. Include me in missions and exclude ${target}.`]),
  ].join(' ');
}

export const claimInstructions =
  'Public role claim tactic: claimMorgana=null normally. Merlin, Percival and any Evil role may intentionally claim "I am Percival; X is Morgana; include me and exclude X" at any public turn, especially when their side risks losing. If justified, set claimMorgana to X from claimTargets and explain the tactical benefit privately. Keep your actual role and allies unchanged; an Evil or Merlin claim is deliberate deception, not private knowledge. Percival must distinguish a supported suspicion from certain knowledge of the wizard pair. Do not identify the other wizard as Merlin publicly. Public claims are testimony, not verified roles. For EACH seat in requiredClaimStances return claimStances [{seat,stance:"trust" or "distrust"}]; no abstention. State a reason in publicReason and make the team/vote consistent with the declared position. Trust favors including the claimant and excluding their accused target; distrust challenges their story but is not automatic proof they are Evil. Compare competing claims and public evidence. Preserve or explicitly revise your previous stance with a reason; never overwrite private knowledge with a bluff. The server appends the selected claim and stances to your public speech; do not duplicate them in publicReason.';
