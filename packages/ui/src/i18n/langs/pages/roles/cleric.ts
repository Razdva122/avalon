import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const cleric: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Cleric in Avalon: Loyalty Check & Assassination',
    seoTeam: 'Good. This platform role has a special assassination condition.',
    seoAbility:
      'After mission 1, {cleric} learns the displayed loyalty of that mission’s leader. If the Cleric is the leader, no new information is received.',
    seoLimit:
      'Does the check reveal an exact role? No. {trickster} appears good and {troublemaker} appears evil. To assassinate the Cleric here, evil must also correctly guess another eligible good role present in the game.',
    seoScenario1:
      'If the first leader appears good, consider whether Trickster is enabled before treating that player as confirmed good.',
    seoScenario2:
      'If you lead mission 1 yourself, you do not get to choose a different player to check. Build your reads from votes and mission results.',
    generalTipsHeader: 'General Tips:',
    generalTipsRoleUnderstandingHeading: 'Clear Understanding of the Role:',
    generalTipsRoleUnderstandingText:
      "Remember that your main task is to support the forces of light by gathering information about the opponents' loyalties and confirming the friendly intentions of your allies.",
    generalTipsLoyaltyCautionHeading: 'Caution in Revealing Loyalty:',
    generalTipsLoyaltyCautionText:
      "Use the information about the leader's loyalty from the first expedition, but do not rush into making public statements or accusations, as this might attract unwanted attention from the forces of darkness.",
    generalTipsStealthHeading: 'Stealth until Critical Moments:',
    generalTipsStealthText:
      'Play covertly and carefully. Reveal your role only in situations where it will help prevent a loss or save the team from a dangerous move by the opponents.',
  },
  ru: {
    seoHeading: 'Клирик в Авалоне: проверка лидера и убийство',
    seoTeam: 'Добро. На платформе для убийства Клирика действует особое условие.',
    seoAbility:
      'После первой миссии {cleric} узнаёт отображаемую лояльность её лидера. Если лидером был сам Клирик, новой информации он не получает.',
    seoLimit:
      'Проверка показывает точную роль? Нет. {trickster} выглядит добрым, а {troublemaker} — злым. Для убийства Клирика зло должно также угадать ещё одну допустимую добрую роль, присутствующую в партии.',
    seoScenario1:
      'Если первый лидер оказался добрым по проверке, учтите возможность Трикстера, прежде чем считать этого игрока подтверждённым союзником.',
    seoScenario2:
      'Если первую миссию возглавили вы сами, выбрать другого игрока для проверки нельзя. Стройте выводы по голосованиям и результатам миссий.',
    generalTipsHeader: 'Общие советы:',
    generalTipsRoleUnderstandingHeading: 'Четкое понимание роли:',
    generalTipsRoleUnderstandingText:
      'Помните, что ваша главная задача – поддерживать силы света, собирая информацию о лояльности противников и подтверждая доброжелательные намерения союзников.',
    generalTipsLoyaltyCautionHeading: 'Осторожность в выявлении лояльности:',
    generalTipsLoyaltyCautionText:
      'Используйте полученные данные о лояльности лидера первого похода, но не спешите делать публичные заявления или обвинения, так как это может привлечь нежелательное внимание со стороны сил тьмы.',
    generalTipsStealthHeading: 'Скрытность до критических моментов:',
    generalTipsStealthText:
      'Ведите игру тайно и аккуратно. Раскрывать свою роль следует только в тех случаях, когда это поможет предотвратить проигрыш или спасти команду от опасного хода противника.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆牧师：首任任务队长查验与刺杀',
    seoTeam: '好人。本站牧师角色有特殊的刺杀条件。',
    seoAbility: '第1次任务后，{cleric}得知该任务队长的显示阵营。如果牧师自己是队长，就不会获得新信息。',
    seoLimit:
      '查验会显示具体角色吗？不会。{trickster}显示为好人，{troublemaker}显示为坏人。在本站刺杀牧师，还需猜中本局另一种符合条件的好人角色。',
    seoScenario1: '如果首任任务队长显示为好人，在把对方当成确定的好人前，先考虑本局是否有骗子。',
    seoScenario2: '如果你自己带领第1次任务，不能改查另一名玩家。要根据投票和任务结果推理。',
    generalTipsHeader: '一般提示：',
    generalTipsRoleUnderstandingHeading: '对角色的清晰理解:',
    generalTipsRoleUnderstandingText:
      '请记住,你的主要任务是支持光明势力,通过收集对手忠诚度的信息并确认盟友的友好意图。',
    generalTipsLoyaltyCautionHeading: '揭露忠诚度时的谨慎:',
    generalTipsLoyaltyCautionText:
      '利用首次探险中获得的领袖忠诚度信息,但切勿急于公开发表声明或指责,因为这可能会引来黑暗势力的不必要关注。',
    generalTipsStealthHeading: '在关键时刻前保持隐秘:',
    generalTipsStealthText:
      '请以谨慎且低调的方式行事。只有在能防止失利或拯救团队免受对手危险行动时,才揭露你的角色身份。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆牧師：首任任務隊長查驗與刺殺',
    seoTeam: '好人。本站牧師角色有特殊的刺殺條件。',
    seoAbility: '第1次任務後，{cleric}得知該任務隊長的顯示陣營。如果牧師自己是隊長，就不會獲得新資訊。',
    seoLimit:
      '查驗會顯示具體角色嗎？不會。{trickster}顯示為好人，{troublemaker}顯示為壞人。在本站刺殺牧師，還需猜中本局另一種符合條件的好人角色。',
    seoScenario1: '如果首任任務隊長顯示為好人，在把對方當成確定的好人前，先考慮本局是否有騙子。',
    seoScenario2: '如果你自己帶領第1次任務，不能改查另一名玩家。要根據投票和任務結果推理。',
    generalTipsHeader: '一般提示：',
    generalTipsRoleUnderstandingHeading: '對角色的清晰理解:',
    generalTipsRoleUnderstandingText:
      '請記住,你的主要任務是支持光明勢力,透過收集對手忠誠度的資訊並確認盟友的友好意圖。',
    generalTipsLoyaltyCautionHeading: '揭露忠誠度時的謹慎:',
    generalTipsLoyaltyCautionText:
      '利用首次探險中獲得的領袖忠誠度資訊,但切勿急於公開發表聲明或指責,因為這可能會引來黑暗勢力的不必要關注。',
    generalTipsStealthHeading: '在關鍵時刻前保持隱秘:',
    generalTipsStealthText:
      '請以謹慎且低調的方式行事。只有在能防止失利或拯救團隊免受對手危險行動時,才揭露你的角色身份。',
  },
  es: {
    seoHeading: 'Clérigo en Avalon: lealtad y asesinato',
    seoTeam: 'Bien. Este rol de la plataforma tiene una condición especial de asesinato.',
    seoAbility:
      'Tras la misión 1, {cleric} conoce la lealtad mostrada de su líder. Si el propio Clérigo era el líder, no recibe información nueva.',
    seoLimit:
      '¿La comprobación revela el rol? No. {trickster} parece bueno y {troublemaker} parece malo. Para asesinar al Clérigo aquí, el mal también debe adivinar otro rol bueno válido presente en la partida.',
    seoScenario1:
      'Si el primer líder parece bueno, considera si el Tramposo está incluido antes de dar su lealtad por confirmada.',
    seoScenario2:
      'Si diriges la primera misión, no puedes elegir a otra persona para comprobarla. Usa votos y resultados para deducir las lealtades.',
    generalTipsHeader: 'Consejos Generales:',
    generalTipsRoleUnderstandingHeading: 'Entendimiento Claro del Rol:',
    generalTipsRoleUnderstandingText:
      'Recuerda que tu tarea principal es apoyar a las fuerzas de la luz recopilando información sobre la lealtad de los oponentes y comprobando las intenciones amistosas de tus aliados.',
    generalTipsLoyaltyCautionHeading: 'Precaución al Revelar la Lealtad:',
    generalTipsLoyaltyCautionText:
      'Utiliza la información sobre la lealtad del líder de la primera expedición, pero no te precipites a hacer declaraciones públicas o acusaciones, ya que esto podría atraer una atención no deseada de las fuerzas de la oscuridad.',
    generalTipsStealthHeading: 'Sigilo hasta Momentos Críticos:',
    generalTipsStealthText:
      'Actúa de manera encubierta y cuidadosa. Revela tu rol solo en situaciones en las que ayude a prevenir una derrota o a salvar al equipo de un movimiento peligroso por parte de los oponentes.',
  },
  pt: {
    seoHeading: 'Clérigo em Avalon: lealdade e assassinato',
    seoTeam: 'Bem. Este papel da plataforma tem uma condição especial de assassinato.',
    seoAbility:
      'Após a missão 1, {cleric} descobre a lealdade exibida de seu líder. Se o próprio Clérigo era o líder, não recebe informação nova.',
    seoLimit:
      'A verificação revela o papel exato? Não. {trickster} parece bom e {troublemaker} parece mau. Para assassinar o Clérigo aqui, o mal também precisa acertar outro papel bom elegível presente na partida.',
    seoScenario1:
      'Se o primeiro líder parecer bom, considere se o Trapaceiro está habilitado antes de tratá-lo como aliado confirmado.',
    seoScenario2:
      'Se você liderar a primeira missão, não poderá escolher outra pessoa para verificar. Use votos e resultados para formar suas deduções.',
    generalTipsHeader: 'Dicas Gerais:',
    generalTipsRoleUnderstandingHeading: 'Entendimento Claro do Papel:',
    generalTipsRoleUnderstandingText:
      'Lembre-se que sua principal tarefa é apoiar as forças da luz, coletando informações sobre as lealdades dos oponentes e confirmando as intenções amigáveis de seus aliados.',
    generalTipsLoyaltyCautionHeading: 'Cautela ao Revelar Lealdade:',
    generalTipsLoyaltyCautionText:
      'Use as informações sobre a lealdade do líder da primeira expedição, mas não se apresse em fazer declarações públicas ou acusações, pois isso pode atrair atenção indesejada das forças das trevas.',
    generalTipsStealthHeading: 'Sigilo até Momentos Críticos:',
    generalTipsStealthText:
      'Jogue de forma encoberta e cuidadosa. Revele seu papel apenas em situações onde isso ajudará a prevenir uma derrota ou salvar a equipe de um movimento perigoso dos oponentes.',
  },
};
