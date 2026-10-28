import { claimContext, validateClaims, claimInstructions } from './claims';
import { exposedEvilAdvice, nextExposedEvilState, stripOwnEvilAdmission } from './exposed-evil';
import type { ExposedEvilState } from './exposed-evil';
import { aiText, languageInstruction } from './language';
import { buildAnalysis } from './analysis';
import {
  codeVote,
  codeVotesEnabled,
  echoedPhrase,
  guardDecision,
  failWish,
  merlinSpeechExposure,
  restatedRoster,
  stalePhrases,
  usedStalePhrases,
} from './guards';
import { EVIL_ROLES } from './deduction';
import shuffle from 'lodash/shuffle';
import {
  addressedToYou,
  confessesFail,
  falseVoteClaim,
  humanTypography,
  speakerContext,
  speakerEnabled,
  speakerInstructions,
  spokenPass,
  withoutRepeatedEmoji,
  withoutTeamRepeat,
} from './speaker';
import { humanSeatNumbers, humanTestimony } from './testimony';
import type { AiLanguage } from '@avalon/types';
import {
  AiInvalidReply,
  AiPause,
  AiTechnicalPause,
  compactRequest,
  systemFor,
  playerNameInstructions,
  tableConversationAdvice,
  conversationVoiceAdvice,
  publicSpeechAdvice,
  coalitionAdvice,
  decisiveTeamAdvice,
  winningOpportunityAdvice,
  openingTieBreakAdvice,
  evilTeamAdvice,
  ladyAnnouncementAdvice,
  ladyInspectionAdvice,
  ladyTransferPreference,
  ladyChoiceSignalAdvice,
  evilLadyAdvice,
  assassinationCheck,
} from './client';
import type { BotReply, BotRequest, Decide, GenerationOptions, DecisionEvidence } from './client';

// Explicit allowlist: public role totals are safe; private assignments, cards, checks and notes stay private.
export function publicContext(request: BotRequest, choice: string) {
  const c = compactRequest(request);
  return {
    seat: c.you?.seat,
    personality: request.style,
    language: request.language ?? 'en',
    playerCount: c.playerCount,
    humanSeats: c.humanSeats,
    playerNames: c.playerNames,
    approvalsRequired: c.approvalsRequired,
    alignmentCounts: c.alignmentCounts,
    roleCounts: c.roleCounts,
    publicRoleClaims: c.publicRoleClaims,
    humanStatements: c.humanStatements,
    stage: c.stage,
    choice,
    actionType: request.publicDiscussion
      ? 'discuss'
      : request.state.stage === 'checkLoyalty'
        ? 'inspect'
        : request.choices.every((v) => v === 'approve' || v === 'reject')
          ? 'vote'
          : 'propose',
    score: c.score,
    proposal: c.proposal,
    mission: c.mission,
    teamSize: c.teamSize,
    proposedTeam: c.proposedTeam,
    missionRule: c.missionRule,
    missions: c.missions.map(({ n, leader, team, result, fails, scoreBefore, approvers }) => ({
      n,
      leader,
      team,
      result,
      fails,
      scoreBefore,
      approvers,
    })),
    votes: c.votes,
    checks: c.checks.map(({ by, target, announced }) => ({ by, target, announced })),
    chat: c.chat,
  };
}
// Narrow output hygiene, not a strategy engine. Raw response remains in private traces.
export function safePublicSpeech(
  speech: string,
  _choice: string,
  _language?: AiLanguage,
  percivalClaim = false,
  evilAdmission = false,
): string {
  // This guard detects explicit private-role leaks only; it does not understand claims or choose wording.
  const ownSideChecked = stripOwnEvilAdmission(speech);
  if (!evilAdmission && ownSideChecked !== speech)
    throw new AiTechnicalPause('Public Evil admission was not authorized by the actor.');
  const visible = evilAdmission ? ownSideChecked : speech;
  const checked = percivalClaim
    ? visible.replace(
        /\b(?:my role is|our role is|mi rol es|nuestro rol es)\s+(?:the\s+)?percival\b|(?:моя|наша)\s+роль\s*(?:—|-|это)?\s*персиваль|vai trò của tôi\s*(?:là\s*)?percival|我的角色(?:是|為)?派西維爾|\bpercival\b|персиваль|派西維爾/giu,
        'public claim',
      )
    : visible;
  const roleLeak =
    /own public alignment[\s,;:—-]*(?:(?:and|и)\s+)?(?:merlin|percival|morgana|mordred|minion|oberon|мерлин|персиваль|моргана|мордред|приспешник|оберон|梅林|派西維爾|莫甘娜|莫德雷德|奧伯倫|爪牙)|\b(?:i am|i'm|we are|we're)\s+(?:an?\s+|the\s+)?(?:evil|merlin|percival|morgana|mordred|minion|oberon)\b|(?<![\p{L}\p{N}_])(?:я|мы)\s*(?:—|-|это|являюсь|являемся)?\s*(?:злой|злые|мерлин|персиваль|моргана|мордред|приспешник|оберон)|(?:我|我們)是(?:邪惡|梅林|派西維爾|莫甘娜|莫德雷德|奧伯倫|爪牙)/iu;
  const privateLeak =
    /\b(?:my|our) (?:evil allies|role is|wizard pair|wizard candidates)\b|\b[1-8]\s+(?:is|must be)\s+merlin\b|\bmerlin\s+is\s+[1-8]\b|[1-8]\s*(?:—|-|это|является)\s*мерлин|мерлин\s*(?:—|-|это)\s*[1-8]|мо[яи]\s+(?:роль|злые союзники|союзники|сообщники|пара магов|кандидаты в маги)|(?:我的(?:角色|邪惡盟友|梅林候選人)|[1-8]\s*是梅林)/i;
  const sabotageIntent =
    /\b(?:i|we)\s+(?:will|want to|intend to|plan to|am going to|are going to)\s+(?:sabotage|help evil|(?:let|make|ensure|force)[^.!?]{0,50}\bfail)\b|\b(?:my|our)\s+strategy\s+to\s+(?:let|make|ensure|force)[^.!?]{0,50}\bfail\b|\b(?:prevent\w*|avoid\w*)\s+(?:the\s+)?(?:risk\s+of\s+)?(?:(?:an?|the|any|another|this|that|their|our|its|your|accidental|unintended|risky|(?:good|mission|team)(?:['’]s)?)\s+){0,5}success\b|\b(?:unintended|accidental)\s+success\b|(?:я|мы)\s+(?:саботир|(?:хочу|хотим|буду|будем|намерен|намерены)\s+(?:саботир|провалить|устроить\s+провал|помочь\s+злу))|(?:избеж|предотврат)[а-яё]*\s+(?:риск[а-яё]*\s+)?(?:(?:(?:случайн|нежелательн|очередн|мирн|наш|ваш|эт)[а-яё]*|их)\s+){0,3}успех|(?:我|我們)(?:要|想要|想|打算|會|將|計畫)[^。！？]{0,40}(?:破壞|幫助邪惡|讓任務失敗)|(?:避免|阻止)(?:讓)?(?:這次|本次|這輪|本輪|該輪|此次|任務|意外|正義|的){0,4}(?:成功|正義獲勝)/i;
  const translatedLeak =
    /(?:^|[\s.!?])(?:yo\s+)?(?:soy|somos)\s+(?:del\s+mal|malvado|malvada|merl[ií]n|percival|morgana|mordred|minion|oberon)\b|(?:tôi|chúng tôi)\s+(?:là\s+(?:merlin|percival|morgana|mordred|minion|oberon)|(?:là|thuộc)\s+phe\s+[aá]c)|\b(?:mi|nuestro)\s+(?:rol\s+es|aliado\s+del\s+mal|pareja\s+de\s+magos)\b|vai trò của tôi|đồng minh phe [aá]c của tôi|\b[1-8]\s+es\s+merl[ií]n\b|[1-8]\s+là\s+Merlin|\b(?:voy a|vamos a|quiero|queremos)\s+sabotear\b|(?:tôi|chúng tôi)\s+(?:sẽ|muốn|định)\s+phá hoại/iu;
  if (/\bmy ally\b|мой\s+(?:союзник|сообщник)|моя\s+скрытая\s+стратегия|my private strategy/iu.test(checked))
    throw new AiTechnicalPause('Public speech exposes private allies or strategy.');
  if (
    !roleLeak.test(checked) &&
    !privateLeak.test(checked) &&
    !sabotageIntent.test(checked) &&
    !translatedLeak.test(checked)
  )
    return speech;
  throw new AiTechnicalPause('Public speech exposes private role or sabotage intent. Match paused.');
}
// Detect only an explicit selected roster, not historical teams or hypothetical alternatives.
function contradictsRoster(request: BotRequest, reply: BotReply): boolean {
  const choice = request.choices[reply.choice];
  if (request.state.stage !== 'selectTeam' || !choice || !/^[1-8](\s*,\s*[1-8])*$/.test(choice)) return false;
  const seats = (value: string) =>
    value
      .split(/[,，、]/)
      .map(Number)
      .sort()
      .join(',');
  return [reply.speech, reply.publicReason || ''].some((text) =>
    [
      ...text.matchAll(
        /(?:^|\n|[.!?。！？])\s*(?:[1-8][,，、]\s*)?(?:(?:choosing|I(?: am)? choosing|I choose|I propose|my (?:chosen|selected) team is)|Я (?:выбираю|предлагаю)(?: команду)?|моя (?:выбранная )?команда|我(?:選擇|提議|改選|建議|選)(?:隊伍)?)\s*[:：]?\s*(?:\[\s*)?([1-8](?:\s*[,，、]\s*[1-8])+)(?:\s*\])?/gi,
      ),
    ].some((stated) => {
      const suffix = text.slice((stated.index || 0) + stated[0].length);
      if (/^\s*(?:if\b|unless\b|если(?=\s|$)|的話|如果|若|除非)/i.test(suffix)) return false;
      const declared = seats(stated[1]);
      // A partial conjunction or trailing address is ambiguous unless the list is bracketed.
      if (!stated[0].trimEnd().endsWith(']') && declared.split(',').length !== seats(choice).split(',').length)
        return false;
      return declared !== seats(choice);
    }),
  );
}

// Seats a leader's explanation leaves out ("keeping 5 off", "replacing 5 with 6") although its roster includes them:
// the model sometimes submits the neighbouring roster from the long legal list. Negated phrasings do not count.
export function excludedButChosen(request: BotRequest, reply: BotReply): number[] {
  const choice = request.choices[reply.choice];
  if (
    request.state.stage !== 'selectTeam' ||
    request.publicDiscussion ||
    !choice ||
    !/^[1-8](\s*,\s*[1-8])*$/.test(choice)
  )
    return [];
  const team = choice.split(',').map(Number);
  const text = reply.publicReason || '';
  const exclusion =
    /\b(?:keep(?:ing)?|leav(?:e|ing)|left)\s+([1-8])\s+(?:off|out)\b|\b(?:drop(?:ping)?|replac(?:e|ing)|swap(?:ping)?|bench(?:ing)?)\s+([1-8])\b|\bwithout\s+([1-8])\b|\b([1-8])\s+(?:stays?|sits?)\s+(?:off|out)\b/gi;
  const negated = /(?:\bnot|n['’]t|\bno|\bnever|\bwithout|\bthan)\s+(?:\w+\s+){0,2}$/i;
  const seats = [...text.matchAll(exclusion)]
    .filter((match) => !negated.test(text.slice(Math.max(0, match.index! - 30), match.index)))
    .map((match) => Number(match[1] || match[2] || match[3] || match[4]))
    .filter((seat) => team.includes(seat));
  return [...new Set(seats)];
}

export function reviewContext(request: BotRequest) {
  const c = compactRequest(request);
  const votes = c.votes || [];
  const yourActions = [
    ...votes
      .filter((v) => v.leader === c.you?.seat)
      .map((v) => ({
        id: `proposal-${v.mission}-${v.attempt}`,
        type: 'proposal',
        mission: v.mission,
        team: v.team,
      })),
    ...votes
      .filter((v) => !v.forced && v.yourVote)
      .map((v) => ({
        id: `vote-${v.mission}-${v.attempt}`,
        type: 'vote',
        mission: v.mission,
        team: v.team,
        value: v.yourVote,
      })),
    ...c.missions
      .filter((m) => m.yourCard)
      .map((m) => ({
        id: `card-${m.n}`,
        type: 'card',
        mission: m.n,
        team: m.team,
        value: m.yourCard,
      })),
    ...c.checks
      .filter((v) => v.by === c.you?.seat)
      .map((v, i) => ({
        id: `lady-${i + 1}`,
        type: 'lady',
        target: v.target,
        announced: v.announced,
        actual: v.actual,
      })),
  ];
  return {
    yourActions,
    yourStatements: c.yourStatements?.slice(-12),
    teamVotes: votes,
    evilCouncil: request.evilCouncil,
    automaticProposals: votes.filter((v) => v.forced).map(({ mission, attempt, team }) => ({ mission, attempt, team })),
    you: c.you,
    personality: request.style,
    language: request.language ?? 'en',
    score: c.score,
    result: c.result,
    revealedRoles: c.revealedRoles,
    rolesKnownBeforeReveal: request.rolesKnownBeforeReveal,
    missions: c.missions,
    checks: c.checks,
    assassinations: c.assassinations,
    yourVotes: c.votes
      ?.filter((v) => !v.forced)
      .map(({ mission, attempt, team, yourVote, forced }) => ({
        mission,
        attempt,
        team,
        yourVote,
        forced,
      })),
    choices: request.choices,
    speak: true,
  };
}
function isOpeningPair(request: BotRequest) {
  return (
    request.state.stage === 'selectTeam' &&
    request.state.mission === 0 &&
    request.state.settings?.missions[0]?.players === 2
  );
}

// Each seat reads only its own side's part: a Servant's prompt has no use for the Evil or Merlin fields.
const analysisAdvice = (role: string) =>
  'analysis is private server bookkeeping, recomputed every turn from engine records and YOUR private knowledge, and never shown to others. seats[].evilChance and status combine every Evil assignment consistent with mission Fail counts, your own cards, your private knowledge and Lady results, weighted by typical play: Evil nearly always fails when a Fail wins at once, so a Success at 0-2 strongly clears its team. Approving a roster you are not on is real evidence after mission 1: Good players rarely do it unless the record clears that roster, while Evil often backs rosters holding an ally. provenEvil, provenGood, provenSafe and provenUnsafe are certain. teams[].failRisk is the estimated chance that exact roster fails. Trust analysis over your own arithmetic, memory notes and chat impressions: tone, an unanswered question or a weak argument is far weaker evidence than these numbers. ' +
  (EVIL_ROLES.includes(role)
    ? 'Evil: exposedAllies lists allies the table already reads as Evil; cut them loose in words, votes and rosters, never defend them by name or push them back onto teams, and agree when the table names them. teams.sabotageTeamsThatLookSafest lists rosters with enough known Evil to fail that the table may still accept; missionCard shows whether your Fail matters and how suspicious each outcome makes you; announcement shows how each Lady announcement changes public suspicion. merlinCandidates ranks Good seats by how Merlin-like their votes and proposals were. Your own off-team approvals feed publicView exactly as above, so back an off-team roster with an ally only when your vote can actually pass a roster you need. '
    : "Good: recommend, propose and approve the lowest-failRisk roster that can realistically pass; reject when a clearly safer legal roster exists and more proposals remain, above all when stakes say a failure loses. Do not swap a likely-Good seat for a riskier one to punish an argument. A confident claim, a repeated push or another player's assurance is not evidence: check it against votes, cards and Lady results, and say so when they contradict it. ") +
  (role === 'merlin'
    ? 'Merlin: assassinView shows your current Merlin-likeness and, for this vote or roster, how each option changes it. To hide your sight the server may cast your silent vote as assassinView.servantLikeVote, the vote a Servant in your seat would cast: always before any failure, and for cheap rejections before two failures; otherwise you vote with your full sight. When fewer than two missions have failed and a Fail would not decide the game, a lower-exposure option can be worth some extra mission risk; never trade a decisive mission for cover. Before rejecting, count support in this discussion and in recorded votes: a lone rejection of a roster most of the table backs rarely stops it and mainly marks you as Merlin. Do not be the one who names or pushes the exact right roster every mission: let a Servant propose it and agree briefly. '
    : '') +
  (role === 'merlin' || EVIL_ROLES.includes(role)
    ? 'publicView is what someone without your private knowledge can infer: keep public arguments consistent with it. '
    : '') +
  'Never quote analysis or its percentages as public facts; argue from missions, votes and statements. ';

const regularAnalysisAdvice =
  'analysis is private server bookkeeping from engine records and your private knowledge: seats[].evilChance and status and teams[].failRisk are more reliable than your own arithmetic, and proven statuses are certain. Never quote it publicly. ';

export function decisionInstructions(request: BotRequest, commonOnly = false) {
  const role = request.state.players?.find((p) => p.id === request.playerID)?.role;
  const evil = ['mordred', 'morgana', 'minion', 'oberon'].includes(role || '');
  const regularTeam =
    request.botDifficulty === 'regular' && ['selectTeam', 'votingForTeam'].includes(request.state.stage);
  const lady =
    ['checkLoyalty', 'announceLoyalty'].includes(request.state.stage) ||
    Boolean(request.state.history?.some((event) => ['checkLoyalty', 'announceLoyalty'].includes(event.type)));
  const assessLadyChoice =
    request.state.stage === 'checkLoyalty' ||
    (['selectTeam', 'votingForTeam'].includes(request.state.stage) &&
      request.state.history?.some((event) => event.type === 'checkLoyalty'));
  const turn = request.publicDiscussion
    ? 'This is discussion before team selection: choice is a preference, not a submitted roster or vote.'
    : request.state.stage === 'selectTeam' && request.state.vote > 0
      ? 'Only the leader speaks on this repeat proposal. Select the final roster now. In publicReason, directly address another seat and explain why you selected this exact team using public evidence, earlier discussion or recorded votes. State your rationale rather than waiting for an answer: other players have no reply turn before selection. Do not repeat a generic opening argument; explain why you retain or change the previous proposal. Your public explanation is required; do not submit silently.'
      : request.optionalSpeech
        ? 'As leader, select the final roster after hearing the full circle. publicReason may be empty.'
        : request.councilDiscussion
          ? 'The Evil council is public. In publicReason discuss your assassination candidate from public evidence, compare an alternative and respond to earlier advice without announcing private allies. speech remains your private reason, including during council.'
          : request.state.stage === 'assassinate'
            ? 'Choose the final assassination target freely. Compare your choice with YOUR OWN earlier target in evilCouncil. If you change that target, publicReason must name the new target and briefly explain why you changed your mind using public evidence; this is published before the shot. Do not claim new events occurred if you only reassessed existing clues. Keep private role knowledge and private reasoning in speech. If your target is unchanged, leave publicReason empty.'
            : 'Choose the action for the current stage. When speak=false, publicReason must be empty, but speech still holds your short private reason.';
  const strategy = ['selectTeam', 'votingForTeam'].includes(request.state.stage)
    ? (regularTeam
        ? 'Privately check in order: (1) For voting, evaluate ONLY actionFacts.team, the current proposedTeam; for selection, evaluate the exact legal roster you choose. Never substitute an earlier preferred team. (2) Use your own side, privateKnowledge and completed mission deductions; success or testimony cannot erase known Evil. (3) Count known and possible Evil against missionRule.failureAtLeast: enough Evil CAN sabotage, not necessarily WILL; one Evil cannot fail a two-Fail mission, but unknown teammates may supply another. (4) Choose for your actual side. Good normally avoids established sabotage risk when a safer reachable roster exists; Evil seeks sabotage access or concrete cover. (5) Before Reject, compare one reachable alternative and proposal.fifthLeader; only rejecting proposal 4 immediately forces proposal 5. Your own inclusion does not clear others. If off-team as Good, at most alignmentCounts.good - 1 Good can be inside. Before an information bet, name which possible result would distinguish your hypotheses; a known saboteur can explain another Fail without accusing new teammates. At two failures prioritize survival. If repeating a rejected roster, give a new public reason that could persuade a missing voter. Never publish these private checks.'
        : coalitionAdvice +
          ' Distinguish unresolved rosters from established sabotage risk. Persuade a missing voter with specific public evidence or a compromise; repeating the same question is not a new coalition plan.') +
      (evil ? ' ' + evilTeamAdvice : '')
    : request.state.stage === 'onMission'
      ? "Evil card advice: compare sabotage with a concrete future benefit of cover using score and failsRequired. Infer teammates' likely cards from their public words, recorded votes, completed missions and current incentives; keep these predictions uncertain. Table convention: when more Evil you know of are on a mission than its Fails need, the lowest-numbered of them play Fail, as many as it needs, and the rest play Success (seat 1 led first and the lead passes upward); analysis.missionCard.convention says which you are. Oberon and the other Evil do not see each other, so Oberon is outside it. Compare your card's effect if others play Success or Fail, including redundant exposure and the risk of too few Fails. Allies' future cards remain unknown; unresolved teammates may also be Evil and act independently. Oberon does not know allies. Weigh early exposure against cover, and prioritize a decisive sabotage over trust for a round that may never occur. Too few Evil cannot meet a two-Fail threshold. On a two-player first mission play Success: your partner would know exactly who failed."
      : request.state.stage === 'assassinate'
        ? assassinationCheck
        : request.state.stage === 'checkLoyalty'
          ? `${ladyInspectionAdvice} ${ladyTransferPreference}${evil ? ' ' + evilLadyAdvice : ''}`
          : request.state.stage === 'announceLoyalty'
            ? evil
              ? evilLadyAdvice
              : ''
            : '';
  const common =
    languageInstruction(request.language) +
    playerNameInstructions +
    ' ' +
    (regularTeam
      ? 'Answer the current objection, offer a preference or stay silent. Use bare seat numbers; avoid generic reports and repeated caveats.'
      : tableConversationAdvice) +
    ' ' +
    conversationVoiceAdvice +
    ' ' +
    (regularTeam ? regularAnalysisAdvice : analysisAdvice(role || '')) +
    'Play Avalon for your actual side and objective, using roleAdvice and privateKnowledge. Choose exactly one supplied legal choice. You choose strategy, trust, risk and public bluffing; known facts constrain private beliefs. No fixed speech, roster or vote is mandated. ' +
    'Completed missions establish results and Fail counts; rejected proposals played no cards and did not change the score. Each participant plays one card. An ordinary Success alone does not prove alignment; apply the winning-opportunity rule for decisive successes. Read failsRequired, approvalsRequired and score literally. Proposals 1–4 require a majority; proposal 5 runs automatically. Good needs three successes and Merlin surviving; Evil needs three failures or killing Merlin. Oberon knows no allies; use only visible privateKnowledge. ' +
    winningOpportunityAdvice +
    ' ' +
    (regularTeam
      ? 'Combine completed missions with your own known card and alignmentCounts. Each Fail needs a different Evil participant. If you played Success in a two-seat team with one Fail, the other player is Evil. Overlapping failed teams may have the same saboteur; do not invent another. Use only public evidence in public deductions. '
      : 'Combine ALL completed missions with alignmentCounts and reliable private facts before disputing a deduction. Fails give a lower bound on Evil in a team; remaining Evil slots can also give an upper bound. Example only: with three Evil total, disjoint teams showing two and one Fails contain exactly two and one Evil, even if Evil sometimes play Success. Do not add bounds across overlapping teams as if their participants were different. Use only publicly available bounds in public arguments, and update old hypotheses when new facts narrow them. ') +
    'Public claims and modelHypotheses are fallible, not verified roles. A truthful Lady result reveals alignment, not role, and does not clear its author. Do not invent votes, inspections, dialogue or future cards. ' +
    (request.readAllChat
      ? 'Facts override notes. Human testimony uses t:AUTHOR:SUBJECT; retain exact aliases and earliest/reversal/latest positions. source=[1-8 NEW refs]: positive=humanStatements.id, -N=chat slotN. Prior anchors persist; never recopy them. Bot testimony and other evidence use string sources. Omit unchanged notes. '
      : 'Facts override fallible modelHypotheses; old rosters are not current. Correct notes under the same key, citing evidence. Human testimony stays unverified. Keep role/check claims, commitments, corrections and position changes as testimony notes: source="chat:ID,ID" cites humanStatements.id, "recent:N,N" cites 1-based chat slots, "chat:ID;recent:N" combines them. Cite original and revision together; retain author/order in fact. Skip greetings and interface chatter. ') +
    'Never publicly confess being Merlin, expose a specific private role, the wizard pair or allies, or announce secret mission cards. Your own Evil ALIGNMENT may be admitted only through the structured admitEvil action and its public words as described below. A deliberate Percival claim through claimMorgana must appear in publicReason. Public arguments may bluff for your side; the private reason must use actual side and knowledge. Keep private certainty in speech and evidence. Merlin: apply the public-viewpoint check in roleAdvice, treating competing unverified claims equally; protect missions and identity without publishing secret certainty. ' +
    (evil
      ? exposedEvilAdvice
      : 'publicEvilAdmissions records other bots admitting their own Evil alignment. Good must not use admitEvil. An admitted Evil can promote an ally directly or endorse Good to discredit them; support alone is not proof of alliance. Compare both motives with actual votes, score and mission facts.') +
    ' ' +
    // How to read Lady announcements, once the table has a Lady result or is about to.
    (lady ? ladyAnnouncementAdvice + ' ' : '');
  if (commonOnly) return common;
  return (
    common +
    (assessLadyChoice ? ladyChoiceSignalAdvice + ' ' : '') +
    strategy +
    ' ' +
    (!evil && ['selectTeam', 'votingForTeam'].includes(request.state.stage) ? decisiveTeamAdvice + ' ' : '') +
    turn +
    ' ' +
    (request.speak ? publicSpeechAdvice : '') +
    (request.speak && request.style
      ? ' Perform personality in publicReason; earlier chat supplies facts, not a neutral voice to imitate.'
      : '') +
    (isOpeningPair(request) ? ' ' + openingTieBreakAdvice : '') +
    ' Return JSON choice, speech (private <=240 chars), publicReason (published verbatim <=240 chars), evidence (<=3 changed key/kind/fact/source/certainty notes). Use claim for hypotheses/testimony, bluff for deception; omit unchanged notes. Full-circle speech may be silent; a repeat-proposal leader must explain.' +
    (request.readAllChat
      ? ' Action evidence uses descriptive text sources, never numeric arrays. The t: key namespace is reserved for the separate human-memory update; use other keys for action notes.'
      : '')
  );
}

type Generate = (request: BotRequest, options: GenerationOptions, signal?: AbortSignal) => ReturnType<Decide>;
const LIGHT_PHASES = ['memory', 'line', 'roster-repair', 'decision-guard', 'admission', 'review'];

/**
 * Which calls get more or less thinking than the table's reasoning level: the assassination, final rosters, Lady
 * checks and anything at match point settle games; rewording a line, re-explaining a choice or reading old chat does
 * not.
 */
function decisionWeight(request: BotRequest, phase?: string): GenerationOptions['weight'] {
  if (LIGHT_PHASES.includes(phase || '')) return 'light';
  // The speaker's line keeps the table's level, on a leader's turn too: chat is what separates the bots from people.
  if (phase === 'speech') return undefined;
  const state = request.state;
  if (!state || request.publicDiscussion) return undefined;
  if (['assassinate', 'checkLoyalty', 'announceLoyalty'].includes(state.stage)) return 'critical';
  if (state.stage === 'selectTeam') return 'critical';
  const missions = (state.history || []).filter((event) => event.type === 'mission' && 'fails' in event) as {
    fails: number;
    settings?: { failsRequired?: number };
  }[];
  const failures = missions.filter((m) => m.fails >= (m.settings?.failsRequired ?? 1)).length;
  if (failures >= 2 || missions.length - failures >= 2) return 'critical';
  return undefined;
}

export function decisionPipeline(rawGenerate: Generate): Decide {
  const generate: Generate = (request, options, signal) =>
    rawGenerate(request, { weight: decisionWeight(request, options.phase), ...options }, signal);
  // Separate from bounded notes: survives evidence churn and technical continuation in this room.
  const exposedEvil = new Map<string, ExposedEvilState>();
  const evidence = new Map<string, DecisionEvidence[]>();
  const testimony = new Map<string, Map<string, BotRequest['chat']>>();
  // One pipeline belongs to one room, including technical continuations.
  const openingPriorities = new Map<string, number[]>();
  type ReviewExample = {
    id: string;
    stage: string;
    publicDiscussion: boolean;
    mission?: number;
    proposal: unknown;
    score: unknown;
    team: unknown;
    knowledge: unknown;
    choice: string;
    legalChoices: string[];
    reason: string;
    publicStatement: string;
    speechRules: {
      public: boolean;
      optionalAnnouncement: boolean;
      claimTargets: number[];
      requiredClaimStances: number[];
      mandatoryText: string;
    };
    tableConventions: unknown;
  };
  const reviewExamples = new Map<string, ReviewExample[]>();
  const decisionCounts = new Map<string, number>();
  const publicClaims = new Map<number, NonNullable<BotRequest['publicRoleClaims']>[number]>();
  const publicStances = new Map<string, NonNullable<BotRequest['previousClaimStances']>>();
  const notes = new Map<
    string,
    { stage: string; publicDiscussion: boolean; mission?: number; proposal?: number; choice: string }[]
  >();
  const readThrough = new Map<string, string | BotRequest['chat'][number]>();
  const storeEvidence = (
    request: BotRequest,
    current: Pick<ReturnType<typeof compactRequest>, 'humanStatements' | 'chat' | 'humanSeats'>,
    reply: BotReply,
  ) => {
    const merged = new Map((evidence.get(request.playerID) || []).map((fact) => [fact.key, fact]));
    const sources = new Map(testimony.get(request.playerID));
    const visible = new Map<string, BotRequest['chat'][number]>();
    for (const { id } of current.humanStatements || []) {
      const message =
        typeof id === 'number'
          ? request.chat[id - 1]
          : request.chat.find((m) => m.id === id || m.id?.slice(0, 8) === id)!;
      visible.set(`chat:${id}`, message);
    }
    if (current.chat)
      request.chat.slice(-14).forEach((message, index) => {
        if (current.humanSeats.includes(Number(message.name))) visible.set(`recent:${index + 1}`, message);
      });
    for (const fact of reply.evidence || []) {
      merged.delete(fact.key);
      merged.set(fact.key, {
        ...fact,
        certainty: fact.kind === 'bluff' || fact.certainty === 'bluff' ? 'bluff' : 'claim',
      });
      const previous = sources.get(fact.key) || [];
      sources.delete(fact.key);
      if (fact.kind === 'testimony' && (!request.readAllChat || fact.key.startsWith('t:'))) {
        // Extract only explicit source references; free-form event/private explanations add no anchors.
        const blocks = [...fact.source.matchAll(/(?:^|[;；]\s*)(chat|recent):([\da-f-]+(?:,[\da-f-]+)*)(?=$|[;；])/g)];
        if (!blocks.length || blocks.length > 2) continue;
        const messages = blocks.flatMap((block) => block![2].split(',').map((id) => visible.get(`${block![1]}:${id}`)));
        if (messages.length <= 8 && messages.every((message) => message)) {
          // A revision adds its sources to the same event, preserving the original/correction relationship.
          const combined = [...previous, ...(messages as BotRequest['chat'])];
          const order = new Map<string | BotRequest['chat'][number], number>(
            request.chat.map((message, index) => [message.id ?? message, index]),
          );
          const unique = [
            ...new Map(
              combined
                .filter((message) => order.has(message.id ?? message))
                .map((message) => [message.id ?? message, message]),
            ).values(),
          ].sort((a, b) => order.get(a.id ?? a)! - order.get(b.id ?? b)!);
          // Bound a long-running note to its original and latest seven revisions, rather than losing it at nine.
          sources.set(fact.key, unique.length > 8 ? [unique[0], ...unique.slice(-7)] : unique);
        }
      }
    }
    const all = [...merged.values()];
    const human = request.readAllChat
      ? all.filter((note) => note.kind === 'testimony' && note.key.startsWith('t:'))
      : [];
    // The model types role/check/vote reports; linked sources identify a history without classifying chat by keywords.
    const important = human
      .filter(
        (note) =>
          ['role', 'check', 'vote'].includes(note.key.split(':')[2]) || (sources.get(note.key)?.length || 0) > 1,
      )
      .slice(-12);
    const available = 12 - important.length;
    const otherHuman = human.filter((note) => !important.includes(note));
    const chosen = new Set([...important, ...(available ? otherHuman.slice(-available) : [])]);
    const primary = human.filter((note) => chosen.has(note));
    const remaining = 12 - primary.length;
    const secondary = all.filter((note) => !primary.includes(note));
    // Engine state can be revisited; unique human history must survive routine action-note churn.
    const retained = request.readAllChat
      ? [...(remaining ? secondary.slice(-remaining) : []), ...primary]
      : all.slice(-12);
    evidence.set(request.playerID, retained);
    testimony.set(request.playerID, new Map([...sources].filter(([key]) => retained.some((note) => note.key === key))));
  };
  // A reply that breaks the output contract is usually a one-off, and a paused match stalls every human at the
  // table: ask once more. Provider failures are not retried here.
  const retrying: Generate = async (call, options, signal) => {
    try {
      return await generate(call, options, signal);
    } catch (error) {
      if (!(error instanceof AiInvalidReply) || signal?.aborted) throw error;
      return generate(call, options, signal);
    }
  };
  // Rewrites of an already valid reply are optional: if one fails, keep the reply it would have replaced. A slow one
  // gives up after a minute instead of holding the turn for the full Codex timeout (a stalled call paused a Codex
  // check game for ten minutes).
  const optional = async (call: BotRequest, options: GenerationOptions, signal?: AbortSignal) => {
    const limit = AbortSignal.timeout(Number(process.env.AI_OPTIONAL_TIMEOUT_MS || 60000));
    try {
      return await generate(call, options, signal ? AbortSignal.any([signal, limit]) : limit);
    } catch (error) {
      if (signal?.aborted) throw error;
      return undefined;
    }
  };
  return async (request, signal) => {
    try {
      // A Good seat's silent vote is the deduction engine's vote, after the same guards as a model vote, with no call:
      // it was right more often than the model's votes, and at human tables confident words steered the model (where
      // the two disagreed the engine was right 36 times, the model 19). With humans seated Merlin still votes through
      // the model, whose cover reasoning weighs what the table is saying.
      const voter = request.state.players?.find((p) => p.id === request.playerID);
      if (
        codeVotesEnabled() &&
        request.state.stage === 'votingForTeam' &&
        voter &&
        !EVIL_ROLES.includes(voter.role) &&
        (voter.role !== 'merlin' || !humanSeatNumbers(request).length)
      ) {
        const vote = codeVote(request);
        const guard = vote && guardDecision(request, vote);
        const index = vote ? request.choices.indexOf(guard ? guard.choice : vote) : -1;
        if (index >= 0)
          return {
            choice: index,
            speech: '',
            privateReason: guard
              ? `Server guard: ${guard.reason}`
              : vote === 'approve'
                ? 'Code vote: this roster is as safe as the best one I can form from what I know.'
                : 'Code vote: a safer roster is available from what I know.',
          };
      }
      request = {
        ...request,
        humanMemory: [...(testimony.get(request.playerID)?.values() || [])],
        publicRoleClaims: [
          ...new Map([...publicClaims.values(), ...(request.publicRoleClaims || [])].map((c) => [c.by, c])).values(),
        ],
        previousClaimStances: publicStances.get(request.playerID) || request.previousClaimStances || [],
      };
      signal?.throwIfAborted();
      if (request.readAllChat) {
        const humanSeats = humanSeatNumbers(request);
        const messages = request.chat.filter((m) => humanSeats.includes(Number(m.name)));
        if (messages.some((m) => !m.id) || new Set(messages.map((m) => m.id)).size !== messages.length)
          throw new AiTechnicalPause('Human memory requires unique stable message IDs.');
        const identity = (m: BotRequest['chat'][number]) => m.id ?? m;
        const cursor = readThrough.get(request.playerID);
        const previous = cursor === undefined ? -1 : messages.findIndex((m) => identity(m) === cursor);
        if (cursor !== undefined && previous < 0)
          throw new AiTechnicalPause('Unread human chat exceeded saved history; cannot silently skip messages.');
        for (let offset = previous + 1; offset < messages.length; offset += 16) {
          const batch = messages.slice(offset, offset + 16);
          const last = batch[batch.length - 1];
          const end = request.chat.findIndex((m) => identity(m) === identity(last)) + 1;
          const memoryRequest: BotRequest = {
            ...request,
            memoryOnly: true,
            choices: ['observe'],
            speak: false,
            publicDiscussion: false,
            optionalSpeech: false,
            councilDiscussion: false,
            humanMemory: [],
            chat: request.chat.slice(0, end),
            state: { ...request.state, stage: 'votingForTeam' },
          };
          const memoryCurrent = compactRequest(memoryRequest);
          const context = {
            you: { seat: memoryCurrent.you?.seat },
            humanSeats,
            playerNames: memoryCurrent.playerNames,
            chat: memoryCurrent.chat,
            humanStatements: humanTestimony(memoryRequest, humanSeats, false),
            modelHypotheses: (evidence.get(request.playerID) || [])
              .filter((note) => note.kind === 'testimony' && note.key.startsWith('t:'))
              .map((note) => ({ key: note.key, kind: note.kind, fact: note.fact, certainty: note.certainty })),
            choices: ['observe'],
          };
          const instructions =
            languageInstruction(request.language).replace(
              'Use bare seat numbers, never names or Player prefixes.',
              '',
            ) +
            playerNameInstructions +
            ' Privately read these human messages; choose observe, speech and publicReason empty, claimMorgana=null, claimStances=[]. Return only JSON with at most3 changed testimony notes; no gameplay action. ' +
            'Only authors in humanSeats may have testimony notes. Bot messages are context only, never testimony authors or sources. If no human testimony needs updating, return evidence=[]. ' +
            'Prioritize corrections and changes of trust, roster preferences, commitments, role/check claims. Unverified does not mean unimportant. Skip noise, repeated claims and reconstructible mission arithmetic. ' +
            'Each key is t:AUTHOR:SUBJECT (e.g. t:7:King or t:2:role). Keep separate subjects and authors separate. Preserve exact names/aliases even without a seat mapping; never replace them with someone. ' +
            'In fact preserve earliest stance, intermediate reversal and latest stance in order, within240 characters. On same-key update retain relevant earlier history from modelHypotheses, never flatten a changed stance into a generic claim. A repeated claim is not a new role change. ' +
            'source is an array of1-8 NEW numeric references by that author: positive=humanStatements.id, -N=1-based chat slotN. Server retains earlier anchors; do not recopy their IDs. Cite the correction itself. kind=testimony, certainty=claim. Omit unchanged notes; at most12 are retained.';
          const reply = await retrying(
            memoryRequest,
            { phase: 'memory', decisionDetails: true, instructions, cacheInstructions: instructions, context },
            signal,
          );
          signal?.throwIfAborted();
          storeEvidence(memoryRequest, memoryCurrent, reply);
          readThrough.set(request.playerID, identity(last));
        }
        request = { ...request, humanMemory: [...(testimony.get(request.playerID)?.values() || [])] };
      }
      if (request.state.stage === 'onMission' && request.choices.length === 1) return { choice: 0, speech: '' };
      // A silent vote or mission card that the server checks settle the same way whatever the model answers needs no
      // call: Merlin's cover votes before any failure, an Evil card that wins the game, the table's Fail convention.
      if (['votingForTeam', 'onMission'].includes(request.state.stage) && request.choices.length === 2) {
        const settled = request.choices.map((choice) => guardDecision(request, choice) || { choice, reason: '' });
        const index = request.choices.indexOf(settled[0].choice);
        if (settled[0].choice === settled[1].choice && index >= 0)
          return {
            choice: index,
            speech: '',
            privateReason: `Server guard: ${(settled[0].reason || settled[1].reason).slice(0, 220)}`,
          };
      }
      const own = request.state.players?.find((p) => p.id === request.playerID);
      if (request.state.stage === 'announceLoyalty' && own && ['servant', 'merlin', 'percival'].includes(own.role)) {
        const choice = request.privateCheck && request.choices.indexOf(request.privateCheck);
        if (typeof choice !== 'number' || choice < 0) throw new AiPause('Не получен результат проверки Леди.');
        return { choice, speech: '' };
      }
      const finalReview = request.state.stage === 'end';
      const decisionRequest = request;
      const requiresExplanation =
        request.speak && request.state.stage === 'selectTeam' && request.state.vote > 0 && !request.publicDiscussion;
      const councilTarget =
        request.state.stage === 'assassinate' && !request.councilDiscussion
          ? request.evilCouncil?.find((advice) => advice.seat === request.name)?.target
          : undefined;
      const changedTarget = (reply: BotReply) =>
        Boolean(councilTarget && councilTarget !== request.choices[reply.choice]);
      const { missions, votes, tableConventions, requiredClaimStances, ...facts } = compactRequest(decisionRequest);
      let priority: number[] | undefined;
      if (own && isOpeningPair(request)) {
        priority = openingPriorities.get(request.playerID);
        if (!priority) {
          priority = shuffle(request.state.players.filter((p) => p.id !== request.playerID).map((p) => p.index));
          openingPriorities.set(request.playerID, priority);
        }
      }
      // Private generation context only: never add preferences to public room facts.
      const analysis = finalReview ? undefined : buildAnalysis(decisionRequest);
      const stale = finalReview || !request.speak ? [] : stalePhrases(decisionRequest);
      const current = {
        ...facts,
        ...(priority ? { privateTieBreakOrder: [...priority] } : {}),
        publicEvilAdmissions: request.state.players.filter((p) => exposedEvil.has(p.id)).map((p) => p.index),
        ...(exposedEvil.has(request.playerID)
          ? { exposedEvil: structuredClone(exposedEvil.get(request.playerID)!) }
          : {}),
        ...(analysis ? { analysis } : {}),
        ...(stale.length
          ? {
              wornOutPhrases: {
                phrases: stale,
                rule: 'This table has already said these too often; players read them as a bot. Do not use them: say it in your own words or more briefly.',
              },
            }
          : {}),
      };
      let reply = await retrying(
        decisionRequest,
        {
          phase: finalReview ? 'review' : 'decision',
          decisionDetails: !finalReview,
          cacheInstructions: finalReview ? undefined : decisionInstructions(request, true),
          instructions: finalReview
            ? systemFor(request) +
              ' decisionExamples with publicDiscussion=true record preferred teams voiced before selection, not submitted rosters or votes. Use recorded teamVotes to identify actual proposals and votes. ' +
              ' Write ONLY your final first-person post-game reflection, never a critique of a draft or instructions to yourself. Privately check you.side and you.outcome before writing; never describe a winning side as losing. Morgana, Mordred and Minion are Evil; Merlin, Percival and Servant are Good. Read revealedRoles, result and assassinations literally. A correct Lady result reveals alignment, not Merlin or a specific role. No individual can play two cards on a mission. A rejected proposal never played mission cards and did not itself cause a mission failure. Write 3-4 short conversational sentences in your personality about ONE consequential choice; let relief, pride, irritation or regret fit your actual outcome without forcing an emotional opener. Use decisionExamples or yourActions IDs privately to locate evidence; in your public words cite mission/proposal and seats, never internal IDs or field names. Explain: my actual choice; the belief recorded in my reason; evidence available THEN that supported or contradicted it; an alternative allowed by legalChoices and speechRules in that example and how it might have helped my actual side. Cite mission/proposal and seats. Do not lead with the victory rule or merely name the last event. decisionExamples are a bounded sample, not the whole game; their reasons are fallible historical beliefs, not facts. legalChoices, speechRules and tableConventions describe historical constraints: respect mandatory responses and whether silence or role claims were allowed. If a yourActions entry lacks these constraints, do not assume an unrecorded alternative was available. Distinguish private reason, actual publicStatement and speechRules.mandatoryText supplied by the server. To discuss role exposure, cite an actual public statement or action and consider a normal Good explanation; a private explanation alone was never a public leak. Compare them with missions, teamVotes and knowledge at that time. Revealed roles explain the outcome, not what you knew then. Never claim a certain win from a speculative alternative. If the choice was sound, explain why and identify the remaining uncertainty rather than inventing a mistake. A forced fifth proposal cannot be rejected; examine the preceding voluntary choice. Success does not prove alignment; each participant plays one card. Winning Evil must not recommend helping Good. In assassination compare actual council evidence with a plausible alternative; leadership alone is weak evidence. Do not recommend doing what you already did, invent inspections, or confuse proposals with completed missions.'
            : decisionInstructions(request) +
              (claimContext(request).targets.length || claimContext(request).stanceTargets.length
                ? claimInstructions
                : ''),
          context: finalReview
            ? { ...reviewContext(request), decisionExamples: reviewExamples.get(request.playerID) || [] }
            : {
                ...current,
                completedMissions: missions,
                rejectedProposals: (votes || []).filter((v) => v.result === 'reject'),
                approvedProposals: (votes || []).filter((v) => v.result !== 'reject'),
                speak: request.speak,
                previousDecisions: notes.get(request.playerID) || [],
                modelHypotheses: request.readAllChat
                  ? (evidence.get(request.playerID) || []).map((note) => ({
                      key: note.key,
                      kind: note.kind,
                      fact: note.fact,
                      certainty: note.certainty,
                    }))
                  : evidence.get(request.playerID) || [],
              },
        },
        signal,
      );
      signal?.throwIfAborted();
      const missingExplanation = (requiresExplanation || changedTarget(reply)) && !reply.publicReason?.trim();
      if (missingExplanation || contradictsRoster(decisionRequest, reply)) {
        reply = await retrying(
          decisionRequest,
          {
            phase: 'decision-repair',
            decisionDetails: true,
            cacheInstructions: decisionInstructions(request, true),
            instructions:
              decisionInstructions(request) +
              claimInstructions +
              (missingExplanation
                ? changedTarget(reply)
                  ? ' Your changed assassination target needs a public explanation. Return one legal choice; if it differs from your own council target, include a nonempty publicReason naming the new target and explaining the change from public evidence. Finish now.'
                  : ' Your public explanation was empty. Return one legal choice and a nonempty publicReason addressing another seat and explaining that exact roster from public evidence. Finish now.'
                : ' Your previous choice and explicitly selected roster in speech or publicReason disagree. Reconsider using the same facts; return one legal choice with matching private and public explanations. You may correct either the choice or explanations. Finish now.'),
            context: {
              ...current,
              completedMissions: missions,
              teamVotes: votes,
              modelHypotheses: request.readAllChat
                ? (evidence.get(request.playerID) || []).map((note) => ({
                    key: note.key,
                    kind: note.kind,
                    fact: note.fact,
                    certainty: note.certainty,
                  }))
                : evidence.get(request.playerID) || [],
              inconsistentReply: reply,
              selectedChoice: request.choices[reply.choice],
            },
          },
          signal,
        );
        signal?.throwIfAborted();
        if (contradictsRoster(decisionRequest, reply))
          throw new AiTechnicalPause('Decision and explained roster disagree.');
      }
      // A repaired reply must still pass the exposed-Evil checks and the leak filter that end this turn; one that does
      // not is not taken, so it cannot pause the match.
      const publishable = (candidate: BotReply) => {
        try {
          const next = nextExposedEvilState(request, candidate, exposedEvil.get(request.playerID));
          if (request.speak && request.state.stage !== 'assassinate')
            safePublicSpeech(
              candidate.publicReason || '',
              request.choices[candidate.choice] ?? '',
              request.language,
              candidate.claimMorgana != null,
              Boolean(next),
            );
          return true;
        } catch {
          return false;
        }
      };
      const excluded = finalReview ? [] : excludedButChosen(decisionRequest, reply);
      if (excluded.length) {
        // One repair, which may also keep the roster: the phrase check cannot always tell an argued case from a slip.
        const repaired = await optional(
          decisionRequest,
          {
            phase: 'roster-repair',
            decisionDetails: true,
            cacheInstructions: decisionInstructions(request, true),
            instructions:
              decisionInstructions(request) +
              claimInstructions +
              ` Your publicReason says ${excluded.join(', ')} stays off the team, but your selected roster ${request.choices[reply.choice]} includes ${excluded.length > 1 ? 'them' : 'that seat'}. Return the roster you actually mean, with a matching explanation; if ${excluded.join(', ')} does belong on it, say so plainly. Finish now.`,
            context: {
              ...current,
              completedMissions: missions,
              teamVotes: votes,
              inconsistentReply: reply,
              selectedChoice: request.choices[reply.choice],
            },
          },
          signal,
        );
        signal?.throwIfAborted();
        if (
          repaired &&
          !contradictsRoster(decisionRequest, repaired) &&
          (!requiresExplanation || repaired.publicReason?.trim()) &&
          publishable(repaired)
        )
          reply = repaired;
      }
      let guard = finalReview ? undefined : guardDecision(decisionRequest, request.choices[reply.choice]);
      if (guard && ['selectTeam', 'checkLoyalty'].includes(request.state.stage)) {
        // A spoken roster or Lady check gets one chance to revise its own explanation before the server substitutes it.
        const revised = await optional(
          decisionRequest,
          {
            phase: 'decision-guard',
            decisionDetails: true,
            cacheInstructions: decisionInstructions(request, true),
            instructions:
              decisionInstructions(request) +
              claimInstructions +
              ` Server check rejected your roster ${request.choices[reply.choice]}: ${guard.reason} Choose again from the same legal choices, for example ${guard.choice}, with matching private and public explanations. Finish now.`,
            context: { ...current, completedMissions: missions, teamVotes: votes, rejectedReply: reply },
          },
          signal,
        );
        signal?.throwIfAborted();
        if (
          revised &&
          !contradictsRoster(decisionRequest, revised) &&
          (!requiresExplanation || revised.publicReason?.trim()) &&
          publishable(revised)
        )
          reply = revised;
        guard = guardDecision(decisionRequest, request.choices[reply.choice]);
      }
      // Moving the shot off the assassin's own council pick needs a public explanation the server cannot write, so
      // such a shot stays with the model.
      if (guard && councilTarget && councilTarget !== guard.choice && request.state.stage === 'assassinate')
        guard = undefined;
      if (guard) {
        const index = request.choices.indexOf(guard.choice);
        if (index >= 0) {
          const spoken = request.speak && request.state.stage === 'selectTeam';
          const admission = reply.admitEvil ? reply : undefined;
          reply = {
            ...reply,
            choice: index,
            speech: `Server guard: ${guard.reason}`.slice(0, 240),
            publicReason: spoken ? (requiresExplanation ? aiText(request.language).neutralProposal : '') : '',
            claimMorgana: undefined,
            claimStances: [],
          };
          // An admission went out with the model's words for its own choice. A first admission gets one call to make
          // it with the server's choice; otherwise it waits for a later turn, and the model sees that it is not in
          // publicEvilAdmissions. A seat that has already admitted loses nothing.
          if (admission) {
            const previous = exposedEvil.get(request.playerID);
            const again = previous
              ? undefined
              : await optional(
                  decisionRequest,
                  {
                    phase: 'admission',
                    decisionDetails: true,
                    cacheInstructions: decisionInstructions(request, true),
                    instructions:
                      decisionInstructions(request) +
                      claimInstructions +
                      ` Server check replaced your choice ${request.choices[admission.choice]} with ${guard.choice}: ${guard.reason} Your public words and admission were for the old choice. Return ${guard.choice} with a publicReason for it in your own words. To admit your own Evil alignment now, say so in it with admitEvil=true and your exposedStrategy; to wait, use admitEvil=false and exposedStrategy=null. Finish now.`,
                    context: { ...current, completedMissions: missions, teamVotes: votes, rejectedReply: admission },
                  },
                  signal,
                );
            signal?.throwIfAborted();
            if (
              again?.admitEvil &&
              again.choice === index &&
              !contradictsRoster(decisionRequest, again) &&
              (!requiresExplanation || again.publicReason?.trim()) &&
              publishable(again)
            )
              reply = {
                ...reply,
                publicReason: again.publicReason,
                admitEvil: true,
                exposedStrategy: again.exposedStrategy,
                strategyChangeReason: again.strategyChangeReason,
              };
            else
              reply = previous
                ? { ...reply, admitEvil: false }
                : { ...reply, admitEvil: false, exposedStrategy: undefined, strategyChangeReason: undefined };
          }
        }
      }
      // An Evil admission, anything an admitted Evil says and the assassin's changed-target note keep the decision's
      // own words: the speaker and the rewrites know neither, and a line that drops the admission or later claims Good
      // fails the exposed-Evil checks.
      const ownWords =
        Boolean(reply.admitEvil) ||
        exposedEvil.has(request.playerID) ||
        (request.state.stage === 'assassinate' && !request.councilDiscussion);
      const leaks = (line: string, percivalClaim = false) => {
        try {
          safePublicSpeech(line, request.choices[reply.choice], request.language, percivalClaim);
          return false;
        } catch {
          return true;
        }
      };
      // Think, then talk (speaker.ts): with the action final, a short call writes the line from what a player has in
      // mind. Its line must pass every speech check below; otherwise the decision's own line stays.
      if (
        speakerEnabled() &&
        !ownWords &&
        !finalReview &&
        (request.speak || request.councilDiscussion) &&
        reply.claimMorgana == null &&
        !reply.claimStances?.length &&
        (reply.publicReason?.trim() ||
          requiresExplanation ||
          (own && request.publicDiscussion && addressedToYou(request, own.index).length))
      ) {
        const draft = reply.publicReason?.trim() || '';
        const instructions = speakerInstructions(request);
        const spoken = await optional(
          decisionRequest,
          {
            phase: 'speech',
            decisionDetails: true,
            cacheInstructions: instructions,
            instructions,
            context: speakerContext(decisionRequest, reply, { missions, votes }, draft),
          },
          signal,
        );
        signal?.throwIfAborted();
        const line = spoken?.publicReason?.trim() || '';
        const candidate = { ...reply, publicReason: line };
        // A discussion seat may pass, as people do, unless someone just addressed it.
        const passes =
          spoken &&
          !line &&
          request.publicDiscussion &&
          !requiresExplanation &&
          !(own && addressedToYou(request, own.index).length);
        // Council lines are open Merlin talk, so the role-leak check does not apply to them.
        if (
          line &&
          line.length <= 240 &&
          (request.councilDiscussion || !leaks(line)) &&
          !contradictsRoster(decisionRequest, candidate) &&
          !excludedButChosen(decisionRequest, candidate).length &&
          !echoedPhrase(decisionRequest, line) &&
          !failWish(decisionRequest, line) &&
          !confessesFail(line) &&
          !falseVoteClaim(decisionRequest, line) &&
          (request.councilDiscussion || !merlinSpeechExposure(decisionRequest, line))
        )
          reply = candidate;
        else if (passes) reply = { ...reply, publicReason: '' };
      }
      // The checks below flag the public line; one rewrite of the words only answers everything they flagged, and the
      // choice never changes. Without a Percival claim to keep, the speaker's short prompt writes it. A line that still
      // fails a `withhold` check is dropped when optional; otherwise the old line stays.
      const checksSpeech = !finalReview && !request.councilDiscussion && request.speak && !ownWords;
      const line = () => reply.publicReason || '';
      const flagged: { check: string; accept: (text: string) => boolean; withhold?: boolean }[] = [];
      // Human testers' most common complaint: bots repeating each other's lines.
      const echo = checksSpeech ? echoedPhrase(decisionRequest, line()) : undefined;
      if (echo)
        flagged.push({
          check: `"${echo}" repeats an earlier chat line word for word, and players read copied lines as a bot: use your own words and personality, answer a specific player, add what is new, or keep it to a short agreement.`,
          accept: (text) => !echoedPhrase(decisionRequest, text),
        });
      // Stock lines must not pile up over a game.
      const worn = stale.length && !finalReview && !ownWords ? usedStalePhrases(decisionRequest, line(), stale) : [];
      if (worn.length)
        flagged.push({
          check: `${worn.map((pair) => `"${pair}"`).join(', ')} ${worn.length > 1 ? 'are' : 'is'} worn out at this table, and players read stock phrases as a bot: leave ${worn.length > 1 ? 'them' : 'it'} out, shorter if you can.`,
          accept: (text) => usedStalePhrases(decisionRequest, text, stale).length < worn.length,
        });
      const restated = checksSpeech && !requiresExplanation ? restatedRoster(decisionRequest, line()) : undefined;
      // Once a proposal has its backers people either agree in a few words or say nothing; half of such turns (by seat
      // and turn, so it is stable on retry) pass outright unless someone just addressed the seat, which also saves
      // the rewrite call.
      const quiet =
        restated &&
        own &&
        !addressedToYou(request, own.index).length &&
        (own.index + request.state.mission + request.state.vote) % 2 === 0;
      if (restated && !quiet) {
        const before = line().length;
        flagged.push({
          check: `at least two players just argued for ${restated}, and a long restatement of the same case reads as a bot: agree in your own voice in at most ten words or leave publicReason empty, adding something only if it is new.`,
          accept: (text) => text.length < before,
        });
      }
      const wish = checksSpeech ? failWish(decisionRequest, line()) : undefined;
      if (wish)
        flagged.push({
          check: `"${wish}" reads as wanting the mission to fail, which only Evil wants: argue for it as a Good player would, from public missions and votes.`,
          accept: (text) => !failWish(decisionRequest, text),
          withhold: true,
        });
      const exposed = checksSpeech ? merlinSpeechExposure(decisionRequest, line()) : undefined;
      if (exposed)
        flagged.push({
          check: `it names ${exposed.join(', ')}, whom you see as Evil, while the public record gives a Servant no reason to doubt ${exposed.length > 1 ? 'them' : 'that seat'} yet, and assassins look for exactly this kind of early accurate doubt: do not doubt, warn against or exclude ${exposed.length > 1 ? 'those seats' : 'that seat'} without a public reason; naming them neutrally or favourably is fine.`,
          accept: () => true,
          withhold: true,
        });
      if (quiet) reply = { ...reply, publicReason: '', claimMorgana: undefined, claimStances: [] };
      else if (flagged.length) {
        const lean = speakerEnabled() && reply.claimMorgana == null && !reply.claimStances?.length;
        const base = lean ? speakerInstructions(request) : decisionInstructions(request) + claimInstructions;
        const revised = await optional(
          decisionRequest,
          {
            phase: 'line',
            decisionDetails: true,
            cacheInstructions: lean ? base : decisionInstructions(request, true),
            instructions:
              base +
              ` Server check on your public line "${line()}": ${flagged.map((f) => f.check).join(' ')} Keep the same choice, ${request.choices[reply.choice]}, and rewrite publicReason.${requiresExplanation ? '' : ' An empty publicReason is allowed.'} Finish now.`,
            context: lean
              ? speakerContext(decisionRequest, reply, { missions, votes }, line())
              : { ...current, completedMissions: missions, teamVotes: votes, rejectedReply: reply },
          },
          signal,
        );
        signal?.throwIfAborted();
        const text = revised?.publicReason?.trim() || '';
        if (
          revised &&
          revised.choice === reply.choice &&
          text.length <= 240 &&
          (request.councilDiscussion || !leaks(text, revised.claimMorgana != null && !lean)) &&
          !contradictsRoster(decisionRequest, revised) &&
          (!requiresExplanation || text) &&
          !(checksSpeech && echoedPhrase(decisionRequest, text)) &&
          flagged.every((f) => f.accept(text))
        )
          reply = lean
            ? { ...reply, publicReason: text }
            : { ...reply, publicReason: text, claimMorgana: revised.claimMorgana, claimStances: revised.claimStances };
        else if (flagged.some((f) => f.withhold) && !requiresExplanation)
          reply = { ...reply, publicReason: '', claimMorgana: undefined, claimStances: [] };
      }
      const choice = request.choices[reply.choice];
      if (choice === undefined) throw new AiTechnicalPause('Invalid private decision.');
      if (!finalReview) validateClaims(request, reply);
      const nextExposure = finalReview
        ? undefined
        : nextExposedEvilState(request, reply, exposedEvil.get(request.playerID));
      const speech = finalReview
        ? reply.speech
        : request.state.stage === 'assassinate'
          ? reply.publicReason || ''
          : request.speak
            ? safePublicSpeech(
                reply.publicReason || '',
                choice,
                request.language,
                reply.claimMorgana != null,
                Boolean(nextExposure),
              )
            : '';
      if (requiresExplanation && !speech.trim())
        throw new AiTechnicalPause('Repeat proposal requires a public leader explanation.');
      if (changedTarget(reply) && !speech.trim())
        throw new AiTechnicalPause('Changed assassination target requires a public explanation.');
      // The words the room receives, settled before anything is recorded about them. A leader's final pick is printed
      // after "I propose <team>.", so an opening that names the team again goes. An invented vote is the most damaging
      // tell, so an optional line that claims one stays unsaid, unless it carries the decision's own words: an
      // admission or an admitted Evil's line passed the exposed-Evil checks as written.
      const typed = finalReview
        ? speech
        : withoutRepeatedEmoji(request, own?.index ?? 0, humanTypography(speech, request.language));
      const withheld =
        (request.publicDiscussion && spokenPass(typed)) ||
        (!requiresExplanation &&
          !request.councilDiscussion &&
          !(ownWords && !finalReview) &&
          Boolean(falseVoteClaim(request, typed)));
      const unrepeated =
        request.state.stage === 'selectTeam' && !request.publicDiscussion ? withoutTeamRepeat(typed, choice) : typed;
      const published = withheld ? '' : unrepeated.trim() || typed;
      if (nextExposure) exposedEvil.set(request.playerID, structuredClone(nextExposure));
      // Record only metadata accompanying published model speech, never generate speech from metadata.
      if (published.trim() && own && !finalReview && !request.councilDiscussion) {
        if (reply.claimMorgana != null)
          publicClaims.set(own.index, { by: own.index, target: reply.claimMorgana, status: 'claim' });
        const stances = new Map((publicStances.get(request.playerID) || []).map((s) => [s.seat, s]));
        for (const stance of reply.claimStances || []) stances.set(stance.seat, stance);
        publicStances.set(request.playerID, [...stances.values()]);
      }
      if (!finalReview) {
        const number = (decisionCounts.get(request.playerID) || 0) + 1;
        decisionCounts.set(request.playerID, number);
        const examples = [
          ...(reviewExamples.get(request.playerID) || []),
          {
            id: `decision-${number}`,
            stage: request.state.stage,
            publicDiscussion: Boolean(request.publicDiscussion),
            mission: current.mission,
            proposal: current.proposal,
            score: current.score,
            team: current.actionFacts?.team,
            knowledge: current.privateKnowledge,
            choice,
            legalChoices: [...request.choices],
            reason: reply.speech.slice(0, 240),
            publicStatement: published.slice(0, 500),
            speechRules: {
              public: Boolean(request.speak),
              optionalAnnouncement: Boolean(request.optionalSpeech),
              claimTargets: [...current.claimTargets],
              requiredClaimStances: [...requiredClaimStances],
              mandatoryText: '',
            },
            tableConventions,
          },
        ];
        // Keep early assumptions and recent turning points without replaying the whole conversation.
        reviewExamples.set(
          request.playerID,
          examples.length > 6 ? [...examples.slice(0, 2), ...examples.slice(-4)] : examples,
        );
        storeEvidence(request, current, reply);
      }
      notes.set(
        request.playerID,
        [
          ...(notes.get(request.playerID) || []),
          {
            stage: request.state.stage,
            publicDiscussion: Boolean(request.publicDiscussion),
            choice,
            mission: current.mission,
            proposal: current.proposal?.number,
          },
        ].slice(-4),
      );
      return {
        choice: request.choices.indexOf(choice),
        speech: published,
        privateReason: finalReview ? undefined : reply.speech.slice(0, 240),
      };
    } catch (error) {
      const pause =
        error instanceof AiPause ? error : new AiTechnicalPause('AI decision or speech failed. Match paused.');
      // Keep the underlying error for logs; players only see the pause message.
      if (pause !== error) Object.assign(pause, { cause: error });
      throw pause;
    }
  };
}
