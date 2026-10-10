import { claimContext, validateClaims } from './claims';
import { languageInstruction } from './language';
import type { AiLanguage, VisualGameState } from '@avalon/types';

export type BotRequest = {
  playerID: string;
  humanPlayerID?: string;
  // Public declarations and this bot's prior positions come from structured model actions, never text parsing.
  publicRoleClaims?: { by: number; target: number; status: 'claim' }[];
  previousClaimStances?: { seat: number; stance: 'trust' | 'distrust' }[];
  name: string;
  style: string;
  language?: AiLanguage;
  task: string;
  speak: boolean;
  state: VisualGameState;
  chat: { id?: string; name: string; text: string }[];
  choices: string[];
  privateCheck?: string;
  evilEvidence?: { name: string; text: string }[];
  evilCouncil?: { seat: string; target: string; reason: string }[];
  councilDiscussion?: boolean;
  // A preferred roster voiced before the leader selects; never a submitted action or vote.
  publicDiscussion?: boolean;
  optionalSpeech?: boolean;
  rolesKnownBeforeReveal?: [number, string][];
};
export type DecisionEvidence = {
  kind: 'fact' | 'deduction' | 'testimony' | 'prediction' | 'bluff';
  key: string;
  fact: string;
  source: string;
  certainty: 'proven' | 'claim' | 'bluff';
};
export type BotReply = {
  choice: number;
  speech: string;
  privateReason?: string;
  claimMorgana?: number | null;
  claimStances?: { seat: number; stance: 'trust' | 'distrust' }[];
  publicReason?: string;
  evidence?: DecisionEvidence[];
};
export type Decide = (request: BotRequest, signal?: AbortSignal) => Promise<BotReply>;
export class AiPause extends Error {}
export class AiTechnicalPause extends AiPause {}

export const ladyTransferPreference =
  'When legal inspection targets offer comparable information and tactical value, Good should prefer passing the Lady to a player supported as Good by reliable evidence. The inspected player becomes the next holder: keeping the Lady with Good helps build a directed trust chain through subsequent truthful checks. If the Lady reaches Evil, later announcements from that holder are untrusted testimony and cannot extend that chain without independent reliable support. This does not invalidate earlier reliable checks. This is a tie-breaker, not a reason to ignore a more decisive inspection or proven facts. Unknown is not confirmed Good; an untrusted public Good claim alone is not reliable evidence. Evil should choose for its own side, including taking control of the Lady or disrupting Good trust, rather than preserving a Good trust chain.';

export const coalitionAdvice =
  "Good coalition decision: compare FULL-roster mission safety FIRST, vote support SECOND, against one reachable legal alternative. Name changed seats and the mission, vote or trusted-check evidence making a replacement safer. Never buy support by adding a stronger suspect when a safer option is reachable. Your known own Good alignment can improve safety when replacing an unresolved or suspected seat; absence alone is not a veto, and inclusion never clears teammates. Do not exhaust early proposals rotating unresolved seats for self-inclusion: join a justified coalition. Prefer a less suspicious reachable team before proof; never buy information by approving a stronger suspect. Discussion may endorse another player's roster; only the final leader follows self-inclusion. Count likely, conditional and unknown supporters from recorded votes or statements, including your changed vote. Unknown votes are not confirmed Rejects. If Evil blocks together and approvalsRequired needs every Good vote, one Good refusal blocks a clean team. Persuade a named missing voter with evidence before replacing a trusted seat for support. This arithmetic identifies no one's alignment. One vote short can still be reachable; the previous leader's preference is not inevitable. On proposals 1-4 seek a safer roster with a credible path to approvalsRequired, not guaranteed votes. If rejecting, name a reachable replacement and its safety advantage; absence, popularity or a new name alone is insufficient. At two failed missions, the next mission failure loses: use early proposals for safer alternatives, never approve to test a suspect or merely get a result. Suspicion can justify rejection without certainty when a safer option is reachable; unknowns alone do not require rejecting every roster. On proposal 4 compare current risk with the fifth leader's feasible roster under tableConventions. Proposal 5 runs automatically with NO votes or supporters: choose for your side under self-inclusion and partner exclusions. Never approve a roster reliably proven to lose under failsRequired. Recompute ALL Fail constraints using your own card, trusted Good and remaining Evil slots. Different Evil can sabotage different missions: overlap alone neither convicts the common participant nor clears the others. Intersect failed rosters as one hidden culprit only when all other Evil are accounted for and excluded from those missions. Zero-Fail success is weak support, not clearance. Retain sourced exclusions; revise preferences for new evidence or a concrete safety improvement. Evil may exploit disagreement for its own objective.";

export const openingAdvice =
  "Opening information tradeoff: one early Reject on mission 1 can be useful even on your own roster, but name a concrete reachable alternative, what its roster or recorded votes could teach, and how that would change your next decision. Do not spend proposals merely to include yourself or rotate unknown seats. Rejection costs one proposal, may reveal no alignment and does not guarantee enough Good approvals to reach approvalsRequired. Before repeating a rejected roster, ask a named missing voter what evidence would change their vote. On proposal 4, Reject sends the fifth leader's feasible roster automatically with NO further vote; it produces no extra voting evidence before running. Compare its mission risk under tableConventions with the current roster. Never approve a proven losing roster for information. Evil judges approval and rejection by its own objective.";

export const evilVisibilityAdvice =
  'Evil knowledge is limited to privateKnowledge and the public roleCounts. Oberon is possible only if roleCounts.oberon is positive; then Oberon does not know allies and is not shown to other Evil during missions, so a roster with no KNOWN Evil may still contain Oberon. Never invent an absent role or an extra Evil slot beyond alignmentCounts. The sabotage convention covers known participants only; any unresolved allies may act independently. Reveal-stage knowledge may be used only after the game state actually reveals it.';

export const tableConversationAdvice =
  'You are a player in an ongoing conversation. Read the latest words as part of that conversation, especially questions or objections to you; do not restart a generic team report every turn. Choose what matters now: answer, object, negotiate, accuse, defend, ask, agree briefly, or stay silent if you have nothing useful to add. No fixed sentence pattern or required question. Use natural language and bare seat numbers, within 240 characters. ' +
  'Your personality may affect risk, persuasion and trust among plausible choices, while your actual side, known facts and legal actions remain binding. Let personality shape your pace, tone, willingness to press a question and way of negotiating, not just the roster you prefer. Answer the current person rather than reciting your profile. Do not append the same disclaimer to every reply: state uncertainty when it changes the decision, then argue your preference directly. Your own alignment is private confidence, not a public reason to replace someone with yourself. Brief agreement, frustration at an unanswered question, warmth, a pointed objection and silence are all available when earned by the conversation; never force a question or emotion. Keep your own voice; do not manufacture events for drama. humanStatements retains earlier testimony; compare it with the actual votes and missions. offTeamVotingPatterns summarizes public votes, not proven alignment. A discussion choice is a preference before selection; the final leader chooses after the circle. Voting itself is silent.';

export const merlinAuthorshipCheck =
  'Before publishing, privately check your argument from the viewpoint of a Good player with ONLY the public record and their own participation. Would that player have a reason for this exact preference now? Apply the same public standard to competing claims: if two Lady announcements are disputed, do not endorse the secretly correct one or dismiss the other without a distinguishing PUBLIC fact. Knowing the answer is not that fact. If challenged, answer from the record rather than switching to a new justification just to defend secret certainty. Keep unresolved public alternatives unresolved even when you privately know which is true. Choose with all your private knowledge, but explain only what the public evidence supports; a short preference or silence is available when no honest public explanation adds value. Do not announce this concealment check. Review your recent words AND votes: repeatedly excluding precisely the visible Evil, uniquely trusting the right claimant, or following clean teams from outside can expose you even without originating them. Among comparably safe and reachable options, vary how you contribute naturally: support an existing public case, ask a relevant question, negotiate, or let others lead. This is not a fixed rotation or a reason to randomize votes. Preserve a viable winning team; never fabricate evidence, sabotage or select a proven losing roster for cover. Evaluate the actual Fail threshold: one Evil cannot fail a two-Fail mission. Your public voice should still sound like your personality, not a generic cautious analyst.';

export const assassinationCheck =
  'Brief assassination check: screen EVERY legal target, including quiet followers, before comparing the strongest TWO. For each early accurate choice ask whether public facts, self-inclusion or Percival knowledge could explain it at that time. A clue shared by both finalists does not distinguish them. A clean proposal, its later success and council repetition are one evidence chain, not three independent clues. Base the final comparison on a distinguishing clue and an innocent explanation, not activity or repeated council agreement.';

export function systemFor(request: BotRequest): string {
  const format =
    languageInstruction(request.language) +
    ' Return only {"choice":"exact entry from choices","speech":"..."}. Copy a legal choice exactly. When speak=false speech=""; otherwise write complete short sentences, at most 240 characters (800 at end). Facts override testimony; do not invent actions.' +
    (request.publicDiscussion
      ? ' This is a preselection discussion preference, not a submitted team or a binding vote. Recommend a roster, discuss trust and answer or ask about actual earlier votes; the leader selects after the full circle. Do not announce a current approve/reject vote.'
      : request.optionalSpeech
        ? ' Choose the final team after the full circle. Your announcement is optional: speech="" submits silently.'
        : '');
  if (request.state.stage === 'end')
    return `${format} Review the finished game honestly. Explain the cause behind one consequential decision for your side, not just the rule that ended the game. Winning does not make every decision correct. Use assassinations and mission cards, not other players' conclusions. Automatic proposals are not voluntary votes. Revealed roles were not necessarily known during play. Admit public role leaks shown in yourStatements. No need to bluff now.`;
  const rules =
    evilVisibilityAdvice +
    " Good needs 3 mission successes AND Merlin surviving assassination. Evil needs 3 failures OR killing Merlin after 3 successes. Success never proves alignment. Private knowledge is not public evidence: never reveal Merlin's identity, Percival's wizard pair or Evil allies as actual allies in public speech. Intentional Percival claims allowed by claimTargets do not disclose the other wizard or change private knowledge. Lady announcements are claims, not verified public alignment. Unknown means unknown. Current privateKnowledge and score override old memory and public claims. A player marked evil in your private knowledge remains Evil regardless of helpful behavior. Percival must use the mysteryWizard pair: exactly one is Merlin and one Morgana, not two unknown ordinary players.";
  const ladyTrust =
    'Lady trust for Good: your own actual Good inspection proves that target Good with certainty. If you announced Good truthfully, seek to include that player in EVERY proposed mission alongside yourself, ahead of untested seats, and strongly prefer such rosters when voting. If this trusted player later announces another target Good, extend your trusted core along that directed check chain and favor both in future teams. Preserve the chain and its sources in private memory. Example only: you checked 2 Good; 2 checked 4 and announced Good; favor yourself, 2 and 4 when team size permits. Your direct result is proven; the later link relies on the trusted checker telling the truth. Public Good announcements from untrusted players do not establish this chain. Never treat your own false Good announcement as real knowledge. Fit the legal team size, prioritize directly verified Good when space is limited, and do not approve a dangerous full roster merely because it includes a trusted player. Evil can imitate this public trust but must still act for Evil.';
  const deductionExamples =
    'Mission deduction examples (illustrations, NOT events from this game): (1) Team [you, 1], yourCard=Success, fails=1: 1 played Fail and is Evil. (2) Team [you, 1, 2], yourCard=Success, fails=2: BOTH 1 and 2 played Fail and are Evil. (3) The same three-person team with only one Fail proves at least one of 1 and 2 is Evil, not which one or both. (4) A successful mission does not prove its members Good: Evil may play Success. (5) When two Fails are required, a team with exactly one Evil cannot fail; one known Evil does not establish how many unknown teammates are Evil. Use only your own visible card and recorded fails during play, never hidden cards. A Good voter should not treat rejection of a failed team as evidence of Evil. Keep proven deductions across turns; do not replace them with unsupported trust. Choose for YOUR side: Good normally avoids proven saboteurs; Evil may exploit them while hiding its motive.';
  switch (request.state.stage) {
    case 'onMission':
      return `${format} ${rules} Choose a secret card for YOUR side. Good must play Success. Evil must compare Success for cover against Fail for sabotage on EVERY mission. Name the concrete benefit of gaining trust (future invitations, hiding an ally or access to later decisive missions), the exposure caused by a Fail, and the score risk. A cover Success is a deliberate investment, not evidence that you or your allies became Good. Use missionRule: one Fail cannot defeat a mission needing two. Your card does not cancel another card. Compare Success and Fail against the current score: at two Good successes, another success immediately triggers assassination. If two Evil are on a mission requiring two Fails, both need Fail to defeat it. Do not rely on one ally alone. Shared sabotage convention: if sabotage is strategically needed, the lowest-numbered known Evil participants, up to failsRequired, play Fail; additional Evil play Success to avoid redundant revealing cards. This is a coordination convention, not knowledge of future cards. With exactly two Evil and a two-Fail threshold both must Fail. With two Good successes prioritize preventing the third success over hypothetical future trust; with two Evil failures prioritize winning now when enough Evil are present. Never sacrifice a decisive sabotage merely to gain trust for a round that may never happen. If too few Evil are present to reach failsRequired, a Fail cannot change the mission result and only exposes information. With a safe score margin, a cover Success can be preferable; identify its concrete benefit and the next opportunity. A successful mission does not prove anyone Good.`;
    case 'checkLoyalty':
    case 'announceLoyalty':
      return `${format} ${rules} ${ladyTrust} ${ladyTransferPreference} Lady checks alignment and passes to the inspected player; past holders cannot be checked. Good announces privateKnowledge.inspectionResult truthfully by default: Lady explains the knowledge without revealing Merlin. A lie requires a concrete protective tactic. Evil may lie for its side. inspectionTarget is NOT a mission team.`;
    case 'assassinate':
      return `${format} ${rules} Find Merlin, not merely an active Good leader. Compare direct role claims with behavior, possible bluffs and privileged knowledge of Evil excluding Mordred. All Evil share this objective. When councilDiscussion=true your speech appears in the PUBLIC room chat: recommend the SAME target as choice, cite evidence, compare an alternative and respond to previous advice. A Lady Good result does NOT exclude Merlin: Merlin is Good, and Lady reveals alignment, not role. Leadership, taking a Lady check and mission success are weak signals available to any Good player. Seek correct alignment knowledge expressed BEFORE it became public; match each clue to its time and possible source. A deduction following public Fail cards or a Lady announcement is not unique Merlin knowledge. Merlin cannot see Mordred: naming Mordred after a public check is not evidence of secret sight. Compare early statements against later statements, and actively challenge the first council suggestion. A Good Lady result never rules out Merlin. In council, give one piece of evidence for your candidate and one reason an alternative could be Merlin; challenge unsupported earlier advice instead of merely agreeing. The designated assassin chooses after comparing alternatives, not by council popularity. Public testimony is evidence, not proof. ${assassinationCheck}`;
    default:
      return `${format} ${rules} ${deductionExamples} ${ladyTrust} ${coalitionAdvice} ${request.state.mission === 0 ? openingAdvice : ''} Use the legal choices and public tableConventions, including self-inclusion in your own proposals. Good reduces unknowns; Evil gains trust or sabotage opportunities. Prefer coherent teams over equally safe teams with players opposing each other; conflict is not proof. On proposals 1-4 a majority approves; proposal 5 needs no votes or supporters. Reject cancels ONLY the proposal, rotates the leader and leaves the mission number and score unchanged. Fail is a secret mission card, NOT a vote. Example only: score 0-0, team [1,4] rejected means still 0-0 with NO completed mission. Approving an Evil team allows sabotage; rejecting it prevents that attempt. Proposal 5 is automatic, not an Evil win. If the fifth leader is suspicious, seek an acceptable earlier team without blindly accepting a losing roster. Follow missionRule, not intuition about Fail counts. Never claim to join a team without your seat. Reassess even your own unchanged proposal using mission risk, coalition support and the opening information tradeoff. Discuss preferences before selection; voting after the final selection is silent. You may explain earlier recorded votes in the next discussion. An optional final proposal speech explains the selected roster without repeating it.`;
  }
}

const roleAdvice: Record<string, string> = {
  merlin:
    'Your survival is part of winning, not an optional final step. Before a public stance, compare what a normal Good player could infer at that moment with your private knowledge. Prefer a genuinely supported public rationale and a viable coalition over becoming the sole consistently correct guide. Let others voice supported suspicions; avoid repeatedly certifying the same players before public evidence. Preserve mission safety: concealment is not a reason to approve a proven losing roster or invent evidence. Never publicly name your role or quote your secret Evil list. Guide Good with public evidence in your own personality; private uncertainty need not become a disclaimer on every reply. Never call someone confirmed Evil publicly just because you can see their role. Track whether other players repeatedly cite you as the sole source: that exposes you. Do not reveal the other wizard when making an intentional Percival cover claim. Evaluate the whole roster against failsRequired. With two Fails required, exactly one Evil is SAFE for the mission even if that player always plays Fail; approving it can secure the third success. Reject if a second Evil could be present and a safer roster is available. Use your actual visible Evil seats and roleCounts, never a fixed number. If visible Evil does not account for every slot in alignmentCounts.evil, unknown seats may contain the remaining Evil; use completed missions to locate it. When all Evil slots are accounted for, do not invent another Evil. Keep public explanations separate from this private knowledge.' +
    ' ' +
    merlinAuthorshipCheck,
  percival:
    'Your wizard pair contains Merlin and Morgana; you do NOT initially know which is which. Treat them as candidates, never label either Morgana as fact without evidence. Track the actual author of Lady claims. Protect likely Merlin without exposing the pair or your certainty. Once you privately resolve the pair, do not publicly certify the remaining wizard as Good or repeatedly single them out as the uniquely reliable guide. Actively provide cover: when a wizard candidate offers a sound roster or suspicion, independently assess it and take responsibility for the grounded public argument, recruiting support and asking follow-up questions yourself. Do not advertise that you are following that candidate or that they are uniquely accurate. While the pair is unresolved, never blindly trust either candidate; mission safety and evidence still decide. Build support from public mission and vote evidence; never fabricate evidence or reveal the pair. Protect likely Merlin by being another plausible informed guide, not by explaining who you are protecting or publicly naming your role outside an allowed intentional claim. Compare the wizard candidates’ early votes and support for later-exposed Evil; a good mission alone does not resolve the pair. You may make an intentional Percival claim via claimMorgana without naming the other wizard. Before blaming a repeated participant, account for the required Evil inside your pair: a one-Fail mission containing BOTH candidates is already explained by Morgana, so that Fail alone neither incriminates another participant nor resolves the pair. Compare the candidates’ proposals and recorded votes across changing rosters; retain plausible alternatives instead of deciding by confidence or popularity. Keep this pair accounting private; publicly argue from mission and vote evidence without exposing either candidate. Your initial private knowledge does not reveal other alignments; use actual mission and check deductions.',
  servant:
    'You are ALWAYS Good. Winning includes keeping Merlin alive, so actively help provide cover even though you do not know who Merlin is. Form your own suspicions from mission rosters, recorded votes and public contradictions; propose a concrete team, question a suspect and defend your assessment rather than merely follow the loudest guide. Speak firmly about a supported position without claiming proof you lack; keep uncertain hypotheses uncertain in private reasoning. When another player makes a sound case, explain why YOU support it from public evidence, not because that player seems to know the roles. This should make several Good players plausible informed guides without identifying or announcing a cover target. Do not invent private knowledge, inspections or events, blindly copy votes, or approve a more dangerous roster merely to look like Merlin. Deliberate mission failure or helping Evil NEVER benefits you.',
  mordred:
    'Only YOU are hidden from Merlin. Conceal your allies; fake credible Good arguments. Choose Success for cover or Fail to advance Evil, never announce sabotage.',
  morgana:
    'Percival may mistake you for Merlin; cultivate credible guidance. Merlin DOES see you as Evil. Exploit uncertainty without exposing yourself or allies.',
  oberon:
    'You are Evil and do not know your allies; they do not recognize you during missions. Merlin DOES see you as Evil. Win for Evil using public evidence and your own secret card, without inventing ally identities. Unknown teammates may be Good or Evil; never assume they are allies or that your card is the only possible Fail. Choose sabotage or a cover Success from the score and failsRequired. You cannot rely on coordinated cards from unseen allies. After roles are explicitly revealed at assassination, use that newly available knowledge.',
  minion:
    'Help Evil through votes and mission cards while posing as Good. Look for Merlin among players consistently avoiding you and Morgana. Do not admit sabotage.',
};

// Public table convention, independent of the observer's role and private card.
export function excludesMissionPartners(mission: { team: readonly unknown[]; fails?: number }) {
  return (mission.team.length === 2 && mission.fails === 1) || (mission.team.length === 3 && mission.fails === 2);
}

export function compactRequest(request: BotRequest) {
  const { state } = request;
  const claims = claimContext(request);
  const players = state.players || [];
  const playerCount = players.length;
  const alignmentCounts =
    state.settings?.players ??
    (playerCount === 5
      ? { good: 3, evil: 2 }
      : playerCount === 6
        ? { good: 4, evil: 2 }
        : playerCount === 7
          ? { good: 4, evil: 3 }
          : playerCount === 8
            ? { good: 5, evil: 3 }
            : undefined);
  // The lineup is public; never infer these totals from private seat assignments.
  const roleCounts = state.settings?.roles
    ? [...state.settings.roles.good, ...state.settings.roles.evil].reduce<Record<string, number>>((counts, role) => {
        counts[role] = (counts[role] || 0) + 1;
        return counts;
      }, {})
    : undefined;
  const seat = (id?: string) => players.find((p) => p.id === id)?.index;
  const own = players.find((p) => p.id === request.playerID);
  let ownRoleAdvice = own && roleAdvice[own.role];
  if (own?.role === 'merlin') {
    const visibleEvil = players.filter((p) => ['evil', 'mordred', 'morgana', 'minion', 'oberon'].includes(p.role));
    ownRoleAdvice += ` You currently see ${visibleEvil.length} Evil seat(s) in privateKnowledge.rolesVisibleToYou.`;
    if (roleCounts?.mordred)
      ownRoleAdvice +=
        ' Mordred is in this lineup and hidden from you. If a failed mission contained no visible Evil, hidden Mordred was among its participants. Retain the whole candidate set, reduce it only with mission constraints or reliable private knowledge, and compare candidates when replacing a seat. Easier approval is not a reason to clear or select one of these suspects. Never clear those suspects merely because they are not visible Evil.';
    else if (roleCounts) ownRoleAdvice += ' Mordred is absent from this lineup; do not invent a hidden Mordred.';
  }
  const side = own && (['mordred', 'morgana', 'minion', 'oberon'].includes(own.role) ? 'evil' : 'good');
  const seats = [...players].sort((a, b) => a.index - b.index);
  const leaderPosition = seats.findIndex((p) => p.features.isLeader);
  const proposal =
    leaderPosition >= 0 && Number.isInteger(state.vote) && state.vote >= 0 && state.vote <= 4
      ? {
          number: state.vote + 1,
          fifthLeader: seats[(leaderPosition + 4 - state.vote) % seats.length].index,
          rejectionsUntilForced: 4 - state.vote,
          forced: state.vote === 4,
        }
      : undefined;

  const end = state.stage === 'end';
  const assassination = state.stage === 'assassinate';
  const teamStage = ['selectTeam', 'votingForTeam', 'onMission'].includes(state.stage);
  const voting = ['selectTeam', 'votingForTeam'].includes(state.stage);
  const inspection = ['checkLoyalty', 'announceLoyalty'].includes(state.stage);
  const team = players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index);
  const history = state.history || [];
  const missions = history
    .filter((e) => e.type === 'mission')
    .filter((e) => e.result)
    .map((e) => {
      const action = e.actions.find((a) => a.playerID === request.playerID);
      return {
        n: e.index + 1,
        failsRequired: e.settings?.failsRequired ?? state.settings?.missions[e.index]?.failsRequired,
        leader: seat(e.leaderID),
        team: e.actions.map((a) => seat(a.playerID)),
        result: e.result,
        fails: e.fails,
        participated: Boolean(action),
        cards: end ? e.actions.map((a) => [seat(a.playerID), 'value' in a ? a.value : 'unknown']) : undefined,
        yourCard: action && 'value' in action ? action.value : undefined,
      };
    });

  let missionNumber = 1;
  let attempt = 0;
  const votes = history.flatMap((e) => {
    if (e.type === 'mission' && e.result) {
      missionNumber = e.index + 2;
      attempt = 0;
    }
    if (e.type !== 'vote') return [];
    return [
      {
        mission: missionNumber,
        attempt: ++attempt,
        leader: seat(e.leaderID),
        team: e.team.map((p) => seat(p.id)),
        result: e.result,
        forced: e.forced,
        votes: e.forced
          ? 'automatic: no vote cast'
          : Array.isArray(e.votes)
            ? e.votes.map((v) => [seat(v.playerID), v.value])
            : e.votes,
        yourVote: e.forced
          ? 'automatic: no vote cast'
          : Array.isArray(e.votes)
            ? e.votes.find((v) => v.playerID === request.playerID)?.value
            : undefined,
      },
    ];
  });
  const checks = history.filter((e) => e.type === 'announceLoyalty');
  // Public voting facts only; a rejected proposal never inherits a later mission's result.
  const offTeamApprovals = votes.slice(-25).flatMap((v) => {
    if (v.forced || !Array.isArray(v.votes)) return [];
    const approvingSeats = v.votes.flatMap(([voter, value]) =>
      typeof voter === 'number' && value === 'approve' && !v.team.includes(voter) ? [voter] : [],
    );
    if (!approvingSeats.length) return [];
    const mission = v.result === 'approve' ? missions.find((m) => m.n === v.mission) : undefined;
    return [
      {
        mission: v.mission,
        attempt: v.attempt,
        team: v.team,
        seats: approvingSeats,
        proposalResult: v.result,
        missionResult: mission?.result,
        fails: mission?.fails,
      },
    ];
  });
  const offTeamVotingPatterns = seats.flatMap(({ index }) => {
    const support = offTeamApprovals.filter((v) => v.seats.includes(index));
    if (!support.length) return [];
    return [
      {
        seat: index,
        approvals: support.length,
        soleApprovals: support.filter((v) => v.seats.length === 1).length,
        failedMissionApprovals: support.filter((v) => v.missionResult === 'fail').length,
        supportedSeats: seats.flatMap(({ index: partner }) => {
          const approvals = support.filter((v) => v.team.includes(partner)).length;
          return approvals ? [{ seat: partner, approvals }] : [];
        }),
      },
    ];
  });
  const humanSeat = seat(request.humanPlayerID);
  const humanMessages = humanSeat === undefined ? [] : request.chat.filter((m) => m.name === String(humanSeat));
  // Keep opening evidence and recent revisions even when bot dialogue displaces the recent chat.
  // ponytail: bounded to 24 human statements; larger histories need a sourced testimony summary.
  const humanStatements = humanMessages
    .filter((_, i) => i < 8 || i >= humanMessages.length - 16)
    .map((m) => ({ by: humanSeat!, text: m.text.slice(0, 600), status: 'claim' as const }));
  const failsRequired = state.settings?.missions[state.mission]?.failsRequired;
  return {
    you: own && {
      seat: own.index,
      role: own.role,
      side,
      outcome: state.result && (state.result.winner === side ? 'won' : 'lost'),
    },
    personality: request.style,
    language: request.language ?? 'en',
    playerCount,
    approvalsRequired: Math.floor(playerCount / 2) + 1,
    tableConventions: { includeSelfInProposals: false, excludedPartners: [] },
    alignmentCounts,
    roleCounts,
    roleAdvice: end ? undefined : ownRoleAdvice,
    stage: state.stage,
    task: request.task,
    speak: request.speak,
    publicDiscussion: Boolean(request.publicDiscussion),
    optionalSpeech: Boolean(request.optionalSpeech),
    objective: end
      ? undefined
      : side === 'good'
        ? 'Win successful missions AND keep Merlin alive.'
        : 'Win three failed missions OR assassinate Merlin after three successes.',
    privateKnowledge: end
      ? undefined
      : {
          rolesVisibleToYou: players.map((p) => [p.index, p.role]),
          checks: checks
            .filter((e) => e.actual !== undefined)
            .map((e) => ({ by: seat(e.announcerID), target: seat(e.targetID), actual: e.actual })),
          inspectionResult: inspection ? request.privateCheck : undefined,
        },
    revealedRoles: end ? players.map((p) => [p.index, p.role]) : undefined,
    rolesKnownBeforeReveal: end ? request.rolesKnownBeforeReveal : undefined,
    score: {
      successes: missions.filter((m) => m.result === 'success').length,
      failures: missions.filter((m) => m.result === 'fail').length,
    },
    proposal: voting ? proposal : undefined,
    mission: teamStage ? state.mission + 1 : undefined,
    teamSize: teamStage ? state.settings?.missions[state.mission]?.players : undefined,
    proposedTeam: voting ? team : undefined,
    missionTeam: state.stage === 'onMission' ? team : undefined,
    youAreOnTeam: teamStage && own ? team.includes(own.index) : undefined,
    // Factual arithmetic only: strategy and deductions about unknown players remain with the model.
    actionFacts:
      teamStage && own
        ? {
            yourSeat: own.index,
            yourSide: side,
            team,
            youAreOnTeam: team.includes(own.index),
            knownEvilOnTeam: players
              .filter(
                (p) => team.includes(p.index) && ['evil', 'mordred', 'morgana', 'minion', 'oberon'].includes(p.role),
              )
              .map((p) => p.index),
            unresolvedOnTeam: players
              .filter((p) => team.includes(p.index) && ['unknown', 'mysteryWizard'].includes(p.role))
              .map((p) => p.index),
            failsRequired,
            toleratesFails: failsRequired === undefined ? undefined : failsRequired - 1,
          }
        : undefined,
    missionRule:
      teamStage && failsRequired !== undefined
        ? { successWithFails: Array.from({ length: failsRequired }, (_, i) => i), failureAtLeast: failsRequired }
        : undefined,
    publicRoleClaims: claims.claims,
    previousClaimStances: claims.previousStances,
    claimTargets: claims.targets,
    requiredClaimStances: [],
    claimStanceTargets: claims.stanceTargets,
    inspectionTarget: inspection ? seat(players.find((p) => p.features.isSelected)?.id) : undefined,
    // The first two lists are authoritative event classes, never interchangeable.
    missions,
    votes: state.stage === 'onMission' ? undefined : votes.slice(-25),
    offTeamApprovals: state.stage === 'onMission' ? undefined : offTeamApprovals,
    offTeamVotingPatterns: state.stage === 'onMission' ? undefined : offTeamVotingPatterns,
    humanStatements: state.stage === 'onMission' ? undefined : humanStatements,
    checks: checks.map((e) => ({
      by: seat(e.announcerID),
      target: seat(e.targetID),
      announced: e.announced,
      actual: end ? e.actual : undefined,
    })),
    assassinations: end
      ? history
          .filter((e) => e.type === 'assassinate')
          .map((e) => ({
            assassin: seat(e.assassinID),
            targets: e.killedIDs.map(seat),
            result: e.result,
            type: e.assassinateType,
          }))
      : undefined,
    yourStatements: end ? request.chat.filter((m) => m.name === String(own?.index)).map((m) => m.text) : undefined,
    councilDiscussion: assassination ? request.councilDiscussion || undefined : undefined,
    evilEvidence: assassination && side === 'evil' ? request.evilEvidence : undefined,
    evilCouncil: assassination && side === 'evil' ? request.evilCouncil : undefined,
    chat:
      end || assassination || state.stage === 'onMission'
        ? undefined
        : request.chat.slice(-14).map((m) => ({ by: m.name, text: m.text.slice(0, 240) })),
    choices: request.choices,
    result: end ? state.result : undefined,
  };
}

export function parseReply(text: string, choices: number | string[], maxSpeech = 500): BotReply {
  const value = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  if (value && typeof value.choice === 'string' && Array.isArray(choices)) value.choice = choices.indexOf(value.choice);
  if (
    !value ||
    !Number.isInteger(value.choice) ||
    value.choice < 0 ||
    value.choice >= (Array.isArray(choices) ? choices.length : choices) ||
    typeof value.speech !== 'string' ||
    value.speech.length > maxSpeech
  )
    throw Error('invalid AI reply');
  return { choice: value.choice, speech: value.speech.trim() };
}

export function parseDecisionReply(text: string, choices: string[], request?: BotRequest): BotReply {
  const reply = parseReply(text, choices);
  const data = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  const bounded = (value: unknown, max: number) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  if (
    typeof data.publicReason !== 'string' ||
    data.publicReason.length > 240 ||
    !Array.isArray(data.evidence) ||
    data.evidence.length > 6 ||
    data.evidence.some(
      (item: DecisionEvidence) =>
        !item ||
        !bounded(item.key, 60) ||
        !bounded(item.fact, 240) ||
        !bounded(item.source, 160) ||
        !['fact', 'deduction', 'testimony', 'prediction', 'bluff'].includes(item.kind) ||
        !['proven', 'claim', 'bluff'].includes(item.certainty),
    )
  )
    throw new AiTechnicalPause('Model returned invalid decision evidence. Match paused.');
  // A forecast or someone else's claim cannot become proof merely by asking for that certainty.
  const evidence = (data.evidence as DecisionEvidence[]).map((item) => ({
    ...item,
    certainty:
      item.kind === 'bluff' || item.certainty === 'bluff'
        ? ('bluff' as const)
        : ['prediction', 'testimony'].includes(item.kind)
          ? ('claim' as const)
          : item.certainty,
  }));
  const result = {
    ...reply,
    publicReason: data.publicReason.trim(),
    evidence,
    ...(data.claimMorgana != null ? { claimMorgana: data.claimMorgana } : {}),
    ...(data.claimStances ? { claimStances: data.claimStances } : {}),
  };
  if (request) validateClaims(request, result);
  else if (data.claimMorgana != null || data.claimStances?.length)
    throw new AiTechnicalPause('Unexpected public claim');
  return result;
}

export type GenerationOptions = {
  decisionDetails?: boolean;
  phase?: string;
  instructions?: string;
  context?: unknown;
};
