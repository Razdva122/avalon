import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const witch: { [key in TLanguage]: Dictionary<string> } = {
  pt: {
    seoHeading: 'Bruxa em Avalon: missão oculta e verificação',
    seoTeam: 'Mal. {witch} pode usar sua habilidade especial uma vez por partida nesta plataforma.',
    seoAbility:
      'A Bruxa pode ocultar o resultado de uma missão. Um jogador aleatório que não seja a Bruxa recebe o direito de verificar a lealdade exibida de um jogador.',
    seoLimit:
      'Ela transforma Falha em Sucesso? Não: oculta a informação sem mudar o resultado real. O sorteado é quem verifica, não o alvo da verificação.',
    seoScenario1:
      'Oculte uma missão quando perder essa informação pública favorecer o mal, mas considere o que a nova verificação pode revelar.',
    seoScenario2:
      'Uma verificação boa pode ser de {trickster}; uma má, de {troublemaker}. Interprete o resultado junto com os papéis habilitados e o histórico das missões.',
    generalTipsTitle: `Dicas Gerais:`,
    sowSeedsTitle: `Semeie confusão:`,
    sowSeedsText: `Utilize sua habilidade para manter os jogadores incertos sobre os resultados das missões, causando dúvida e indecisão nas fileiras do bem.`,
    collaborateTitle: `Colabore com outros malfeitores:`,
    collaborateText: `Considere cuidadosamente as consequências de ocultar uma missão, e só o faça quando beneficiar você e seus aliados.`,
    utilizePowerTitle: `Utilize seu poder estrategicamente:`,
    utilizePowerText: `O momento é crucial, pois você só pode usar seu poder uma vez. Ao ocultar o resultado de uma missão, um jogador aleatório não-bruxa recebe uma verificação de lealdade. Escolha o momento que maximize a confusão enquanto protege seus aliados.`,
  },
  en: {
    seoHeading: 'Witch in Avalon: Hidden Mission & Loyalty Check',
    seoTeam: 'Evil. {witch} can use the special ability once per game on this platform.',
    seoAbility:
      'The Witch may hide one mission’s outcome. A random player other than the Witch then receives the ability to check a player’s displayed loyalty.',
    seoLimit:
      'Does the Witch change a Fail into Success? No: hiding changes the information shown, not the actual outcome. The random player is the checker, not a randomly chosen target.',
    seoScenario1:
      'Hide a mission when losing public information is useful to evil, but weigh the information that the new loyalty check could give the table.',
    seoScenario2:
      'A check showing good can still be {trickster}; one showing evil can be {troublemaker}. Interpret the report alongside the roles enabled and the mission history.',
    generalTipsTitle: `General Tips:`,
    sowSeedsTitle: `Sow seeds of confusion:`,
    sowSeedsText: `Utilize your skill to keep players uncertain about mission outcomes, causing doubt and indecision within the ranks of good.`,
    collaborateTitle: `Collaborate with fellow evildoers:`,
    collaborateText: `Carefully consider the consequences of hiding a mission, and only do so when it benefits you and your allies.`,
    utilizePowerTitle: `Utilize your power strategically:`,
    utilizePowerText: `Timing is crucial as you can only use your power once. When hiding a mission's result, a random non-witch player gets a loyalty check. Choose the moment that maximizes confusion while protecting your allies.`,
  },
  ru: {
    seoHeading: 'Ведьма в Авалоне: скрытая миссия и проверка',
    seoTeam: 'Зло. На платформе {witch} может применить особую способность один раз за игру.',
    seoAbility:
      'Ведьма может скрыть исход одной миссии. Случайный игрок, кроме самой Ведьмы, получает право проверить отображаемую лояльность выбранного игрока.',
    seoLimit:
      'Превращает ли Ведьма провал в успех? Нет: скрывается информация, а не меняется реальный исход. Случайно выбирают обладателя проверки, а не её цель.',
    seoScenario1:
      'Скрывайте миссию, когда отсутствие публичной информации полезно злу. Учитывайте, какие сведения столу может дать новая проверка.',
    seoScenario2:
      'Добрым по проверке может оказаться {trickster}, злым — {troublemaker}. Сопоставляйте объявленный результат с включёнными ролями и историей миссий.',
    generalTipsTitle: 'Общие советы:',
    sowSeedsTitle: 'Посейте семена сомнений:',
    sowSeedsText:
      'Используйте свои способности, чтобы оставлять игроков в неведении относительно результатов миссий, вызывая сомнения и нерешительность среди добрых сил.',
    collaborateTitle: 'Сотрудничайте с другими злодеями:',
    collaborateText:
      'Продумывайте последствия скрытия похода и делайте это только тогда, когда это выгодно вам и вашим союзникам.',
    utilizePowerTitle: 'Используйте свою силу стратегически:',
    utilizePowerText:
      'Время решает всё — вы можете использовать способность лишь раз. Скрывая результат миссии, вы провоцируете проверку лояльности у другого игрока. Выбирайте момент, который максимизирует хаос, защищая своих соратников.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆巫婆：隐藏任务结果与阵营查验',
    seoTeam: '坏人。本站{witch}每局只能使用一次特殊能力。',
    seoAbility: '巫婆可以隐藏一次任务的结果。随后，巫婆以外的一名随机玩家获得查验某位玩家显示阵营的权利。',
    seoLimit: '巫婆能把失败变成成功吗？不能，只隐藏信息，不改变实际结果。随机选中的是查验者，不是被查验的目标。',
    seoScenario1: '当缺少公开任务信息有利于坏人时，可以考虑隐藏，但要权衡新查验可能给全桌带来的信息。',
    seoScenario2: '查验为好人可能是{trickster}，为坏人可能是{troublemaker}。结合本局启用的角色和任务历史判断。',
    generalTipsTitle: '一般提示：',
    sowSeedsTitle: '播下困惑的种子：',
    sowSeedsText: '利用你的技能让玩家对任务结果产生不确定性，在善良力量的行列中引起怀疑和犹豫。',
    collaborateTitle: '与其他邪恶势力合作：',
    collaborateText: '隐藏任务前务必权衡后果，仅在对己方有利时使用此能力。',
    utilizePowerTitle: '战略性地使用你的能力：',
    utilizePowerText:
      '时机决定一切——你只能使用一次能力。隐藏任务结果时，会触发其他玩家的忠诚检验。选择最能制造混乱并保护盟友的时机。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆巫婆：隱藏任務結果與陣營查驗',
    seoTeam: '壞人。本站{witch}每局只能使用一次特殊能力。',
    seoAbility: '巫婆可以隱藏一次任務的結果。隨後，巫婆以外的一名隨機玩家獲得查驗某位玩家顯示陣營的權利。',
    seoLimit: '巫婆能把失敗變成成功嗎？不能，只隱藏資訊，不改變實際結果。隨機選中的是查驗者，不是被查驗的目標。',
    seoScenario1: '當缺少公開任務資訊有利於壞人時，可以考慮隱藏，但要權衡新查驗可能給全桌帶來的資訊。',
    seoScenario2: '查驗為好人可能是{trickster}，為壞人可能是{troublemaker}。結合本局啟用的角色和任務歷史判斷。',
    generalTipsTitle: '一般提示：',
    sowSeedsTitle: '播下混亂的種子：',
    sowSeedsText: '利用你的技能使玩家對任務結果感到不確定，在善良力量的行列中造成懷疑和猶豫。',
    collaborateTitle: '與其他邪惡的人合作：',
    collaborateText: '隱藏任務前務必權衡後果，僅在對己方有利時使用此能力。',
    utilizePowerTitle: '戰略性地運用你的力量：',
    utilizePowerText:
      '時機決定一切——你只能使用一次能力。隱藏任務結果時，會觸發其他玩家的忠誠檢驗。選擇最能製造混亂並保護盟友的時機。',
  },
  es: {
    seoHeading: 'Bruja en Avalon: misión oculta y comprobación',
    seoTeam: 'Mal. {witch} puede usar su habilidad especial una vez por partida en esta plataforma.',
    seoAbility:
      'La Bruja puede ocultar el resultado de una misión. Un jugador aleatorio distinto de la Bruja recibe el derecho a comprobar la lealtad mostrada de un jugador.',
    seoLimit:
      '¿Convierte Fracaso en Éxito? No: oculta información sin cambiar el resultado real. Se elige al azar a quien comprueba, no al objetivo de la comprobación.',
    seoScenario1:
      'Oculta una misión si perder esa información pública beneficia al mal, pero considera lo que la nueva comprobación puede revelar.',
    seoScenario2:
      'Una comprobación buena puede corresponder a {trickster}; una mala, a {troublemaker}. Interpreta el resultado junto con los roles habilitados y las misiones.',
    generalTipsTitle: 'Consejos Generales:',
    sowSeedsTitle: 'Siembra semillas de confusión:',
    sowSeedsText:
      'Utiliza tu habilidad para mantener a los jugadores inciertos sobre los resultados de las misiones, causando dudas e indecisión dentro de las filas del bien.',
    collaborateTitle: 'Colabora con otros malvados:',
    collaborateText:
      'Evalúa cuidadosamente las consecuencias de ocultar una misión, y hazlo solo cuando beneficie a ti y a tus aliados.',
    utilizePowerTitle: 'Utiliza tu poder estratégicamente:',
    utilizePowerText:
      'El momento lo es todo — solo puedes usar tu habilidad una vez. Al ocultar un resultado, provocas una verificación en otro jugador. Elige el momento que maximice el caos protegiendo a tus aliados.',
  },
};
