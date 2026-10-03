import type { AiLanguage } from '@avalon/types';

export function languageInstruction(language: AiLanguage = 'en'): string {
  const instruction = {
    en: 'Speak ENGLISH ONLY.',
    ru: 'Speak RUSSIAN ONLY, using natural Russian phrasing.',
    'zh-tw':
      'Speak TRADITIONAL CHINESE ONLY (zh-TW), with Taiwan vocabulary and Traditional characters, never Simplified Chinese.',
  }[language];
  return `${instruction} Use this language for all written explanations, publicReason, speech, memory and evidence text, including private council and post-game reflections. Keep JSON keys and exact legal choice values unchanged. Use bare seat numbers, never names or Player prefixes.`;
}

const texts = {
  en: {
    ready: 'Seven AI players · English discussion',
    postGamePrefix: 'Post-game: ',
    councilPrefix: 'Evil council (revealed): ',
    vote: (choice: string) => `I vote ${choice}.`,
    proposal: (team: string) => `I propose ${team}.`,
    inspection: (seat: string, good: boolean) => `I inspected ${seat} and announce: ${good ? 'Good' : 'Evil'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `I am Good, so ${inspector} reported my alignment correctly. This alone does not prove ${inspector} is Good.`
        : `I am Good. ${inspector} is lying about my inspection; I accuse ${inspector} of being Evil.`,
    council: (target: string, reason: string) => `Evil council (revealed): Target ${target}. ${reason}`,
    percivalClaim: (target: number) =>
      `I am Percival. ${target} is Morgana. Include me in missions and exclude ${target}.`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') => `I ${stance} ${target}'s Percival claim.`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `I am Good. Mission ${mission} had ${fails} Fail card(s); ${targets.join(' and ')} betrayed us. I reject teams with them.`,
    neutralReject: 'I need stronger evidence before supporting this team.',
    neutralApprove: 'I want to test this team and assess the result.',
    neutralProposal: 'This is the team I want to test.',
  },
  ru: {
    ready: 'Семь AI-игроков · Обсуждение на русском',
    postGamePrefix: 'После игры: ',
    councilPrefix: 'Совет злых (раскрыт): ',
    vote: (choice: string) => `Я голосую ${choice === 'approve' ? 'за' : 'против'}.`,
    proposal: (team: string) => `Я предлагаю команду ${team}.`,
    inspection: (seat: string, good: boolean) => `Я проверил ${seat} и объявляю: ${good ? 'мирный' : 'злой'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `Я мирный, поэтому ${inspector} верно объявил мою сторону. Само по себе это не доказывает, что ${inspector} мирный.`
        : `Я мирный. ${inspector} лжёт о моей проверке; я обвиняю ${inspector} в игре за злых.`,
    council: (target: string, reason: string) => `Совет злых (раскрыт): Цель ${target}. ${reason}`,
    percivalClaim: (target: number) =>
      `Я Персиваль. ${target} — Моргана. Включайте меня в миссии и исключайте ${target}.`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') =>
      `Я ${stance === 'trust' ? '' : 'не '}доверяю заявлению ${target} о роли Персиваля.`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `Я мирный. На миссии ${mission} было ${fails} карт провала; ${targets.join(' и ')} предали нас. Я против команд с ними.`,
    neutralReject: 'Нужны более веские основания для поддержки этой команды.',
    neutralApprove: 'Хочу проверить эту команду и оценить результат.',
    neutralProposal: 'Эту команду я хочу проверить на миссии.',
  },
  'zh-tw': {
    ready: '七位 AI 玩家 · 繁體中文討論',
    postGamePrefix: '賽後回顧：',
    councilPrefix: '邪惡陣營密談（公開）：',
    vote: (choice: string) => `我投${choice === 'approve' ? '贊成' : '反對'}票。`,
    proposal: (team: string) => `我提議隊伍 ${team}。`,
    inspection: (seat: string, good: boolean) => `我查驗了 ${seat}，宣布：${good ? '正義' : '邪惡'}。`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `我是正義方，所以 ${inspector} 正確公布了我的陣營。這本身並不能證明 ${inspector} 是正義方。`
        : `我是正義方。${inspector} 對我的查驗結果說謊；我指控 ${inspector} 是邪惡方。`,
    council: (target: string, reason: string) => `邪惡陣營密談（公開）：目標 ${target}。${reason}`,
    percivalClaim: (target: number) => `我是派西維爾。${target} 是莫甘娜。請讓我參加任務，排除 ${target}。`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') =>
      `我${stance === 'trust' ? '' : '不'}相信 ${target} 的派西維爾聲明。`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `我是正義方。第 ${mission} 次任務有 ${fails} 張失敗卡；${targets.join(' 和 ')} 背叛了我們。我反對包含他們的隊伍。`,
    neutralReject: '我需要更充分的理由才會支持這支隊伍。',
    neutralApprove: '我想測試這支隊伍，再評估結果。',
    neutralProposal: '這是我想在任務中測試的隊伍。',
  },
};

export function aiText(language: AiLanguage = 'en') {
  return texts[language];
}

export function isVoteOnly(text: string): boolean {
  return Object.values(texts).some((t) => ['approve', 'reject'].some((choice) => text.trim() === t.vote(choice)));
}

export function isAfterGameSpeech(text: string): boolean {
  return Object.values(texts).some((t) => text.startsWith(t.postGamePrefix) || text.startsWith(t.councilPrefix));
}
