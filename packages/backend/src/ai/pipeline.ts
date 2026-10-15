import { claimContext, validateClaims, claimInstructions } from './claims';
import { languageInstruction } from './language';
import type { AiLanguage } from '@avalon/types';
import {
  AiPause,
  AiTechnicalPause,
  compactRequest,
  systemFor,
  tableConversationAdvice,
  coalitionAdvice,
  decisiveTeamAdvice,
  evilTeamAdvice,
  ladyAnnouncementAdvice,
  ladyInspectionAdvice,
  ladyTransferPreference,
  ladyChoiceSignalAdvice,
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
    offTeamApprovals: c.offTeamApprovals,
    offTeamVotingPatterns: c.offTeamVotingPatterns,
    votingPatterns: c.votingPatterns,
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
): string {
  // This guard detects explicit private-role leaks only; it does not understand claims or choose wording.
  const checked = percivalClaim ? speech.replace(/\bpercival\b|персиваль|派西維爾/gi, 'public claim') : speech;
  const roleLeak =
    /\b(?:i am|i'm|we are|we're)\s+(?:an?\s+|the\s+)?(?:evil|merlin|percival|morgana|mordred|minion|oberon)\b|(?:я|мы)\s*(?:—|-|это|являюсь|являемся)?\s*(?:злой|злые|мерлин|персиваль|моргана|мордред|приспешник|оберон)|(?:我|我們)是(?:邪惡|梅林|派西維爾|莫甘娜|莫德雷德|奧伯倫|爪牙)/i;
  const privateLeak =
    /\b(?:my|our) (?:evil allies|role is|wizard pair|wizard candidates)\b|\b[1-8]\s+(?:is|must be)\s+merlin\b|\bmerlin\s+is\s+[1-8]\b|[1-8]\s*(?:—|-|это|является)\s*мерлин|мерлин\s*(?:—|-|это)\s*[1-8]|мо[яи]\s+(?:роль|злые союзники|союзники|сообщники|пара магов|кандидаты в маги)|(?:我的(?:角色|邪惡盟友|梅林候選人)|[1-8]\s*是梅林)/i;
  const sabotageIntent =
    /\b(?:i|we)\s+(?:will|want to|intend to|plan to|am going to|are going to)\s+(?:sabotage|help evil|(?:let|make|ensure|force)[^.!?]{0,50}\bfail)\b|\b(?:my|our)\s+strategy\s+to\s+(?:let|make|ensure|force)[^.!?]{0,50}\bfail\b|\b(?:prevent\w*|avoid\w*|unintended|accidental)\b[^.!?]{0,70}\bsuccess\b|(?:я|мы)\s+(?:саботир|(?:хочу|хотим|буду|будем|намерен|намерены)\s+(?:саботир|провалить|устроить\s+провал|помочь\s+злу))|(?:избеж|предотврат)[^.!?]{0,50}успех|(?:我|我們)(?:要|想要|想|打算|會|將|計畫)[^。！？]{0,40}(?:破壞|幫助邪惡|讓任務失敗)|(?:避免|阻止)[^。！？]{0,40}(?:成功|正義獲勝)/i;
  if (!roleLeak.test(checked) && !privateLeak.test(checked) && !sabotageIntent.test(checked)) return speech;
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
export function decisionInstructions(request: BotRequest, commonOnly = false) {
  const regularTeam =
    request.botDifficulty === 'regular' && ['selectTeam', 'votingForTeam'].includes(request.state.stage);
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
          : 'Choose the action for the current stage. When speak=false, publicReason must be empty.';
  const strategy = ['selectTeam', 'votingForTeam'].includes(request.state.stage)
    ? (regularTeam
        ? 'Privately check in order: (1) For voting, evaluate ONLY actionFacts.team, the current proposedTeam; for selection, evaluate the exact legal roster you choose. Never substitute an earlier preferred team. (2) Use your own side, privateKnowledge and completed mission deductions; success or testimony cannot erase known Evil. (3) Count known and possible Evil against missionRule.failureAtLeast: enough Evil CAN sabotage, not necessarily WILL; one Evil cannot fail a two-Fail mission, but unknown teammates may supply another. (4) Choose for your actual side. Good normally avoids established sabotage risk when a safer reachable roster exists; Evil seeks sabotage access or concrete cover. (5) Before Reject, compare one reachable alternative and proposal.fifthLeader; only rejecting proposal 4 immediately forces proposal 5. Your own inclusion does not clear others. If off-team as Good, at most alignmentCounts.good - 1 Good can be inside. Before an information bet, name which possible result would distinguish your hypotheses; a known saboteur can explain another Fail without accusing new teammates. At two failures prioritize survival. If repeating a rejected roster, give a new public reason that could persuade a missing voter. Never publish these private checks.'
        : coalitionAdvice +
          ' Distinguish unresolved rosters from established sabotage risk. Persuade a missing voter with specific public evidence or a compromise; repeating the same question is not a new coalition plan.') +
      ' ' +
      evilTeamAdvice
    : request.state.stage === 'onMission'
      ? "Evil card advice: compare sabotage with a concrete future benefit of cover using score and failsRequired. Infer teammates' likely cards from their public words, recorded votes, completed missions and current incentives; keep these predictions uncertain. There is no prearranged sabotage convention or designated saboteur; seat numbers do not assign cards. Compare your card's effect if others play Success or Fail, including redundant exposure and the risk of too few Fails. Allies' future cards remain unknown; unresolved teammates may also be Evil and act independently. Oberon does not know allies. Weigh early exposure against cover, and prioritize a decisive sabotage over trust for a round that may never occur. Too few Evil cannot meet a two-Fail threshold."
      : request.state.stage === 'assassinate'
        ? assassinationCheck
        : request.state.stage === 'checkLoyalty'
          ? `${ladyInspectionAdvice} ${ladyTransferPreference}`
          : '';
  const common =
    languageInstruction(request.language) +
    ' ' +
    (regularTeam
      ? 'Continue the conversation: answer the latest relevant question or objection, offer a concrete preference, or stay silent. Use natural language and bare seat numbers. Personality shapes tone, not facts, side or secrecy. Do not repeat a generic report or uncertainty disclaimer.'
      : tableConversationAdvice) +
    ' ' +
    'Play Avalon for your actual side and objective, using roleAdvice and privateKnowledge. Choose exactly one supplied legal choice. You choose strategy, trust, risk and public bluffing; known facts constrain private beliefs. No fixed speech, roster or vote is mandated. ' +
    'Completed missions establish results and Fail counts; rejected proposals played no cards and did not change the score. Each participant plays one card. Success alone does not prove alignment. Read failsRequired, approvalsRequired and score literally. Proposals 1–4 require a majority; proposal 5 runs automatically. Good needs three successes and Merlin surviving; Evil needs three failures or killing Merlin. Oberon knows no allies; use only visible privateKnowledge. ' +
    (regularTeam
      ? 'Combine completed missions with your own known card and alignmentCounts. Each Fail needs a different Evil participant. If you played Success in a two-seat team with one Fail, the other player is Evil. Overlapping failed teams may have the same saboteur; do not invent another. Use only public evidence in public deductions. '
      : 'Combine ALL completed missions with alignmentCounts and reliable private facts before disputing a deduction. Fails give a lower bound on Evil in a team; remaining Evil slots can also give an upper bound. Example only: with three Evil total, disjoint teams showing two and one Fails contain exactly two and one Evil, even if Evil sometimes play Success. Do not add bounds across overlapping teams as if their participants were different. Use only publicly available bounds in public arguments, and update old hypotheses when new facts narrow them. ') +
    'Public claims and modelHypotheses are fallible, not verified roles. A truthful Lady result reveals alignment, not role, and does not clear its author. Do not invent votes, inspections, dialogue or future cards. ' +
    'Current actionFacts, privateKnowledge and recorded events override old modelHypotheses; previous rosters are not the current proposal. Retain supported notes; correct contradicted ones with the same evidence key and mission/proposal or event source. Never reason from a known false note. ' +
    'Never publicly confess being Evil or Merlin, expose the wizard pair or allies, or announce sabotage. A deliberate Percival claim through claimMorgana must appear in publicReason. Public arguments may bluff for your side; the private reason must use actual side and knowledge. Keep private certainty in speech and evidence. Merlin: apply the public-viewpoint check in roleAdvice, treating competing unverified claims equally; protect missions and identity without publishing secret certainty. ' +
    ladyAnnouncementAdvice +
    ' ';
  if (commonOnly) return common;
  return (
    common +
    (assessLadyChoice ? ladyChoiceSignalAdvice + ' ' : '') +
    strategy +
    ' ' +
    (['selectTeam', 'votingForTeam'].includes(request.state.stage) ? decisiveTeamAdvice + ' ' : '') +
    turn +
    ' Return JSON choice, speech (private reason, <=240 characters), publicReason (your actual public words, <=240 characters), evidence (at most 3 changed notes with key/kind/fact/source/certainty). Use claim certainty for hypotheses and testimony, bluff for deliberate deception. No unchanged evidence dump. Public words are published directly, without a rewrite or added sentences. Silence is allowed during the full public circle; the sole leader on a repeat proposal must explain their roster.'
  );
}

type Generate = (request: BotRequest, options: GenerationOptions, signal?: AbortSignal) => ReturnType<Decide>;
export function decisionPipeline(generate: Generate): Decide {
  const evidence = new Map<string, DecisionEvidence[]>();
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
  return async (request, signal) => {
    try {
      request = {
        ...request,
        publicRoleClaims: [
          ...new Map([...publicClaims.values(), ...(request.publicRoleClaims || [])].map((c) => [c.by, c])).values(),
        ],
        previousClaimStances: publicStances.get(request.playerID) || request.previousClaimStances || [],
      };
      signal?.throwIfAborted();
      if (request.state.stage === 'onMission' && request.choices.length === 1) return { choice: 0, speech: '' };
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
      const { missions, votes, ...current } = compactRequest(decisionRequest);
      let reply = await generate(
        decisionRequest,
        {
          phase: finalReview ? 'review' : 'decision',
          decisionDetails: !finalReview,
          cacheInstructions: finalReview ? undefined : decisionInstructions(request, true),
          instructions: finalReview
            ? systemFor(request) +
              ' decisionExamples with publicDiscussion=true record preferred teams voiced before selection, not submitted rosters or votes. Use recorded teamVotes to identify actual proposals and votes. ' +
              ' Write ONLY your final first-person post-game reflection, never a critique of a draft or instructions to yourself. Begin from you.side and you.outcome: never describe a winning side as losing. Morgana, Mordred and Minion are Evil; Merlin, Percival and Servant are Good. Read revealedRoles, result and assassinations literally. A correct Lady result reveals alignment, not Merlin or a specific role. No individual can play two cards on a mission. A rejected proposal never played mission cards and did not itself cause a mission failure. Write 3-4 short sentences about ONE consequential choice. Use a decisionExamples ID when available, otherwise a yourActions ID. Explain: my actual choice; the belief recorded in my reason; evidence available THEN that supported or contradicted it; an alternative allowed by legalChoices and speechRules in that example and how it might have helped my actual side. Cite mission/proposal and seats. Do not lead with the victory rule or merely name the last event. decisionExamples are a bounded sample, not the whole game; their reasons are fallible historical beliefs, not facts. legalChoices, speechRules and tableConventions describe historical constraints: respect mandatory responses and whether silence or role claims were allowed. If a yourActions entry lacks these constraints, do not assume an unrecorded alternative was available. Distinguish private reason, actual publicStatement and speechRules.mandatoryText supplied by the server. To discuss role exposure, cite an actual public statement or action and consider a normal Good explanation; a private explanation alone was never a public leak. Compare them with missions, teamVotes and knowledge at that time. Revealed roles explain the outcome, not what you knew then. Never claim a certain win from a speculative alternative. If the choice was sound, explain why and identify the remaining uncertainty rather than inventing a mistake. A forced fifth proposal cannot be rejected; examine the preceding voluntary choice. Success does not prove alignment; each participant plays one card. Winning Evil must not recommend helping Good. In assassination compare actual council evidence with a plausible alternative; leadership alone is weak evidence. Do not recommend doing what you already did, invent inspections, or confuse proposals with completed missions.'
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
                modelHypotheses: evidence.get(request.playerID) || [],
              },
        },
        signal,
      );
      signal?.throwIfAborted();
      const missingExplanation = requiresExplanation && !reply.publicReason?.trim();
      if (missingExplanation || contradictsRoster(decisionRequest, reply)) {
        reply = await generate(
          decisionRequest,
          {
            phase: 'decision-repair',
            decisionDetails: true,
            cacheInstructions: decisionInstructions(request, true),
            instructions:
              decisionInstructions(request) +
              claimInstructions +
              (missingExplanation
                ? ' Your public explanation was empty. Return one legal choice and a nonempty publicReason addressing another seat and explaining that exact roster from public evidence. Finish now.'
                : ' Your previous choice and explicitly selected roster in speech or publicReason disagree. Reconsider using the same facts; return one legal choice with matching private and public explanations. You may correct either the choice or explanations. Finish now.'),
            context: {
              ...current,
              completedMissions: missions,
              teamVotes: votes,
              modelHypotheses: evidence.get(request.playerID) || [],
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
      const choice = request.choices[reply.choice];
      if (choice === undefined) throw new AiTechnicalPause('Invalid private decision.');
      if (!finalReview) validateClaims(request, reply);
      const speech = finalReview
        ? reply.speech
        : request.councilDiscussion
          ? reply.publicReason || ''
          : request.speak
            ? safePublicSpeech(reply.publicReason || '', choice, request.language, reply.claimMorgana != null)
            : '';
      if (requiresExplanation && !speech.trim())
        throw new AiTechnicalPause('Repeat proposal requires a public leader explanation.');
      // Record only metadata accompanying published model speech, never generate speech from metadata.
      if (speech.trim() && own && !finalReview && !request.councilDiscussion) {
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
            publicStatement: speech.slice(0, 500),
            speechRules: {
              public: Boolean(request.speak),
              optionalAnnouncement: Boolean(request.optionalSpeech),
              claimTargets: [...current.claimTargets],
              requiredClaimStances: [...current.requiredClaimStances],
              mandatoryText: '',
            },
            tableConventions: current.tableConventions,
          },
        ];
        // Keep early assumptions and recent turning points without replaying the whole conversation.
        reviewExamples.set(
          request.playerID,
          examples.length > 6 ? [...examples.slice(0, 2), ...examples.slice(-4)] : examples,
        );
        const merged = new Map((evidence.get(request.playerID) || []).map((fact) => [fact.key, fact]));
        for (const fact of reply.evidence || []) {
          merged.delete(fact.key);
          merged.set(fact.key, {
            ...fact,
            certainty: fact.kind === 'bluff' || fact.certainty === 'bluff' ? 'bluff' : 'claim',
          });
        }
        evidence.set(request.playerID, [...merged.values()].slice(-12));
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
        speech,
        privateReason: finalReview ? undefined : reply.speech.slice(0, 240),
      };
    } catch (error) {
      const pause =
        error instanceof AiPause ? error : new AiTechnicalPause('AI decision or speech failed. Match paused.');
      throw pause;
    }
  };
}
