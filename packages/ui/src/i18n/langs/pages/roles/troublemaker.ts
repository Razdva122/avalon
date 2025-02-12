import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const troublemaker: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformation: 'General Information: ',
    intro:
      'As a {troublemaker}, you play a crucial balancing act. You must present yourself as a straightforward good member, yet when your loyalty is tested and revealed falsely due to your unique role, you need to skillfully manage the situation. Your challenge is to maintain the trust of your team despite the deceitful evidence while blocking any evil members attempting to impersonate your role.',
    generalTips: 'General Tips:',
    strategicTips: 'Strategic Tips:',
    generalTipsRevealTitle: 'Reveal strategically',
    generalTipsRevealDesc:
      'If your false alignment is exposed or likely to be questioned, calmly reveal your true role as the {troublemaker} to maintain trust within your team.',
    generalTipsCounteractTitle: 'Counteract evil impersonations',
    generalTipsCounteractDesc:
      'Should an evil player claim to be the {troublemaker}, quickly challenge their statement and clarify the situation to prevent confusion.',
    strategicTipsMonitorTitle: 'Monitor loyalty tests',
    strategicTipsMonitorDesc:
      'Keep an eye on situations where loyalty checks are performed and be ready to intervene if results could be misleading due to someone impersonating you.',
    strategicTipsControlTitle: 'Control the narrative',
    strategicTipsControlDesc:
      'If revealed, steer the conversation towards understanding the strategic advantages of your role, explaining how having an undisclosed {troublemaker} can benefit the good side.',
    strategicTipsAlliancesTitle: 'Form clear alliances',
    strategicTipsAlliancesDesc:
      'Build strong relationships with trustworthy and influential players. Having allies can help validate your claims if your role comes into question.',
    strategicTipsAdaptTitle: 'Adapt to suspicion',
    strategicTipsAdaptDesc:
      "If suspicion arises, address it directly with logical explanations and reaffirm your actions' alignment with team goals to dispel doubts.",
    conclusion:
      'Playing as the {troublemaker} requires a fine blend of secrecy and forthrightness. You need to navigate through the game by keeping your vital role discreet until the critical moment, then revealing it to maintain trust and thwart evil strategies. Such strategic revelations can shift game dynamics profoundly, ensuring the good side continues to benefit from your hidden yet indispensable contribution.',
  },
  ru: {
    generalInformation: 'Общая информация: ',
    intro:
      'В качестве {troublemaker} вам необходимо балансировать на грани. Вы должны представлять себя как простого добросовестного участника, но когда ваша лояльность проверяется и оказывается ложной из-за вашей уникальной роли, вы должны умело справляться с ситуацией. Ваша задача — сохранить доверие вашей команды, несмотря на обманчивые доказательства, блокируя при этом любые злые попытки других игроков выдать себя за вашу роль.',
    generalTips: 'Общие советы:',
    strategicTips: 'Стратегические советы:',
    generalTipsRevealTitle: 'Раскрывайте стратегически',
    generalTipsRevealDesc:
      'Если ваше ложное стремление к добру раскрыто или может быть подвергнуто сомнению, спокойно раскройте свою истинную роль как {troublemaker}, чтобы сохранить доверие вашей команды.',
    generalTipsCounteractTitle: 'Противодействуйте злым выкрутасам',
    generalTipsCounteractDesc:
      'Если злой игрок заявляет, что он {troublemaker}, быстро оспаривайте его заявление и проясняйте ситуацию, чтобы предотвратить путаницу.',
    strategicTipsMonitorTitle: 'Следите за проверками лояльности',
    strategicTipsMonitorDesc:
      'Будьте внимательны в ситуациях, когда проводятся проверки лояльности, и будьте готовы вмешаться, если результаты могут ввести в заблуждение из-за чьих-либо попыток выдать себя за вас.',
    strategicTipsControlTitle: 'Контролируйте повествование',
    strategicTipsControlDesc:
      'Если ваша роль раскрыта, направляйте разговор на понимание стратегических преимуществ вашей роли, объясняя, как скрытый {troublemaker} может принести пользу доброй стороне.',
    strategicTipsAlliancesTitle: 'Устанавливайте ясные альянсы',
    strategicTipsAlliancesDesc:
      'Стройте крепкие отношения с достойными доверия и влиятельными игроками. Иметь союзников может помочь подтвердить ваши заявления, если ваша роль будет подвергнута сомнению.',
    strategicTipsAdaptTitle: 'Адаптируйтесь к подозрениям',
    strategicTipsAdaptDesc:
      'Если возникают подозрения, решите это напрямую с логическими объяснениями и подчеркивайте, насколько ваши действия соответствуют целям команды, чтобы рассеять сомнения.',
    conclusion:
      'Играя за {troublemaker}, требуется тонкая смесь секретности и уверенности. Вы должны вести игру, храня свою жизненно важную роль в тайне до критического момента, а затем раскрывать её, чтобы сохранить доверие и сорвать злые стратегии. Такие стратегические раскрытия могут значительно изменить динамику игры, гарантируя, что добрая сторона продолжает получать выгоду от вашего скрытого, но незаменимого вклада.',
  },
  'zh-CN': {
    generalInformation: '一般信息：',
    intro:
      '作为一个{troublemaker}，您玩的是一个重要的平衡游戏。您必须表现得像一个简单而优秀的成员，但当您的忠诚被测试并因您独特的角色而错误揭示时，您需要巧妙地管理局势。您的挑战是保持团队的信任，尽管有欺骗性证据，并阻止任何试图冒充您角色的邪恶成员。',
    generalTips: '一般提示：',
    strategicTips: '战略提示：',
    generalTipsRevealTitle: '战略性揭示',
    generalTipsRevealDesc:
      '如果您的虚假对善的对立被揭露或可能受到质疑，请冷静地揭示您作为{troublemaker}的真实角色，以保持团队的信任。',
    generalTipsCounteractTitle: '对抗邪恶的冒充',
    generalTipsCounteractDesc: '如果一个邪恶玩家声称自己是{troublemaker}，请迅速挑战他们的声明并澄清情况，以防止混淆。',
    strategicTipsMonitorTitle: '监控忠诚度测试',
    strategicTipsMonitorDesc: '密切关注进行忠诚度检测的情况，并准备在由于有人冒充您而可能产生误导性结果时进行干预。',
    strategicTipsControlTitle: '控制叙述',
    strategicTipsControlDesc:
      '如果揭示出来，请引导谈话了解您角色的战略优势，说明隐藏的{troublemaker}如何可以为善的一方带来好处。',
    strategicTipsAlliancesTitle: '形成明确的联盟',
    strategicTipsAlliancesDesc:
      '与可信赖和有影响力的玩家建立牢固的关系。在您的角色受到质疑时，盟友可以帮助验证您的声明。',
    strategicTipsAdaptTitle: '适应怀疑',
    strategicTipsAdaptDesc: '如果出现怀疑，请以逻辑解释直接解决问题，并重申您的行为与团队目标的一致性以消除疑虑。',
    conclusion:
      '作为{troublemaker}游戏需要精妙地结合秘密与直率。您需要通过保留您的重要角色机密直到关键时刻来进行游戏，然后揭示它以保持信任并挫败邪恶策略。这种战略性揭示可以深刻地改变游戏动态，确保善良的一方继续从您隐藏但重要的贡献中受益。',
  },
  'zh-TW': {
    generalInformation: '一般信息：',
    intro:
      '作為一個{troublemaker}，您玩的是一個重要的平衡遊戲。您必須表現得像一個簡單而優秀的成員，但當您的忠誠被測試並因您獨特的角色而錯誤揭露時，您需要巧妙地管理局勢。您的挑戰是保持團隊的信任，儘管有欺騙性證據，並阻止任何試圖冒充您角色的邪惡成員。',
    generalTips: '一般提示：',
    strategicTips: '戰略提示：',
    generalTipsRevealTitle: '戰略性揭示',
    generalTipsRevealDesc:
      '如果您的虛假對善的對立被揭露或可能受到質疑，請冷靜地揭示您作為{troublemaker}的真實角色，以保持團隊的信任。',
    generalTipsCounteractTitle: '對抗邪惡的冒充',
    generalTipsCounteractDesc: '如果一個邪惡玩家聲稱自己是{troublemaker}，請迅速挑戰他們的聲明並澄清情況，以防止混淆。',
    strategicTipsMonitorTitle: '監控忠誠度測試',
    strategicTipsMonitorDesc: '密切關注進行忠誠度檢測的情況，並準備在由於有人冒充您而可能產生誤導性結果時進行干預。',
    strategicTipsControlTitle: '控制敘述',
    strategicTipsControlDesc:
      '如果揭示出來，請引導談話了解您角色的戰略優勢，說明隱藏的{troublemaker}如何可以為善的一方帶來好處。',
    strategicTipsAlliancesTitle: '形成明確的聯盟',
    strategicTipsAlliancesDesc:
      '與可信賴和有影響力的玩家建立牢固的關係。在您的角色受到質疑時，盟友可以幫助驗證您的聲明。',
    strategicTipsAdaptTitle: '適應懷疑',
    strategicTipsAdaptDesc: '如果出現懷疑，請以邏輯解釋直接解決問題，並重申您的行為與團隊目標的一致性以消除疑慮。',
    conclusion:
      '作為{troublemaker}遊戲需要精妙地結合秘密與直率。您需要通過保留您的重要角色機密直到關鍵時刻來進行遊戲，然後揭示它以保持信任並挫敗邪惡策略。這種戰略性揭示可以深刻地改變遊戲動態，確保善良的一方繼續從您隱藏但重要的貢獻中受益。',
  },
  es: {
    generalInformation: 'Información general:',
    intro:
      'Como un {troublemaker}, juegas un papel crucial de equilibrio. Debes presentarte como un miembro honesto, pero cuando tu lealtad es puesta a prueba y se revela falsamente debido a tu rol único, necesitas administrar la situación hábilmente. Tu desafío es mantener la confianza de tu equipo a pesar de la evidencia engañosa mientras bloqueas a cualquier miembro maligno que intente hacerse pasar por tu rol.',
    generalTips: 'Consejos Generales:',
    strategicTips: 'Consejos Estratégicos:',
    generalTipsRevealTitle: 'Revela estratégicamente',
    generalTipsRevealDesc:
      'Si se expone tu alineación falsa o es probable que se cuestione, revela calmadamente tu verdadero rol como el {troublemaker} para mantener la confianza dentro de tu equipo.',
    generalTipsCounteractTitle: 'Contrarresta las personificaciones malignas',
    generalTipsCounteractDesc:
      'Si un jugador maligno afirma ser el {troublemaker}, desafía rápidamente su declaración y aclara la situación para evitar confusiones.',
    strategicTipsMonitorTitle: 'Monitorea las pruebas de lealtad',
    strategicTipsMonitorDesc:
      'Vigila las situaciones donde se realizan pruebas de lealtad y prepárate para intervenir si los resultados pueden ser engañosos debido a alguien que se hace pasar por ti.',
    strategicTipsControlTitle: 'Controla la narrativa',
    strategicTipsControlDesc:
      'Si te revelan, dirige la conversación hacia la comprensión de las ventajas estratégicas de tu rol, explicando cómo tener un {troublemaker} no revelado puede beneficiar al lado bueno.',
    strategicTipsAlliancesTitle: 'Forma alianzas claras',
    strategicTipsAlliancesDesc:
      'Construye relaciones fuertes con jugadores confiables e influyentes. Tener aliados puede ayudar a validar tus afirmaciones si tu rol es cuestionado.',
    strategicTipsAdaptTitle: 'Adáptate a la sospecha',
    strategicTipsAdaptDesc:
      'Si surge sospecha, abórdala directamente con explicaciones lógicas y reafirma que tus acciones están alineadas con los objetivos del equipo para disipar las dudas.',
    conclusion:
      'Jugar como el {troublemaker} requiere una fina mezcla de secreto y sinceridad. Necesitas navegar a lo largo del juego manteniendo tu rol vital discreto hasta el momento crítico, luego revelarlo para mantener la confianza y frustrar las estrategias malignas. Tales revelaciones estratégicas pueden cambiar profundamente la dinámica del juego, asegurando que el lado bueno siga beneficiándose de tu contribución oculta pero indispensable.',
  },
};
