import type { BotRequest, BotReply } from './client';
import { aiText } from './language';

// A public claim is testimony, never a change to the engine's role or private knowledge.
export function claimContext(request: BotRequest) {
  const players = request.state.players || [];
  const own = players.find((p) => p.id === request.playerID);
  const previousStances = new Map<number, 'trust' | 'distrust'>();
  const claimsBySeat = new Map<number, { by: number; target: number; status: 'claim' }>();
  for (const message of request.chat) {
    if (Number(message.name) === own?.index) {
      for (const match of message.text.matchAll(
        /\bI (trust|distrust) ([1-8])'s Percival claim\.|Я (не )?доверяю заявлению ([1-8]) о роли Персиваля\.|我(不)?相信 ([1-8]) 的派西維爾聲明。/g,
      ))
        previousStances.set(
          Number(match[2] || match[4] || match[6]),
          match[1] === 'distrust' || match[3] || match[5] ? 'distrust' : 'trust',
        );
    }
    const match = message.text.match(
      /\bI am Percival\. ([1-8]) is Morgana\.|Я Персиваль\. ([1-8]) — Моргана\.|我是派西維爾。([1-8]) 是莫甘娜。/,
    );
    const target = match?.[1] || match?.[2] || match?.[3];
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
    !request.optionalSpeech &&
    ['selectTeam', 'votingForTeam', 'checkLoyalty', 'announceLoyalty'].includes(request.state.stage);
  const eligible = own && ['merlin', 'percival', 'mordred', 'morgana', 'minion', 'oberon'].includes(own.role);
  return {
    claims,
    previousStances: [...previousStances].map(([seat, stance]) => ({ seat, stance })),
    targets: publicTurn && eligible ? players.filter((p) => p.id !== request.playerID).map((p) => p.index) : [],
    claimants: publicTurn ? claims.filter((c) => c.by !== own?.index).map((c) => c.by) : [],
  };
}

export function claimSpeech(request: BotRequest, reply: BotReply) {
  const { targets, claimants } = claimContext(request);
  const text = aiText(request.language);
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
    ...stances.map((s) => text.percivalStance(s.seat, s.stance)),
    ...(target == null ? [] : [text.percivalClaim(target)]),
  ].join(' ');
}

export const claimInstructions =
  'Public role claim tactic: Merlin, true Percival and any Evil role may intentionally claim "I am Percival; X is Morgana; include me and exclude X" on any public turn allowed by claimTargets, either first or as a counterclaim. Two failures make this urgent to consider, not an exclusive right or a requirement to claim. Compare a first claim, a counterclaim, and ordinary distrust without your own claim. Normally use claimMorgana=null; if a claim helps your actual side, select X from claimTargets and explain its tactical benefit privately. ' +
  'As Evil, proactively consider claiming first to gain approval for a team with sabotage access, especially a third failure; a counterclaim can discredit the first claimant and gather winning votes. True Percival must compare counterclaiming with only expressing distrust: another claimant may be Merlin using cover. Ground your Morgana target in your own wizard pair and an evidence-based assessment; a proven Evil outside that pair is not Morgana. Distinguish suspicion from certainty. If Morgana is resolved and her inclusion threatens a third failure, consider warning during the public circle before the leader selects the final team. Merlin may claim first or counterclaim as cover to help Good. Do not publish a list of privately known Evil, identify another seat as the real Percival, or identify the other wizard as Merlin. ' +
  'A false claim does not prove the claimant is Morgana or Evil: Merlin may bluff. Accusing someone of lying challenges their testimony and does not establish a specific role. Keep your actual role, private knowledge and allies unchanged; Evil and Merlin claims are deliberate deception, not new knowledge. Public claims are testimony, not verified roles. For EACH seat in requiredClaimStances return claimStances [{seat,stance:"trust" or "distrust"}]; no abstention. State a reason in publicReason and make the team/vote consistent with the declared position. Trust favors including the claimant and excluding their accused target; distrust challenges their story but is not automatic proof they are Evil. Compare competing claims and public evidence. Preserve or explicitly revise your previous stance with a reason; never overwrite private knowledge with a bluff. The server appends the localized selected claim and stances to your public speech; do not duplicate them in publicReason.';
