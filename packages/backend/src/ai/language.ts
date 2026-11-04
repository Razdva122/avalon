import type { AiLanguage } from '@avalon/types';

export function languageInstruction(language: AiLanguage = 'en'): string {
  const instruction = {
    en: 'Speak ENGLISH ONLY.',
    pt: 'Speak PORTUGUESE ONLY, using natural Portuguese phrasing and correct accents.',
    'zh-cn': 'Speak SIMPLIFIED CHINESE ONLY (zh-CN), using Simplified characters, never Traditional Chinese.',
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
    proposal: (team: string) => `I propose ${team}.`,
    inspection: (seat: string, good: boolean) => `I inspected ${seat} and announce: ${good ? 'Good' : 'Evil'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `I am Good, so ${inspector} reported my alignment correctly. This alone does not prove ${inspector} is Good.`
        : `I am Good. ${inspector} is lying about my inspection; I accuse ${inspector} of being Evil.`,
    council: (target: string, reason: string) => `Evil council: Target ${target}. ${reason}`,
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
    inspection: (seat: string, good: boolean) => `Я проверил ${seat} и объявляю: ${good ? 'мирный' : 'злой'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `Я мирный, поэтому ${inspector} верно объявил мою сторону. Само по себе это не доказывает, что ${inspector} мирный.`
        : `Я мирный. ${inspector} лжёт о моей проверке; я обвиняю ${inspector} в игре за злых.`,
    council: (target: string, reason: string) => `Совет злых: Цель ${target}. ${reason}`,
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
  pt: {
    thinking: 'Os bots estão pensando na próxima ação.',
    waitingForHuman: 'Aguardando a ação do jogador humano. Use os controles do tabuleiro e o chat.',
    waitingForDiscussion: 'É sua vez de falar. Envie uma mensagem no chat ou passe a vez.',
    ready: 'Jogadores de IA prontos · Discussão em português',
    pauseExpired: 'Partida encerrada: a pausa durou 15 minutos. Crie uma nova partida para jogar novamente.',
    postGamePrefix: 'Após a partida: ',
    councilPrefix: 'Conselho do Mal (revelado): ',
    vote: (choice: string) => `Voto ${choice === 'approve' ? 'a favor' : 'contra'}.`,
    proposal: (team: string) => `Proponho a equipe ${team}.`,
    inspection: (seat: string, good: boolean) => `Verifiquei ${seat} e anuncio: ${good ? 'Bem' : 'Mal'}.`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `Sou do Bem, então ${inspector} anunciou meu alinhamento corretamente. Isso por si só não prova que ${inspector} é do Bem.`
        : `Sou do Bem. ${inspector} está mentindo sobre minha verificação; acuso ${inspector} de ser do Mal.`,
    council: (target: string, reason: string) => `Conselho do Mal: alvo ${target}. ${reason}`,
    percivalClaim: (target: number) => `Sou Percival. ${target} é Morgana. Incluam-me nas missões e excluam ${target}.`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') =>
      `${stance === 'trust' ? 'Confio' : 'Não confio'} na afirmação de ${target} de ser Percival.`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `Sou do Bem. A missão ${mission} teve ${fails} cartas de fracasso; ${targets.join(' e ')} nos traíram. Rejeito equipes com eles.`,
    neutralReject: 'Preciso de provas mais fortes antes de apoiar esta equipe.',
    neutralApprove: 'Quero testar esta equipe e avaliar o resultado.',
    neutralProposal: 'Esta é a equipe que quero testar na missão.',
  },
  'zh-cn': {
    thinking: '机器人正在思考下一步行动。',
    waitingForHuman: '等待真人玩家行动。请使用游戏面板和聊天室。',
    waitingForDiscussion: '轮到你发言。请在聊天室发言或跳过。',
    ready: 'AI 玩家已就绪 · 简体中文讨论',
    pauseExpired: '对局已停止：暂停已达 15 分钟。请创建新对局以继续游戏。',
    postGamePrefix: '赛后回顾：',
    councilPrefix: '邪恶阵营密谈（公开）：',
    vote: (choice: string) => `我投${choice === 'approve' ? '赞成' : '反对'}票。`,
    proposal: (team: string) => `我提议队伍 ${team}。`,
    inspection: (seat: string, good: boolean) => `我查验了 ${seat}，宣布：${good ? '正义' : '邪恶'}。`,
    inspectionResponse: (inspector: string, good: boolean) =>
      good
        ? `我是正义方，所以 ${inspector} 正确公布了我的阵营。这本身并不能证明 ${inspector} 是正义方。`
        : `我是正义方。${inspector} 对我的查验结果说谎；我指控 ${inspector} 是邪恶方。`,
    council: (target: string, reason: string) => `邪恶阵营会议：目标 ${target}。${reason}`,
    percivalClaim: (target: number) => `我是派西维尔。${target} 是莫甘娜。请让我参加任务，排除 ${target}。`,
    percivalStance: (target: number, stance: 'trust' | 'distrust') =>
      `我${stance === 'trust' ? '' : '不'}相信 ${target} 的派西维尔声明。`,
    failedMission: (mission: number, fails: number, targets: (number | undefined)[]) =>
      `我是正义方。第 ${mission} 次任务有 ${fails} 张失败卡；${targets.join(' 和 ')} 背叛了我们。我反对包含他们的队伍。`,
    neutralReject: '我需要更充分的理由才会支持这支队伍。',
    neutralApprove: '我想测试这支队伍，再评估结果。',
    neutralProposal: '这是我想在任务中测试的队伍。',
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
