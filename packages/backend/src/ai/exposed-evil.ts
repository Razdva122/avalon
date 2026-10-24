import type { BotReply, BotRequest } from './client';

export type ExposedEvilPlan = {
  mode: 'direct' | 'reverse';
  promotedSeat: number;
  desiredSeat: number;
  audienceSeat: number;
  rationale: string;
  reconsiderWhen: string;
};
export type ExposedEvilState = { admitted: true; plan: ExposedEvilPlan };

export function isEvilActor(request: BotRequest) {
  return ['mordred', 'morgana', 'minion', 'oberon'].includes(
    request.state.players?.find((p) => p.id === request.playerID)?.role || '',
  );
}

// Only the speaker's alignment is eligible; never a specific role or allies.
const ownEvil =
  /\b(?:i am|i'm|i’m)\s+(?:(?:an?|the)\s+)?(?:evil|mafia|bad guy)\b|\bi play for (?:evil|the evil side)\b|(?<![\p{L}\p{N}_])я\s*(?:—|-|это)?\s*(?:злой|злая|мафия|т[её]мный|т[её]мная|тьма)|(?<![\p{L}\p{N}_])я\s+на\s+(?:стороне\s+(?:зла|тьмы)|т[её]мной\s+стороне)|(?<![\p{L}\p{N}_])(?:я\s+)?играю\s+за\s+(?:зло|тьму)|(?<![\p{L}\p{N}_])я\s+за\s+(?:зло|тьму)|我(?:是|屬於)(?:邪惡|黑方|壞人)|\b(?:yo\s+)?soy\s+(?:del mal|malvado|malvada)\b|tôi\s+(?:là|thuộc)\s+phe\s+[aá]c/giu;
export function stripOwnEvilAdmission(speech: string) {
  return speech.replace(ownEvil, 'own public alignment');
}
function deniesAdmission(speech: string) {
  return /\b(?:i am|i'm)\s+(?:good|innocent|not evil)\b|(?<![\p{L}\p{N}_])я\s*(?:—|-|это)?\s*(?:мирный|мирная|добрый|добрая|светлый|светлая|не\s+злой|не\s+мафия)|(?<![\p{L}\p{N}_])я\s+на\s+(?:стороне\s+(?:добра|света)|светлой\s+стороне)|(?<![\p{L}\p{N}_])(?:я\s+)?играю\s+за\s+(?:добро|свет)|(?<![\p{L}\p{N}_])я\s+за\s+(?:добро|свет)|我是(?:好人|正義)|\bsoy\s+(?:bueno|buena|inocente)\b|tôi\s+thuộc\s+phe\s+thiện/iu.test(
    speech,
  );
}

export function exposedEvilFields(data: Record<string, unknown>, request?: BotRequest) {
  const { admitEvil, exposedStrategy, strategyChangeReason } = data;
  if (admitEvil !== undefined && typeof admitEvil !== 'boolean') throw Error('Invalid Evil admission.');
  if (
    strategyChangeReason !== undefined &&
    (typeof strategyChangeReason !== 'string' || [...strategyChangeReason].length > 240)
  )
    throw Error('Invalid strategy revision reason.');
  if (
    (admitEvil || exposedStrategy || strategyChangeReason) &&
    (!request || request.memoryOnly || !isEvilActor(request))
  )
    throw Error('Only an Evil actor can admit Evil or record an exposed strategy.');
  let plan: ExposedEvilPlan | undefined;
  if (exposedStrategy != null) {
    if (typeof exposedStrategy !== 'object' || Array.isArray(exposedStrategy)) throw Error('Invalid exposed strategy.');
    const p = exposedStrategy as Record<string, unknown>;
    const validSeat = (n: unknown) => Number.isInteger(n) && request!.state.players.some((s) => s.index === n);
    if (
      !['direct', 'reverse'].includes(String(p.mode)) ||
      !['promotedSeat', 'desiredSeat', 'audienceSeat'].every((k) => validSeat(p[k])) ||
      p.audienceSeat === request!.state.players.find((s) => s.id === request!.playerID)?.index ||
      (p.mode === 'direct' ? p.promotedSeat !== p.desiredSeat : p.promotedSeat === p.desiredSeat) ||
      !['rationale', 'reconsiderWhen'].every(
        (k) =>
          typeof p[k] === 'string' &&
          (p[k] as string).trim().length > 0 &&
          [...(p[k] as string)].length <= (k === 'rationale' ? 240 : 160),
      )
    )
      throw Error('Invalid exposed strategy fields.');
    plan = {
      mode: p.mode as ExposedEvilPlan['mode'],
      promotedSeat: p.promotedSeat as number,
      desiredSeat: p.desiredSeat as number,
      audienceSeat: p.audienceSeat as number,
      rationale: (p.rationale as string).trim(),
      reconsiderWhen: (p.reconsiderWhen as string).trim(),
    };
  }
  return {
    ...(admitEvil !== undefined ? { admitEvil: admitEvil as boolean } : {}),
    ...(plan ? { exposedStrategy: plan } : {}),
    ...(strategyChangeReason ? { strategyChangeReason: (strategyChangeReason as string).trim() } : {}),
  };
}

export function nextExposedEvilState(request: BotRequest, reply: BotReply, previous?: ExposedEvilState) {
  const fields = exposedEvilFields(reply as unknown as Record<string, unknown>, request);
  if (
    fields.admitEvil &&
    (!request.speak ||
      request.councilDiscussion ||
      !['selectTeam', 'checkLoyalty', 'announceLoyalty'].includes(request.state.stage) ||
      stripOwnEvilAdmission(reply.publicReason || '') === (reply.publicReason || ''))
  )
    throw Error('Evil admission requires matching public speech on a public turn.');
  if (!previous) {
    if (fields.exposedStrategy && !fields.admitEvil) throw Error('An exposed strategy needs a public admission.');
    if (fields.admitEvil && !fields.exposedStrategy) throw Error('Evil admission needs a persistent plan.');
    return fields.admitEvil ? { admitted: true as const, plan: fields.exposedStrategy! } : undefined;
  }
  if (deniesAdmission(reply.publicReason || '')) throw Error('A public Evil admission cannot be retracted.');
  if (!fields.exposedStrategy) return previous;
  const changed = (['mode', 'promotedSeat', 'desiredSeat', 'audienceSeat'] as const).some(
    (k) => previous.plan[k] !== fields.exposedStrategy![k],
  );
  if (changed && !fields.strategyChangeReason) throw Error('A changed strategy requires a concrete revision reason.');
  return changed ? { admitted: true as const, plan: fields.exposedStrategy } : previous;
}

export const exposedEvilAdvice =
  'Exposed Evil: choose whether your own cover is exhausted from reliable checks, mission deductions and recorded acceptance by the players you need to persuade; accusation or abuse alone is not enough. If continued denial has no credible audience, acknowledge ONLY your own Evil alignment in natural public words, set admitEvil=true and supply an exposedStrategy. Never name your specific Evil role, confess allies or publish your private plan. No server text is added. Good cannot use this capability. ' +
  'exposedEvil is your separate persistent private state; publicEvilAdmissions lists only public bot admissions. Once admitted, never return to claiming Good or denying that accepted check. Do not repeat the admission every turn. Good-cover arguments no longer describe your own pose. Keep playing for Evil, including assassination. ' +
  'Choose one coherent plan: direct promotes the same seat you actually want selected; reverse promotes a different seat so a named audience distrusts your endorsement and selects your desired seat. Reverse needs actual evidence that this audience uses your endorsements as links; do not assume automatic reverse psychology or that anyone will take a reliably known Evil. Use actual private knowledge; Oberon cannot invent allies. Evaluate complete rosters and Fail thresholds, not just one player. ' +
  'Later retain the stored plan with exposedStrategy=null, admitEvil=false, strategyChangeReason="". Explain privately how this exact proposal or vote advances it. A reverse plan can approve Good rosters or oppose Evil rosters for a concrete influence benefit when the score permits; a direct plan supports sabotage access. Do not independently randomize the line each vote. Different rosters and thresholds can require different votes within the SAME plan. Never trade a guaranteed immediate Evil victory for deception or allow an avoidable final Good success for hypothetical future cover: take the win or revise with a concrete reason. ' +
  'Change the plan only for new checks, changed feasibility, an actual audience response or an immediate winning opportunity. Return the full revised exposedStrategy plus strategyChangeReason naming that event. A paraphrase or whim is not a reason. Keep rationale, desiredSeat and reconsiderWhen private. If no useful public move remains, silence is allowed when the turn permits. Observers must not treat admitted Evil support as automatic proof of alliance: compare direct and reverse motives with actual votes, score and mission facts.';
