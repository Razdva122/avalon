import type { AiLanguage } from '@avalon/types';

export function languageInstruction(language: AiLanguage = 'en'): string {
  const instruction = {
    en: 'Speak ENGLISH ONLY.',
    es: 'Speak SPANISH ONLY, using natural Spanish phrasing.',
    vi: 'Speak VIETNAMESE ONLY, using natural Vietnamese phrasing and correct diacritics.',
    ru: 'Speak RUSSIAN ONLY, using natural Russian phrasing.',
    'zh-tw':
      'Speak TRADITIONAL CHINESE ONLY (zh-TW), with Taiwan vocabulary and Traditional characters, never Simplified Chinese.',
  }[language];
  return `${instruction} Use this language for all written explanations, publicReason, speech, memory and evidence text, including public Evil council and post-game reflections. Keep JSON keys and exact legal choice values unchanged. Use bare seat numbers, never names or Player prefixes.`;
}

const texts = {
  en: {
    thinking: 'Bots are considering their next action.',
    waitingForHuman: 'Waiting for the human player’s action. Use the board controls and chat.',
    waitingForDiscussion: 'Your turn to speak. Send a chat message or pass.',
    ready: 'AI players ready · English discussion',
    pauseExpired: 'Match stopped: the pause lasted 15 minutes. Create a new match to play again.',
    postGamePrefix: 'Post-game: ',
    councilPrefix: 'Evil council (revealed): ',
    vote: (choice: string) => `I vote ${choice}.`,
    // A few natural forms, picked by the proposal's place in the game, so a leader's line is not the same stamp
    // every time; every form names the team, the leader as "me" the way people type it ("Going with 1, 2 and me.").
    // A blind judge read the fixed "4, 1, 2 for this one." as a bot's line.
    proposal: (team: string, n = 0, leader?: string) => {
      const seats = team.split(', ');
      const named = leader && seats.includes(leader) ? [...seats.filter((seat) => seat !== leader), 'me'] : seats;
      const list = named.length > 1 ? `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}` : named[0];
      return [
        `I propose ${team}.`,
        `${list[0].toUpperCase()}${list.slice(1)}.`,
        `Going with ${list}.`,
        `Let's do ${list}.`,
      ][n % 4];
    },
    inspection: (seat: string, good: boolean) => `Checked ${seat} with the Lady: ${good ? 'Good' : 'Evil'}.`,
    // Varied by the inspected seat: one fixed reply repeated by every checked bot read as a template.
    inspectionResponse: (inspector: string, good: boolean, n = 0) =>
      (good
        ? [
            `Yep, ${inspector} is right about me. Doesn't make ${inspector} Good though.`,
            `${inspector}'s right, I'm Good. Says nothing about ${inspector} yet.`,
            `Right, I'm Good. Still not sure about ${inspector}.`,
            `${inspector} got me right, I'm Good. Their own side is another question.`,
          ]
        : [
            `${inspector} is lying, I'm Good. So ${inspector} is the Evil one here.`,
            `${inspector} is lying. I'm Good, which makes you the Evil one.`,
            `You're lying, ${inspector}. I'm Good, so you just outed yourself.`,
            `${inspector} is lying about me. I'm Good, so look at ${inspector}.`,
          ])[n % 4],
    council: (target: string, reason: string) => `Evil council - my pick is ${target}. ${reason}`,
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
    thinking: 'Боты обдумывают ход.',
    waitingForHuman: 'Ждём ход человека. Используй кнопки на поле и чат.',
    waitingForDiscussion: 'Твоё слово. Отправь сообщение в чат или передай слово.',
    ready: 'AI-игроки готовы · Обсуждение на русском',
    pauseExpired: 'Партия остановлена: пауза длилась 15 минут. Чтобы сыграть, создайте новую партию.',
    postGamePrefix: 'После игры: ',
    councilPrefix: 'Совет злых (раскрыт): ',
    vote: (choice: string) => `Я голосую ${choice === 'approve' ? 'за' : 'против'}.`,
    proposal: (team: string) => `Я предлагаю команду ${team}.`,
    inspection: (seat: string, good: boolean) => `Проверил ${seat} Леди: ${good ? 'мирный' : 'злой'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `Да, ${inspector} про меня прав. Но это ещё не значит, что ${inspector} мирный.`
        : `${inspector} врёт, я мирный. Значит, злой тут сам ${inspector}.`,
    council: (target: string, reason: string) => `Совет злых: я за ${target}. ${reason}`,
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
  es: {
    thinking: 'Los bots están pensando su siguiente acción.',
    waitingForHuman: 'Esperando la acción del jugador humano. Usa los controles del tablero y el chat.',
    waitingForDiscussion: 'Te toca hablar. Envía un mensaje al chat o pasa el turno.',
    ready: 'Jugadores de IA listos · Debate en español',
    pauseExpired: 'Partida detenida: la pausa duró 15 minutos. Crea una nueva partida para volver a jugar.',
    postGamePrefix: 'Después de la partida: ',
    councilPrefix: 'Consejo del Mal (revelado): ',
    vote: (choice: string) => `Voto ${choice === 'approve' ? 'a favor' : 'en contra'}.`,
    proposal: (team: string) => `Propongo el equipo ${team}.`,
    inspection: (seat: string, good: boolean) => `He comprobado a ${seat} y anuncio: ${good ? 'Bien' : 'Mal'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `Soy del Bien, así que ${inspector} anunció mi bando correctamente. Esto por sí solo no demuestra que ${inspector} sea del Bien.`
        : `Soy del Bien. ${inspector} miente sobre mi bando; acuso a ${inspector} de ser del Mal.`,
    council: (target: string, reason: string) => `Consejo del Mal: objetivo ${target}. ${reason}`,
    percivalClaim: (target: number) =>
      `Soy Percival. ${target} es Morgana. Incluidme en las misiones y excluid a ${target}.`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') =>
      `${stance === 'trust' ? 'Confío' : 'No confío'} en la afirmación de ${target} de ser Percival.`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `Soy del Bien. La misión ${mission} tuvo ${fails} cartas de fracaso; ${targets.join(' y ')} nos traicionaron. Rechazo los equipos que los incluyan.`,
    neutralReject: 'Necesito pruebas más sólidas antes de apoyar a este equipo.',
    neutralApprove: 'Quiero probar este equipo y evaluar el resultado.',
    neutralProposal: 'Este es el equipo que quiero probar en la misión.',
  },
  vi: {
    thinking: 'Các bot đang suy nghĩ về hành động tiếp theo.',
    waitingForHuman: 'Đang chờ người chơi hành động. Hãy dùng các nút trên bàn chơi và khung trò chuyện.',
    waitingForDiscussion: 'Đến lượt bạn phát biểu. Hãy gửi tin nhắn hoặc bỏ qua lượt nói.',
    ready: 'Người chơi AI đã sẵn sàng · Thảo luận bằng tiếng Việt',
    pauseExpired: 'Ván chơi đã dừng: đã tạm dừng 15 phút. Hãy tạo ván mới để chơi tiếp.',
    postGamePrefix: 'Sau ván chơi: ',
    councilPrefix: 'Hội đồng phe Ác (đã công khai): ',
    vote: (choice: string) => `Tôi bỏ phiếu ${choice === 'approve' ? 'tán thành' : 'phản đối'}.`,
    proposal: (team: string) => `Tôi đề xuất đội ${team}.`,
    inspection: (seat: string, good: boolean) =>
      `Tôi đã kiểm tra ${seat} và công bố: ${good ? 'phe Thiện' : 'phe Ác'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `Tôi thuộc phe Thiện, nên ${inspector} đã công bố đúng phe của tôi. Chỉ điều này chưa chứng minh ${inspector} thuộc phe Thiện.`
        : `Tôi thuộc phe Thiện. ${inspector} nói dối về kết quả kiểm tra tôi; tôi cho rằng ${inspector} thuộc phe Ác.`,
    council: (target: string, reason: string) => `Hội đồng phe Ác: mục tiêu ${target}. ${reason}`,
    percivalClaim: (target: number) =>
      `Tôi là Percival. ${target} là Morgana. Hãy cho tôi đi nhiệm vụ và loại ${target}.`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') =>
      `Tôi ${stance === 'trust' ? 'tin' : 'không tin'} lời ${target} tự nhận là Percival.`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `Tôi thuộc phe Thiện. Nhiệm vụ ${mission} có ${fails} lá thất bại; ${targets.join(' và ')} đã phản bội chúng ta. Tôi phản đối đội có họ.`,
    neutralReject: 'Tôi cần bằng chứng thuyết phục hơn trước khi ủng hộ đội này.',
    neutralApprove: 'Tôi muốn thử đội này và đánh giá kết quả.',
    neutralProposal: 'Đây là đội tôi muốn thử trong nhiệm vụ.',
  },
  'zh-tw': {
    thinking: '機器人正在思考下一步行動。',
    waitingForHuman: '等待真人玩家行動。請使用遊戲面板與聊天室。',
    waitingForDiscussion: '輪到你發言。請在聊天室發言，然後交棒。',
    ready: 'AI 玩家已就緒 · 繁體中文討論',
    pauseExpired: '對局已停止：暫停已達 15 分鐘。請建立新對局以繼續遊玩。',
    postGamePrefix: '賽後回顧：',
    councilPrefix: '邪惡陣營密談（公開）：',
    vote: (choice: string) => `我投${choice === 'approve' ? '贊成' : '反對'}票。`,
    proposal: (team: string) => `我提議隊伍 ${team}。`,
    inspection: (seat: string, good: boolean) => `我查驗了 ${seat}，宣布：${good ? '正義' : '邪惡'}。`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `我是正義方，所以 ${inspector} 正確公布了我的陣營。這本身並不能證明 ${inspector} 是正義方。`
        : `我是正義方。${inspector} 對我的查驗結果說謊；我指控 ${inspector} 是邪惡方。`,
    council: (target: string, reason: string) => `邪惡陣營會議：目標 ${target}。${reason}`,
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
