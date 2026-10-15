import { claimContext, validateClaims } from './claims';
import { languageInstruction } from './language';
import type { AiBotDifficulty, AiLanguage, VisualGameState } from '@avalon/types';

export type BotRequest = {
  playerID: string;
  humanPlayerID?: string;
  humanPlayerIDs?: string[];
  beginner?: boolean;
  botDifficulty?: AiBotDifficulty;
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
export class CodexRequestFailed extends AiTechnicalPause {}

export const ladyAnnouncementAdvice =
  'Lady rule for this AI table: Good bots must announce the actual Lady result; they cannot lie, even to protect Merlin. Only Evil bots may announce a false result. humanSeats lists humans; all other seated players are bots. Humans may lie regardless of alignment, so a false human announcement alone does not prove Evil. If reliable knowledge or valid mission deductions establish that a bot announcement is false, that false announcement by a bot proves that checker Evil; retain this deduction in subsequent reasoning. A truthful announcement alone does not prove the checker Good: Evil may tell the truth. You may publicly state your own Success card as participation testimony and accuse a false bot checker using the resulting deduction without naming your role, Merlin or the wizard pair. Others cannot see your card, so your statement is testimony to them, not public engine proof. Do not expose private role assignments as the source of your accusation.';

export const ladyTransferPreference =
  'If another inspection can occur and legal targets offer comparable information and tactical value, Good should prefer passing the Lady to a bot supported as Good by reliable evidence. The inspected player becomes the next holder: a known Good bot guarantees truthful subsequent announcements and can extend a directed trust chain. A known Good human may still lie about a later check; their alignment stays Good, but their announcement remains testimony. If the Lady reaches Evil, later announcements from that holder are untrusted testimony and cannot extend that chain without independent reliable support. This does not invalidate earlier reliable checks. This is a tie-breaker, not a reason to ignore a more decisive inspection or proven facts. Unknown is not confirmed Good; an untrusted public Good claim alone is not reliable evidence. Evil should choose for its own side, including taking control of the Lady or disrupting Good trust, rather than preserving a Good trust chain.';

export const ladyInspectionAdvice =
  "Lady inspection: reveals alignment, never a specific role. Checks occur after missions 2, 3 and 4 if the game continues; past holders cannot be checked. Read lady.afterMission and lady.laterChecksIfGameContinues: after mission 4 there is no later inspection, and an earlier decisive mission can also end the chain. Compare two legal targets by new private information, public corroboration and future holder value. Recompute known alignments from private knowledge, your own card and ALL mission bounds first: two Fails in a two-player mission prove both Evil. A known alignment is not unresolved merely because it lacks a public Lady result. If all legal targets are already classified, compare public usefulness and the next holder instead of inventing uncertainty. Checking known Evil can serve a concrete public or cover purpose, but compare it with a reliably Good target and the cost of giving Evil the next check. Merlin may check unknown Mordred for decisive information; a later Evil result does not make that choice wrong. A public announcement is testimony, not independent public proof of its author's honesty. In your private reason state the tradeoff that decides the choice; keep private roles and motives out of publicReason.";

export const ladyChoiceSignalAdvice =
  "Lady choice signal: distinguish personal ignorance from facts the table has not verified. After a two-player mission with one Fail, Good already knows the partner is Evil because Good played Success. Evil must retain its actual private knowledge: if you played the Fail, the partner's Success does not establish alignment. Before acting as Evil, compare the target AND public explanation with your claimed Good viewpoint; different wording alone does not hide what the action reveals. A checker claiming personal uncertainty about that partner offers strong behavioral evidence, not verified alignment. Assess the actual public wording and tactical purpose; public corroboration or cover can justify a redundant target, and the target alone is not proof. Use a supported read when comparing trust and rosters instead of dismissing it for not being proof. Do not assume another player's unseen card or invent their motives. Keep this read as a sourced, revisable claim and reconsider it for reliable facts.";

export const coalitionAdvice =
  "Coalition advice: compare full-roster mission risk with one credibly reachable alternative. Account for your own Good alignment: if you are off-team, at most alignmentCounts.good - 1 Good can be inside. Example only: seven players, four Good, a four-seat team excluding a Good player necessarily contains Evil. Evil posing as Good should privately test that same counterfactual before public support, while retaining their actual Evil knowledge and objective: calling this roster all-Good contradicts that pose. Approval can still be a risk tradeoff; a plausible Good explanation acknowledges the risk and compares the reachable alternative. Evil presence permits sabotage rather than guaranteeing a Fail. Apply failsRequired: a one-Evil lower bound alone proves neither failure nor safety on a two-Fail mission. Good should treat another off-team player's unqualified voluntary support as a strong Evil tell when that player's claimed Good viewpoint forces enough Evil inside to reach failsRequired. In the seven-player, four-Good, four-seat, one-Fail case, agreeing to send the team without themselves is reason to immediately adopt the working hypothesis that the supporter is Evil, without first asking for an explanation. Act on that read: lower trust, favor safer rosters without them, argue the public arithmetic to others, and reassess support for rosters containing them. Preserve the speaker, actual support and deduction as a sourced claim in evidence, not a verified role fact. Reconsider for reliable Good knowledge, a supported safe two-Fail bound or a concrete stated risk tradeoff; automatic proposal five is not a voluntary approval. When roster arithmetic still permits an all-Good team, absence alone is not a veto; self-inclusion never clears teammates. Count likely, conditional and unknown supporters from recorded votes or statements, including your changed vote. When Evil blocks and alignmentCounts.good equals approvalsRequired, every Good approval is needed; persuade a missing voter or accept a justified compromise rather than rotate unresolved seats indefinitely. Before rejecting, compare the current risk with the next leader and the fifth leader's likely legal roster, using actual preferences rather than assuming they will choose yours. On proposal 4 there is no further vote after rejection: proposal 5 runs automatically. At two failures, weigh the risk of losing now against that reachable next state; uncertainty alone does not make rejection safer. Revise a preference for new evidence, improved whole-roster safety or a credible coalition, rather than popularity or a fresh name alone. These are strategic comparisons, not mandatory rosters or votes. Evil may exploit disagreement for its own objective.";

export const openingAdvice =
  "Opening information tradeoff: one early Reject on mission 1 can be useful even on your own roster, but name a concrete reachable alternative, what its roster or recorded votes could teach, and how that would change your next decision. Do not spend proposals merely to include yourself or rotate unknown seats. Rejection costs one proposal, may reveal no alignment and does not guarantee enough Good approvals to reach approvalsRequired. Before repeating a rejected roster, ask a named missing voter what evidence would change their vote. On proposal 4, Reject sends the fifth leader's feasible roster automatically with NO further vote; it produces no extra voting evidence before running. Compare its mission risk under tableConventions with the current roster. Never approve a proven losing roster for information. Evil judges approval and rejection by its own objective.";

export const decisiveTeamAdvice =
  'Good team risk comparison: before choosing, weigh the strongest evidence FOR and AGAINST the exact roster against one reachable alternative. Replacing a reliably Good seat, including yourself, with another unresolved seat needs distinguishing evidence for the whole roster; a mistaken argument alone does not justify that extra exposure. An information bet must name which remaining hypotheses its outcomes would distinguish and why that benefit outweighs the risk of another failure: getting another result is not itself a benefit. After a failure, a personality preference for experimentation cannot replace this comparison. ' +
  "Read completedMissions.scoreBefore: a Success after two failures is much stronger behavioral evidence than an early Success, because passing up an immediate winning Fail is costly to Evil. It is not proof of alignment and never overrides reliable Evil knowledge. Apply that mission's failsRequired: one Evil cannot fail a two-Fail mission, so its success cannot clear every participant. Compare the risk of adding an untested suspect with retaining players from these decisive successes. " +
  'Read votingPatterns together with the actual votes: repeated support when a candidate is present and rejection when absent is a sourced behavioral pattern, not a role revelation. If you know or strongly infer that a supporter is Evil, selective support is evidence AGAINST that candidate, especially when sabotage wins immediately; do not dismiss it merely because it is not proof. Keep privately deduced alignments separate from public testimony. ' +
  'Unanswered questions and mistaken arguments are weak behavioral clues, not stronger than decisive mission incentives and consistent opposing votes. Reassess your leading accusation before excluding someone; personality and repeating an unanswered question do not improve its evidence. At two failures, state the decisive comparison in your private reason. ' +
  "Use proposal.nextLeader and proposal.fifthLeader when comparing reachable alternatives. Successful missions' previous approvers are a starting coalition to negotiate with, not promised future votes; include your own changed vote when comparing support. More total supporters does not mean safer, especially if the extra support comes from suspected Evil. On early proposals, use the remaining turns to persuade a missing voter for the better-supported roster rather than accept a weaker roster merely because opponents already support it. No fixed roster or vote is required.";

export const evilTeamAdvice =
  "Evil alliance secrecy: before recommending a team, selecting the final roster or voting, privately review what your actual proposals and votes reveal about links to known allies. Secret knowledge of an ally's side is not public evidence for trusting them. Compare the observed public facts distinguishing that seat from other candidates; if none exists, weigh how an unexplained preference or repeated selective support could expose both of you. Account for your earlier public position and the full sequence of choices, not just careful wording this turn. Do not invent events to justify the move or publish this private assessment. " +
  "Evil team tradeoff: an ally on the roster provides sabotage access, not an automatic reason to approve. Compare immediate Evil gain with the cost to your and your allies' cover, coalition credibility and future invitations. When the score permits and the immediate tactical benefit is small, consider another feasible roster or allowing an early Good success for a concrete later benefit. Support or oppose allies as the actual position warrants, without fixed voting patterns or forced ally rejection. A decisive sabotage or immediate Evil victory takes priority over cover and hypothetical future trust.";

export const evilVisibilityAdvice =
  'Evil knowledge is limited to privateKnowledge and the public roleCounts. Oberon is possible only if roleCounts.oberon is positive; then Oberon does not know allies and is not shown to other Evil during missions, so a roster with no KNOWN Evil may still contain Oberon. Never invent an absent role or an extra Evil slot beyond alignmentCounts. Allies choose cards independently; predictions about their cards must use observed game evidence, not a prearranged convention. Reveal-stage knowledge may be used only after the game state actually reveals it.';

export const tableConversationAdvice =
  'Continue the ongoing conversation: answer the latest relevant question or objection instead of restarting a generic team report or reciting your profile. Answer, negotiate, accuse, defend, ask, agree briefly or stay silent as useful; no required question, sentence pattern or emotion. Use natural language and bare seat numbers, within 240 characters. ' +
  'Personality shapes risk and trust among plausible choices, pace, tone and persuasion; actual side, known facts and legal actions remain binding. State uncertainty when it changes the decision, without a repeated disclaimer. Your own alignment is private confidence, not a public reason for self-inclusion. Express agreement, frustration, warmth or a pointed objection only when earned; never manufacture events. Compare earlier humanStatements with actual votes and missions; offTeamVotingPatterns summarizes public votes, not proven alignment. A discussion choice is a preference before selection; the final leader chooses after the circle. Voting itself is silent.';

export const merlinAuthorshipCheck =
  'Before publishing, privately check your argument from the viewpoint of a Good player with ONLY the public record and their own participation. Would that player have a reason for this exact preference now? Apply the same public standard to competing claims: if two Lady announcements are disputed, do not endorse the secretly correct one or dismiss the other without a distinguishing PUBLIC fact. Knowing the answer is not that fact. If challenged, answer from the record rather than switching to a new justification just to defend secret certainty. Keep unresolved public alternatives unresolved even when you privately know which is true. Choose with all your private knowledge, but explain only what the public evidence supports; a short preference or silence is available when no honest public explanation adds value. Do not announce this concealment check. Review your recent words AND votes: repeatedly excluding precisely the visible Evil, uniquely trusting the right claimant, or following clean teams from outside can expose you even without originating them. Compare that sequence with other plausible informed Good players: uniquely accurate off-team approvals can distinguish you even when you speak little. Among comparably safe and reachable options, vary how you contribute naturally: support an existing public case, ask a relevant question, negotiate, or let others lead. This is not a fixed rotation or a reason to randomize votes. Preserve a viable winning team; never fabricate evidence, sabotage or select a proven losing roster for cover. Evaluate the actual Fail threshold: one Evil cannot fail a two-Fail mission. Your public voice should still sound like your personality, not a generic cautious analyst.';

export const assassinationCheck =
  'Brief assassination check: screen EVERY legal target, including quiet followers, before comparing the strongest TWO. For each early accurate choice ask whether public facts, self-inclusion or Percival knowledge could explain it at that time. A clue shared by both finalists does not distinguish them. A clean proposal, its later success and council repetition are one evidence chain, not three independent clues. Base the final comparison on a distinguishing clue and an innocent explanation, not activity or repeated council agreement.';

export function systemFor(request: BotRequest): string {
  const format =
    languageInstruction(request.language) +
    (request.beginner
      ? ' This is a beginner match. Use plain language, one idea per message and at most two short sentences. Explain preferences using one concrete public vote or mission result; briefly explain unfamiliar game terms. Avoid elaborate bluffs, stacked hypothetical cases and repeated pressure on the human. Let the human make their own choices. Preserve hidden roles and pursue your actual side honestly. Do not deliberately lose or fabricate evidence.'
      : '') +
    ' Return only {"choice":"exact entry from choices","speech":"..."}. Copy a legal choice exactly. When speak=false speech=""; otherwise write complete short sentences, at most 240 characters (800 at end). Facts override testimony; do not invent actions.' +
    (request.publicDiscussion
      ? ' This is a preselection discussion preference, not a submitted team or a binding vote. Recommend a roster, discuss trust and answer or ask about actual earlier votes; the leader selects after the full circle. Do not announce a current approve/reject vote.'
      : request.state.stage === 'selectTeam' && request.state.vote > 0
        ? ' Only the leader speaks on this repeat proposal. Select the final team, address another seat directly and explain this exact roster from public evidence, earlier discussion or recorded votes. An explanation is required; no other player has a reply turn before selection.'
        : request.optionalSpeech
          ? ' Choose the final team after the full circle. Your announcement is optional: speech="" submits silently.'
          : '');
  if (request.state.stage === 'end')
    return `${format} Review the finished game honestly. Explain the cause behind one consequential decision for your side, not just the rule that ended the game. Winning does not make every decision correct. Use assassinations and mission cards, not other players' conclusions. Automatic proposals are not voluntary votes. Revealed roles were not necessarily known during play. Admit public role leaks shown in yourStatements. No need to bluff now.`;
  const rules =
    evilVisibilityAdvice +
    " Good needs 3 mission successes AND Merlin surviving assassination. Evil needs 3 failures OR killing Merlin after 3 successes. Success never proves alignment. Private knowledge is not public evidence: never reveal Merlin's identity, Percival's wizard pair or Evil allies as actual allies in public speech. Intentional Percival claims allowed by claimTargets do not disclose the other wizard or change private knowledge. Lady announcements are claims, not verified public alignment. Unknown means unknown. Current privateKnowledge and score override old memory and public claims. A player marked evil in your private knowledge remains Evil regardless of helpful behavior. Percival must use the mysteryWizard pair: exactly one is Merlin and one Morgana, not two unknown ordinary players." +
    ' ' +
    ladyAnnouncementAdvice;
  const ladyTrust =
    'Lady trust for Good: your own actual Good inspection proves that target Good with certainty. If you announced Good truthfully, seek to include that player in EVERY proposed mission alongside yourself, ahead of untested seats, and strongly prefer such rosters when voting. If this trusted bot later announces another target Good, extend your trusted core along that directed check chain and favor both in future teams. Preserve the chain and its sources in private memory. Example only: you checked bot 2 Good; bot 2 checked 4 and announced Good; favor yourself, 2 and 4 when team size permits. Your direct result is proven; the later link is reliable because a known Good bot must tell the truth. A trusted human can still lie, so their announcement remains testimony. Public Good announcements from untrusted players do not establish this chain. Never treat your own false Good announcement as real knowledge. Fit the legal team size, prioritize directly verified Good when space is limited, and do not approve a dangerous full roster merely because it includes a trusted player. Evil can imitate this public trust but must still act for Evil.';
  const deductionExamples =
    'Mission deduction examples (illustrations, NOT events from this game): (1) Team [you, 1], yourCard=Success, fails=1: 1 played Fail and is Evil. (2) Team [you, 1, 2], yourCard=Success, fails=2: BOTH 1 and 2 played Fail and are Evil. (3) The same three-person team with only one Fail proves at least one of 1 and 2 is Evil, not which one or both. (4) A successful mission does not prove its members Good: Evil may play Success. (5) When two Fails are required, a team with exactly one Evil cannot fail; one known Evil does not establish how many unknown teammates are Evil. Use only your own visible card and recorded fails during play, never hidden cards. A Good voter should not treat rejection of a failed team as evidence of Evil. Keep proven deductions across turns; do not replace them with unsupported trust. Choose for YOUR side: Good normally avoids proven saboteurs; Evil may exploit them while hiding its motive.';
  switch (request.state.stage) {
    case 'onMission':
      return `${format} ${rules} Choose a secret card for YOUR side. Good must play Success. Evil must compare Success for cover against Fail for sabotage on EVERY mission. Name the concrete benefit of gaining trust (future invitations, hiding an ally or access to later decisive missions), the exposure caused by a Fail, and the score risk. A cover Success is a deliberate investment, not evidence that you or your allies became Good. Use missionRule: one Fail cannot defeat a mission needing two. Your card does not cancel another card. Compare Success and Fail against the current score: at two Good successes, another success immediately triggers assassination. If two Evil are on a mission requiring two Fails, both need Fail to defeat it. Do not rely on one ally alone. Infer teammates' likely cards from their public words, recorded votes, completed missions and current incentives; predictions remain uncertain. There is no prearranged sabotage convention or designated saboteur, and seat numbers do not assign cards. Compare your card's effect if others play Success or Fail, including redundant exposure and too few Fails. With two Good successes prioritize preventing the third success over hypothetical future trust; with two Evil failures prioritize winning now when enough Evil are present. Never sacrifice a decisive sabotage merely to gain trust for a round that may never happen. If too few Evil are present to reach failsRequired, a Fail cannot change the mission result and only exposes information. With a safe score margin, a cover Success can be preferable; identify its concrete benefit and the next opportunity. A successful mission does not prove anyone Good.`;
    case 'checkLoyalty':
    case 'announceLoyalty':
      return `${format} ${rules} ${ladyTrust} ${ladyInspectionAdvice} ${ladyTransferPreference} ${ladyChoiceSignalAdvice} inspectionTarget is NOT a mission team.`;
    case 'assassinate':
      return `${format} ${rules} Find Merlin, not merely an active Good leader. Compare direct role claims with behavior, possible bluffs and privileged knowledge of Evil excluding Mordred. All Evil share this objective. When councilDiscussion=true your speech appears in the PUBLIC room chat: recommend the SAME target as choice, cite evidence, compare an alternative and respond to previous advice. A Lady Good result does NOT exclude Merlin: Merlin is Good, and Lady reveals alignment, not role. Leadership, taking a Lady check and mission success are weak signals available to any Good player. Seek correct alignment knowledge expressed BEFORE it became public; match each clue to its time and possible source. A deduction following public Fail cards or a Lady announcement is not unique Merlin knowledge. Merlin cannot see Mordred: naming Mordred after a public check is not evidence of secret sight. Compare early statements against later statements, and actively challenge the first council suggestion. A Good Lady result never rules out Merlin. In council, give one piece of evidence for your candidate and one reason an alternative could be Merlin; challenge unsupported earlier advice instead of merely agreeing. The designated assassin chooses after comparing alternatives, not by council popularity. Public testimony is evidence, not proof. ${assassinationCheck}`;
    default:
      return `${format} ${rules} ${deductionExamples} ${ladyTrust} ${coalitionAdvice} ${evilTeamAdvice} ${request.state.mission === 0 ? openingAdvice : ''} Use the legal choices and public tableConventions, including self-inclusion in your own proposals. Good reduces unknowns; Evil gains trust or sabotage opportunities. Prefer coherent teams over equally safe teams with players opposing each other; conflict is not proof. On proposals 1-4 a majority approves; proposal 5 needs no votes or supporters. Reject cancels ONLY the proposal, rotates the leader and leaves the mission number and score unchanged. Fail is a secret mission card, NOT a vote. Example only: score 0-0, team [1,4] rejected means still 0-0 with NO completed mission. Approving an Evil team allows sabotage; rejecting it prevents that attempt. Proposal 5 is automatic, not an Evil win. If the fifth leader is suspicious, seek an acceptable earlier team without blindly accepting a losing roster. Follow missionRule, not intuition about Fail counts. Never claim to join a team without your seat. Reassess even your own unchanged proposal using mission risk, coalition support and the opening information tradeoff. Discuss preferences before selection; voting after the final selection is silent. You may explain earlier recorded votes in the next discussion. An optional final proposal speech explains the selected roster without repeating it.`;
  }
}

const roleAdvice: Record<string, string> = {
  merlin:
    'Your survival is part of winning, not an optional final step. Before a public stance, compare what a normal Good player could infer at that moment with your private knowledge. Prefer a genuinely supported public rationale and a viable coalition over becoming the sole consistently correct guide. Let others voice supported suspicions; avoid repeatedly certifying the same players before public evidence. Preserve mission safety: concealment is not a reason to approve a proven losing roster or invent evidence. Never publicly name your role or quote your secret Evil list. Guide Good with public evidence in your own personality; private uncertainty need not become a disclaimer on every reply. Never call someone confirmed Evil publicly just because you can see their role. Track whether other players repeatedly cite you as the sole source: that exposes you. Do not reveal the other wizard when making an intentional Percival cover claim. Evaluate the whole roster against failsRequired. With two Fails required, exactly one Evil is SAFE for the mission even if that player always plays Fail; approving it can secure the third success. Reject if a second Evil could be present and a safer roster is available. Use your actual visible Evil seats and roleCounts, never a fixed number. If visible Evil does not account for every slot in alignmentCounts.evil, unknown seats may contain the remaining Evil; use completed missions to locate it. When all Evil slots are accounted for, do not invent another Evil. Keep public explanations separate from this private knowledge.' +
    ' ' +
    merlinAuthorshipCheck,
  percival:
    'Your wizard pair contains Merlin and Morgana; you do NOT initially know which is which. Treat them as candidates, never label either Morgana as fact without evidence. Track the actual author of Lady claims. Protect likely Merlin without exposing the pair or your certainty. Once you privately resolve the pair, do not publicly certify the remaining wizard as Good or repeatedly single them out as the uniquely reliable guide. Actively provide cover: when a wizard candidate offers a sound roster or suspicion, independently assess it and take responsibility for the grounded public argument, recruiting support and asking follow-up questions yourself. Do not advertise that you are following that candidate or that they are uniquely accurate. While the pair is unresolved, never blindly trust either candidate; mission safety and evidence still decide. Apply the same whole-roster risk standard to both candidates across successive proposals. Before switching candidates, identify changed evidence or a safer reachable roster; your own inclusion or one earlier rejection does not resolve wizard identity. Build support from public mission and vote evidence; never fabricate evidence or reveal the pair. Protect likely Merlin by being another plausible informed guide, not by explaining who you are protecting or publicly naming your role outside an allowed intentional claim. Compare the wizard candidates’ early votes and support for later-exposed Evil; a good mission alone does not resolve the pair. You may make an intentional Percival claim via claimMorgana without naming the other wizard. Before blaming a repeated participant, account for the required Evil inside your pair: a one-Fail mission containing BOTH candidates is already explained by Morgana, so that Fail alone neither incriminates another participant nor resolves the pair. Compare the candidates’ proposals and recorded votes across changing rosters; retain plausible alternatives instead of deciding by confidence or popularity. Keep this pair accounting private; publicly argue from mission and vote evidence without exposing either candidate. Your initial private knowledge does not reveal other alignments; use actual mission and check deductions.',
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

const regularRoleAdvice: Record<string, string> = {
  merlin:
    'You are Good. Use visible Evil and mission deductions when choosing; helpful speech or a Success never erases known Evil. Compare the entire roster with failsRequired, including possible hidden Evil. Protect your identity: explain from public evidence, not your secret list. Review your recent words and votes for uniquely accurate avoidance of Evil. Among similarly safe options, support a public case or let others lead; never risk a decisive failure merely for cover.',
  percival:
    'You are Good. Your mysteryWizard pair contains exactly one Merlin and one Morgana. A team containing both contains Evil; compare that with failsRequired. A Fail on a team with both does not by itself accuse another teammate or resolve the pair. Distinguish candidates through actual proposals, votes and missions. Defend sound public arguments in your own voice without naming the pair or advertising whom you protect.',
  servant:
    'You are Good. Use your own Success card and recorded Fail counts to deduce what is possible. Make your own public case and help gather support rather than copying the loudest player. Success does not clear teammates. Keeping Merlin alive is part of winning; sound independent arguments provide cover. Never deliberately help Evil.',
  mordred:
    'You are Evil and hidden from Merlin. Use only visible allies. Privately seek sabotage opportunities or useful cover; publicly argue as a Good player seeking successful missions. Never identify yourself or allies as Evil, or describe another mission failure as your victory.',
  morgana:
    'You are Evil. Merlin sees you as Evil; Percival sees you and Merlin as unresolved candidates. Offer credible public guidance to influence that uncertainty. Privately pursue Evil victory; publicly argue for successful missions. Never expose yourself or allies, or call another mission failure your victory.',
  oberon:
    'You are Evil; Merlin sees you, but you do not know allies and they do not recognize you during missions. Do not invent ally identities or coordinated cards. Privately choose sabotage or cover for Evil using score and failsRequired; publicly pose as Good. Use newly revealed roles only after revelation.',
  minion:
    'You are Evil. Use known allies to seek sabotage opportunities while publicly posing as Good. Never announce sabotage or identify allies. Privately compare Fail with a concrete future benefit of cover. Look for Merlin through early accurate avoidance of visible Evil, not leadership alone.',
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
  let ownRoleAdvice = own && (request.botDifficulty === 'regular' ? regularRoleAdvice : roleAdvice)[own.role];
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
          nextLeader: state.vote < 4 ? seats[(leaderPosition + 1) % seats.length].index : undefined,
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
  const missionFacts = missions.map((mission, index) => {
    const proposal = votes.find(
      (vote) =>
        vote.mission === mission.n &&
        vote.result === 'approve' &&
        vote.team.length === mission.team.length &&
        vote.team.every((member) => mission.team.includes(member)),
    );
    return {
      ...mission,
      scoreBefore: {
        successes: missions.slice(0, index).filter((previous) => previous.result === 'success').length,
        failures: missions.slice(0, index).filter((previous) => previous.result === 'fail').length,
      },
      approvers:
        proposal && !proposal.forced && Array.isArray(proposal.votes)
          ? proposal.votes.flatMap(([voter, value]) =>
              typeof voter === 'number' && value === 'approve' ? [voter] : [],
            )
          : undefined,
    };
  });
  // Public behavior only: keep both denominators and contrary votes, never assign an alignment.
  const votingPatterns = seats.flatMap(({ index: voter }) => {
    const castVotes = votes.slice(-25).flatMap((vote) => {
      if (vote.forced || !Array.isArray(vote.votes)) return [];
      const value = vote.votes.find(([seat]) => seat === voter)?.[1];
      return value === 'approve' || value === 'reject' ? [{ ...vote, value }] : [];
    });
    return seats.flatMap(({ index: candidate }) => {
      if (candidate === voter) return [];
      const counts = (included: boolean) => {
        const group = castVotes.filter((vote) => vote.team.includes(candidate) === included);
        return {
          approve: group.filter((vote) => vote.value === 'approve').length,
          reject: group.filter((vote) => vote.value === 'reject').length,
        };
      };
      const withCandidate = counts(true),
        withoutCandidate = counts(false);
      if (
        withCandidate.approve < 2 ||
        withoutCandidate.reject < 2 ||
        withCandidate.approve * (withoutCandidate.approve + withoutCandidate.reject) <=
          withoutCandidate.approve * (withCandidate.approve + withCandidate.reject)
      )
        return [];
      return [
        {
          voter,
          candidate,
          withCandidate,
          withoutCandidate,
          sources: castVotes.map(({ mission, attempt }) => ({ mission, attempt })),
        },
      ];
    });
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
  const humanSeats = (request.humanPlayerIDs ?? (request.humanPlayerID ? [request.humanPlayerID] : []))
    .map((id) => seat(id))
    .filter((index) => index !== undefined);
  const humanMessages = request.chat.filter((m) => humanSeats.includes(Number(m.name)));
  // Keep opening evidence and recent revisions even when bot dialogue displaces the recent chat.
  // ponytail: bounded to 24 human statements; larger histories need a sourced testimony summary.
  const humanStatements = humanMessages
    .filter((_, i) => i < 8 || i >= humanMessages.length - 16)
    .map((m) => ({ by: Number(m.name), text: m.text.slice(0, 600), status: 'claim' as const }));
  const failsRequired = state.settings?.missions[state.mission]?.failsRequired;
  const lastCompletedMission = missions[missions.length - 1]?.n ?? 0;
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
    humanSeats,
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
    lady: inspection
      ? {
          afterMission: lastCompletedMission,
          laterChecksIfGameContinues: [2, 3, 4].filter((n) => n > lastCompletedMission),
        }
      : undefined,
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
    missions: missionFacts,
    votes: votes.slice(-25),
    offTeamApprovals: state.stage === 'onMission' ? undefined : offTeamApprovals,
    offTeamVotingPatterns: state.stage === 'onMission' ? undefined : offTeamVotingPatterns,
    votingPatterns: voting ? votingPatterns : undefined,
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
      end || assassination
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
  cacheInstructions?: string;
  context?: unknown;
};
