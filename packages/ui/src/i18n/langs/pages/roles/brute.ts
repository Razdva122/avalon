import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const brute: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Brute in Avalon: Rules, Missions & Strategy',
    seoTeam: 'Evil. A later Success card does not change your allegiance.',
    seoAbility: '{brute} may choose Fail or Success on missions 1–3. On missions 4 and 5, only Success is available.',
    seoLimit:
      'Can the Brute fail a late mission? No. The limit follows the mission number, not how many missions you personally joined. Unlike {lunatic}, you are not forced to fail early missions.',
    seoScenario1:
      'On mission 2, choose between an immediate Fail and a Success that may earn trust. Consider whether another evil player is on the team.',
    seoScenario2:
      'On mission 4, you must play Success, but another evil teammate can still play Fail. A successful mission does not prove that everyone on it is good.',
    generalTips: 'General Tips:',
    earlyMissionFlexibility: 'Utilize early mission flexibility:',
    earlyMissionFlexibilityDescription:
      'Since {brute} can vote both ways in initial missions, use this to confuse the loyal servants about your allegiance.',
    maintainUnpredictability: 'Maintain unpredictability:',
    maintainUnpredictabilityDescription:
      'Moving inconsistently during the early missions can help mask your identity, making it difficult for others to deduce you as a {brute}.',
    strategicSuccessLater: 'Aim for strategic success later:',
    strategicSuccessLaterDescription:
      'In later missions, where only "Success" votes are allowed for {brute}, focus on gaining trust and influencing the game direction favorably for the Minions of Evil.',
  },
  ru: {
    seoHeading: 'Брут в Авалоне: правила миссий и стратегия',
    seoTeam: 'Зло. Обязательный успех в поздней миссии не меняет вашу сторону.',
    seoAbility: '{brute} выбирает провал или успех в миссиях 1–3. В миссиях 4 и 5 ему доступен только успех.',
    seoLimit:
      'Может ли Брут провалить позднюю миссию? Нет. Ограничение зависит от номера миссии, а не от числа ваших участий. В отличие от роли {lunatic}, ранний провал не обязателен.',
    seoScenario1:
      'Во второй миссии выбирайте между немедленным провалом и успехом ради доверия. Учитывайте присутствие другого злого игрока.',
    seoScenario2:
      'В четвёртой миссии вы обязаны дать успех, но другой злой участник всё ещё может дать провал. Успех миссии не доказывает, что все участники добрые.',
    generalTips: 'Общие советы:',
    earlyMissionFlexibility: 'Используйте гибкость в ранних миссиях:',
    earlyMissionFlexibilityDescription:
      'Поскольку {brute} может голосовать обоими способами в начальных миссиях, используйте это, чтобы запутать верных слуг относительно вашей принадлежности.',
    maintainUnpredictability: 'Сохраняйте непредсказуемость:',
    maintainUnpredictabilityDescription:
      'Непоследовательное движение в ранних миссиях может помочь скрыть вашу личность, затрудняя другим догадаться, что вы {brute}.',
    strategicSuccessLater: 'Стремитесь к стратегическому успеху позже:',
    strategicSuccessLaterDescription:
      'В более поздних миссиях, где {brute} разрешено голосование только за "Успех", сосредоточьтесь на завоевании доверия и влиянии на направление игры в пользу миньонов зла.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆野蛮人：任务限制与玩法策略',
    seoTeam: '坏人。后期必须出成功牌并不改变你的阵营。',
    seoAbility: '{brute}在第1至3次任务可选失败或成功，第4和5次任务只能出成功。',
    seoLimit:
      '野蛮人能破坏后期任务吗？不能。限制按全局任务编号计算，不是按你参加任务的次数计算。与{lunatic}不同，早期也不强制出失败。',
    seoScenario1: '第2次任务时，权衡立即出失败与出成功换取信任，也要考虑队伍里是否有另一名坏人。',
    seoScenario2: '第4次任务你必须出成功，但另一名坏人仍可出失败。任务成功不代表所有队员都是好人。',
    generalTips: '一般提示：',
    earlyMissionFlexibility: '利用早期任务的灵活性：',
    earlyMissionFlexibilityDescription:
      '由于 {brute} 可以在初始任务中投票选择两种方式，利用这一点来迷惑忠诚的仆人关于您的忠诚。',
    maintainUnpredictability: '保持不可预测性：',
    maintainUnpredictabilityDescription: '在早期任务中不一致地行动可以帮助掩盖您的身份，使其他人难以推断您是 {brute}。',
    strategicSuccessLater: '在后期任务中争取战略成功：',
    strategicSuccessLaterDescription:
      '在后期任务中，{brute} 只被允许投票 "成功"，集中精力赢得信任，并为邪恶的爪牙有利地影响游戏方向。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆野蠻人：任務限制與玩法策略',
    seoTeam: '壞人。後期必須出成功牌並不改變你的陣營。',
    seoAbility: '{brute}在第1至3次任務可選失敗或成功，第4和5次任務只能出成功。',
    seoLimit:
      '野蠻人能破壞後期任務嗎？不能。限制按全局任務編號計算，不是按你參加任務的次數計算。與{lunatic}不同，早期也不強制出失敗。',
    seoScenario1: '第2次任務時，權衡立即出失敗與出成功換取信任，也要考慮隊伍裡是否有另一名壞人。',
    seoScenario2: '第4次任務你必須出成功，但另一名壞人仍可出失敗。任務成功不代表所有隊員都是好人。',
    generalTips: '一般提示：',
    earlyMissionFlexibility: '利用早期任務的靈活性：',
    earlyMissionFlexibilityDescription:
      '由於 {brute} 可以在初始任務中投票選擇兩種方式，利用這一點來迷惑忠誠的僕人關於您的忠誠。',
    maintainUnpredictability: '保持不可預測性：',
    maintainUnpredictabilityDescription: '在早期任務中不一致地行動可以幫助掩蓋您的身份，使其他人難以推斷您是 {brute}。',
    strategicSuccessLater: '在後期任務中爭取戰略成功：',
    strategicSuccessLaterDescription:
      '在後期任務中，{brute} 只被允許投票 "成功"，集中精力贏得信任，並為邪惡的爪牙有利地影響遊戲方向。',
  },
  es: {
    seoHeading: 'Bruto en Avalon: misiones, reglas y estrategia',
    seoTeam: 'Mal. Jugar Éxito en una misión tardía no cambia tu bando.',
    seoAbility:
      '{brute} puede elegir Fracaso o Éxito en las misiones 1–3. En las misiones 4 y 5 solo puede jugar Éxito.',
    seoLimit:
      '¿Puede fallar una misión tardía? No. Importa el número de misión, no cuántas hayas jugado. A diferencia de {lunatic}, no está obligado a fallar las primeras.',
    seoScenario1:
      'En la misión 2, valora un Fracaso inmediato frente a un Éxito para ganar confianza. Ten en cuenta si hay otro malvado en el equipo.',
    seoScenario2:
      'En la misión 4 debes jugar Éxito, pero otro malvado aún puede jugar Fracaso. Una misión exitosa no demuestra que todos sean buenos.',
    generalTips: 'Consejos generales:',
    earlyMissionFlexibility: 'Utilizar la flexibilidad de las misiones tempranas:',
    earlyMissionFlexibilityDescription:
      'Dado que {brute} puede votar de ambas maneras en las misiones iniciales, usa esto para confundir a los sirvientes leales sobre tu lealtad.',
    maintainUnpredictability: 'Mantener la imprevisibilidad:',
    maintainUnpredictabilityDescription:
      'Moverse de manera inconsistente durante las primeras misiones puede ayudar a ocultar tu identidad, haciendo que sea difícil para otros deducir que eres {brute}.',
    strategicSuccessLater: 'Buscar el éxito estratégico más tarde:',
    strategicSuccessLaterDescription:
      'En las misiones posteriores, donde solo se permiten los votos de "Éxito" para {brute}, concéntrate en ganar confianza e influir favorablemente en la dirección del juego para los esbirros del mal.',
  },
  pt: {
    seoHeading: 'Bruto em Avalon: missões, regras e estratégia',
    seoTeam: 'Mal. Jogar Sucesso numa missão tardia não muda seu lado.',
    seoAbility: '{brute} pode escolher Falha ou Sucesso nas missões 1–3. Nas missões 4 e 5, só pode jogar Sucesso.',
    seoLimit:
      'Pode falhar numa missão tardia? Não. Vale o número da missão, não quantas você jogou. Ao contrário de {lunatic}, não é obrigado a falhar nas primeiras.',
    seoScenario1:
      'Na missão 2, compare uma Falha imediata com um Sucesso para ganhar confiança. Considere se há outro jogador do mal na equipe.',
    seoScenario2:
      'Na missão 4 você deve jogar Sucesso, mas outro jogador do mal ainda pode jogar Falha. Uma missão bem-sucedida não prova que todos são bons.',
    generalTips: 'Dicas Gerais:',
    earlyMissionFlexibility: 'Utilize a flexibilidade das missões iniciais:',
    earlyMissionFlexibilityDescription:
      'Como {brute} pode votar de ambas as formas nas missões iniciais, use isso para confundir os servos leais sobre sua lealdade.',
    maintainUnpredictability: 'Mantenha a imprevisibilidade:',
    maintainUnpredictabilityDescription:
      'Agir de forma inconsistente durante as missões iniciais pode ajudar a mascarar sua identidade, tornando difícil para os outros deduzir que você é um {brute}.',
    strategicSuccessLater: 'Busque o sucesso estratégico mais tarde:',
    strategicSuccessLaterDescription:
      'Nas missões posteriores, onde apenas votos de "Sucesso" são permitidos para {brute}, concentre-se em ganhar confiança e influenciar favoravelmente a direção do jogo para os Lacaios do Mal.',
  },
};
