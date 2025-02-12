import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const cleric: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    informationHeader: 'General Information:',
    generalInformation:
      '{cleric} is a key figure in the ranks of the forces of light, helping to uncover the true intentions of the players. After the first expedition, {cleric} receives a unique opportunity – to learn the loyalty of the leader of that expedition. However, if {cleric} turns out to be the leader himself, no information is provided. Unlike {merlin}, when attempting to eliminate the cleric, the forces of darkness must guess the role of another civilian. This role requires a cautious and well-thought-out approach: in critical situations, revealing the role may be justified if it manages to mislead the opponents and maintain balance within the team.',

    generalTipsHeader: 'General Tips:',
    generalTipsRoleUnderstandingHeading: 'Clear Understanding of the Role:',
    generalTipsRoleUnderstandingText:
      "Remember that your main task is to support the forces of light by gathering information about the opponents' loyalties and confirming the friendly intentions of your allies.",

    generalTipsLoyaltyCautionHeading: 'Caution in Revealing Loyalty:',
    generalTipsLoyaltyCautionText:
      'Use the information about the leader’s loyalty from the first expedition, but do not rush into making public statements or accusations, as this might attract unwanted attention from the forces of darkness.',

    generalTipsStealthHeading: 'Stealth until Critical Moments:',
    generalTipsStealthText:
      'Play covertly and carefully. Reveal your role only in situations where it will help prevent a loss or save the team from a dangerous move by the opponents.',

    strategicTipsHeader: 'Strategic Tips:',
    informationSafetyHeading: 'Balance between Information and Safety:',
    informationSafetyText:
      'Use your knowledge of the leader’s loyalty from the first expedition to build trust among the players, but do not reveal all your information at once. Your goal is to retain the ability to influence the game while remaining undetected.',

    tacticalRevealHeading: 'Tactical Role Reveal:',
    tacticalRevealText:
      'In critical situations when the stakes are high, it may be advantageous to reveal your role to confuse the forces of darkness. However, evaluate the risk carefully: if the opponents guess the role of the second civilian, it might favor the forces of darkness.',

    actionCommunicationHeading: 'Communication through Actions:',
    actionCommunicationText:
      'Actively participate in discussions and votes, quietly steering the game in the right direction, but avoid overt hints of your revealed information. Your task is to convince the forces of light that your actions are aimed at the common good.',

    conclusion:
      '{cleric} is not just an informer, but a strategist balancing between revealing and concealing information. Play smartly, watch the players carefully, and use all available insights to keep the forces of light intact until the very end.',
  },
  ru: {
    informationHeader: 'Общая информация:',
    generalInformation:
      '{cleric} является ключевой фигурой в рядах сил света, способствуя выявлению истинных намерений игроков. После первого похода {cleric} получает уникальную возможность – узнать лояльность лидера этого похода. Однако, если он сам окажется лидером, информации ему не поступает. В отличии от {merlin}, при попытке устранить клирика команда сил тьмы должна будет угадать роль ещё одного мирного игрока. Его роль требует осторожной и продуманной игры: в критических ситуациях раскрытие роли может оказаться оправданным, если таким образом удастся ввести в заблуждение противников и сохранить баланс в команде.',

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

    strategicTipsHeader: 'Стратегические советы:',
    informationSafetyHeading: 'Баланс между информацией и безопасностью:',
    informationSafetyText:
      'Используйте знание о лояльности лидера первого похода для установления доверия между игроками, но не выдавайте всю свою информацию сразу. Ваша цель – сохранить возможность влиять на игру, оставаясь незамеченным.',

    tacticalRevealHeading: 'Тактическое раскрытие роли:',
    tacticalRevealText:
      'В критических ситуациях, когда ставки высоки, может оказаться выгодным раскрыть свою роль, чтобы запутать силы тьмы. Однако тщательно оценивайте риск: если противники угадают роль второго мирного игрока, это может сыграть на руку команде сил тьмы.',

    actionCommunicationHeading: 'Коммуникация через действия:',
    actionCommunicationText:
      'Активно участвуйте в обсуждениях и голосованиях, тихо направляя игру в нужное русло, но избегайте явных намеков на свою раскрытую информацию. Ваша задача – убедить команду сил света в том, что ваши действия направлены на общее благо.',

    conclusion:
      '{cleric} – это не просто информатор, а стратег, балансирующий между раскрытием и сокрытием информации. Играйте умело, следите за поведением игроков и используйте все данные, чтобы сохранить силы света до самого конца.',
  },
  'zh-CN': {
    informationHeader: '一般信息：',
    generalInformation:
      '{cleric} 是光明势力中的关键人物,有助于揭示玩家真实的意图。在首次探险后,{cleric} 获得了一个独特的机会——了解那次探险领袖的忠诚度。然而,如果 {cleric} 自己成为领袖,则不会提供任何信息。与 {merlin} 不同,在试图消灭该牧师时,黑暗势力必须猜出另一位平民的角色。这个角色需要谨慎且周密的策略:在关键时刻,若能误导对手并维持团队平衡,揭露身份便可能是合理的。',

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

    strategicTipsHeader: '战略提示：',
    informationSafetyHeading: '信息与安全之间的平衡:',
    informationSafetyText:
      '运用你对首次探险中领袖忠诚度的了解来建立玩家间的信任,但不要一次性透露所有信息。你的目标是保留影响游戏的能力,同时保持隐蔽。',

    tacticalRevealHeading: '策略性角色揭露:',
    tacticalRevealText:
      '在赌注极高的关键时刻,揭露你的角色可能有助于混淆黑暗势力。不过,请仔细评估风险:如果对手猜出第二位平民的角色,可能会使局势对黑暗势力更为有利。',

    actionCommunicationHeading: '以行动传递信息:',
    actionCommunicationText:
      '积极参与讨论和投票,悄然将游戏引导到正确方向,但请避免过于明显地泄露你的身份信息。你的任务是让光明势力相信,你的行动是出于公共利益。',

    conclusion:
      '{cleric} 不仅仅是一位情报提供者,而是一位在揭露与隐藏信息之间取得平衡的策略家。请聪明地游戏,仔细观察其他玩家,并利用所有可用的见解,直至最后都保持光明势力的完整。',
  },
  'zh-TW': {
    informationHeader: '一般信息：',
    generalInformation:
      '{cleric} 是光明勢力中的關鍵人物,協助揭露玩家的真實意圖。在首次探險後,{cleric} 獲得了一個獨特的機會——了解那次探險領袖的忠誠度。然而,如果 {cleric} 自己成為領袖,則不會提供任何資訊。與 {merlin} 不同,當試圖消滅該牧師時,黑暗勢力必須猜出另一位平民的角色。此角色需要謹慎且周密的策略:在關鍵時刻,若能誤導對手並維持團隊平衡,揭露身份便可能是合理的。',

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

    strategicTipsHeader: '戰略提示：',
    informationSafetyHeading: '資訊與安全之間的平衡:',
    informationSafetyText:
      '運用你對首次探險中領袖忠誠度的了解來建立玩家間的信任,但不要一次性透露所有資訊。你的目標是保留影響遊戲的能力,同時保持隱匿。',

    tacticalRevealHeading: '策略性角色揭露:',
    tacticalRevealText:
      '在賭注極高的關鍵時刻,揭露你的角色可能有助於混淆黑暗勢力。不過,請仔細評估風險:若對手猜出第二位平民的角色,可能便會有利於黑暗勢力。',

    actionCommunicationHeading: '以行動傳遞訊息:',
    actionCommunicationText:
      '積極參與討論及投票,默默地將遊戲引導到正確方向,但請避免過於明顯地洩露你的身份資訊。你的任務是讓光明勢力相信,你的行動是為了整體利益。',

    conclusion:
      '{cleric} 不僅僅是一位情報提供者,而是一位在揭露與隱藏資訊間取得平衡的策略家。精明地遊玩、仔細觀察其他玩家,並運用所有可利用的見解,直至最後都保持光明勢力的完整。',
  },
  es: {
    informationHeader: 'Información General:',
    generalInformation:
      '{cleric} es una figura clave en las filas de las fuerzas de la luz, ayudando a descubrir las verdaderas intenciones de los jugadores. Tras la primera expedición, {cleric} recibe una oportunidad única: conocer la lealtad del líder de esa expedición. Sin embargo, si {cleric} resulta ser el propio líder, no se proporciona información. A diferencia de {merlin}, al intentar eliminar al clérigo, las fuerzas de la oscuridad deben adivinar el rol de otro civil. Este rol requiere un enfoque cauteloso y bien pensado: en situaciones críticas, revelar el rol puede estar justificado si logra engañar a los oponentes y mantener el equilibrio en el equipo.',

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

    strategicTipsHeader: 'Consejos Estratégicos:',
    informationSafetyHeading: 'Equilibrio entre Información y Seguridad:',
    informationSafetyText:
      'Utiliza el conocimiento sobre la lealtad del líder de la primera expedición para generar confianza entre los jugadores, pero no reveles toda tu información de inmediato. Tu objetivo es conservar la capacidad de influir en el juego mientras permaneces desapercibido.',

    tacticalRevealHeading: 'Revelación Táctica del Rol:',
    tacticalRevealText:
      'En situaciones críticas en las que la apuesta es alta, puede ser ventajoso revelar tu rol para confundir a las fuerzas de la oscuridad. Sin embargo, evalúa el riesgo con cuidado: si los oponentes adivinan el rol del segundo civil, esto podría favorecer a las fuerzas de la oscuridad.',

    actionCommunicationHeading: 'Comunicación a Través de Acciones:',
    actionCommunicationText:
      'Participa de forma activa en discusiones y votaciones, guiando silenciosamente el juego en la dirección correcta, pero evita dar pistas demasiado evidentes sobre tu información revelada. Tu tarea es convencer a las fuerzas de la luz de que tus acciones persiguen el bien común.',

    conclusion:
      '{cleric} no es solo un informante, sino un estratega que equilibra entre revelar y ocultar información. Juega de manera inteligente, observa cuidadosamente a los jugadores y utiliza todas las ideas disponibles para mantener a las fuerzas de la luz intactas hasta el final.',
  },
};
