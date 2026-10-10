import { claimContext, validateClaims, claimInstructions } from './claims';
import { languageInstruction } from './language';
import type { AiLanguage } from '@avalon/types';
import { AiPause, AiTechnicalPause, compactRequest, systemFor, tableConversationAdvice } from './client';
import type { BotReply, BotRequest, Decide, GenerationOptions, DecisionEvidence } from './client';

// Explicit allowlist: public role totals are safe; private assignments, cards, checks and notes stay private.
export function publicContext(request: BotRequest, choice: string) {
  const c = compactRequest(request);
  return {
    seat: c.you?.seat,
    personality: request.style,
    language: request.language ?? 'en',
    playerCount: c.playerCount,
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
    missions: c.missions.map(({ n, leader, team, result, fails }) => ({ n, leader, team, result, fails })),
    votes: c.votes,
    offTeamApprovals: c.offTeamApprovals,
    offTeamVotingPatterns: c.offTeamVotingPatterns,
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
  if (request.state.stage !== 'selectTeam' || !choice || !/^\d+(, \d+)*$/.test(choice)) return false;
  const stated = reply.speech.match(
    /(?:\b(?:choosing|I choose|I propose|my (?:chosen|selected) team is)|Я (?:выбираю|предлагаю)(?: команду)?|моя (?:выбранная )?команда|我(?:選擇|提議)(?:隊伍)?)\s*[:：]?\s*\[([1-8](?:\s*[,，、]\s*[1-8])+)\]/i,
  )?.[1];
  const seats = (value: string) =>
    value
      .split(/[,，、]/)
      .map(Number)
      .sort()
      .join(',');
  return Boolean(stated && seats(stated) !== seats(choice));
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
export function decisionInstructions(request: BotRequest) {
  const turn = request.publicDiscussion
    ? 'This is discussion before team selection: choice is a preference, not a submitted roster or vote.'
    : request.optionalSpeech
      ? 'As leader, select the final roster after hearing the full circle. publicReason may be empty.'
      : request.councilDiscussion
        ? 'The Evil council is public. In speech discuss your assassination candidate from public evidence, without announcing private allies.'
        : 'Choose the action for the current stage. When speak=false, publicReason must be empty.';
  return (
    languageInstruction(request.language) +
    ' ' +
    tableConversationAdvice +
    ' ' +
    'Play Avalon for your actual side and objective, using roleAdvice and privateKnowledge. Choose exactly one supplied legal choice. You decide strategy: self-inclusion, accusation, bluffing, trust and risk are not server mandates. Known facts constrain beliefs; they do not dictate a fixed speech or a single bluff. ' +
    'Completed missions establish results and Fail counts; rejected proposals played no cards and did not change the score. Each participant plays one card. Success alone does not prove alignment. Read failsRequired, approvalsRequired and score literally. Proposals 1–4 require a majority; proposal 5 runs automatically. Good needs three successes and Merlin surviving; Evil needs three failures or killing Merlin. Oberon knows no allies; use only visible privateKnowledge. ' +
    'Public claims and modelHypotheses are fallible testimony or notes, not verified roles. Retain useful earlier deductions and reconsider them with new evidence. A truthful Lady result reveals alignment, not role, and does not clear its author. Do not invent votes, inspections, dialogue or future cards. ' +
    'Keep private knowledge private: never confess being Evil or Merlin, expose the wizard pair or allies, or announce sabotage. A deliberate Percival claim is allowed through claimMorgana and must be written in publicReason. Your public argument can bluff for your side; your private reason must still use your actual side and knowledge. Merlin must protect both missions and their identity: use the public-viewpoint check in roleAdvice before publishing, including equal treatment of competing unverified claims. Keep private certainty in speech and evidence, not in unsupported public conclusions. ' +
    turn +
    ' Return JSON choice, speech (private reason, <=240 characters), publicReason (your actual public words, <=240 characters), evidence (at most 3 changed notes with key/kind/fact/source/certainty). Use claim certainty for hypotheses and testimony, bluff for deliberate deception. No unchanged evidence dump. Public words are published directly, without a rewrite or added sentences. Silence is allowed during discussion; respond when you have something to contribute.'
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
      const { missions, votes, ...current } = compactRequest(decisionRequest);
      let reply = await generate(
        decisionRequest,
        {
          phase: finalReview ? 'review' : 'decision',
          decisionDetails: !finalReview,
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
      if (contradictsRoster(decisionRequest, reply)) {
        reply = await generate(
          decisionRequest,
          {
            phase: 'decision-repair',
            decisionDetails: true,
            instructions:
              decisionInstructions(request) +
              claimInstructions +
              ' Your previous choice and explicitly selected roster in speech disagree. Reconsider using the same facts; return one legal choice with a matching explanation. You may correct either the choice or explanation. Finish now.',
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
      const speech =
        finalReview || request.councilDiscussion
          ? reply.speech
          : request.speak
            ? safePublicSpeech(reply.publicReason || '', choice, request.language, reply.claimMorgana != null)
            : '';
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
