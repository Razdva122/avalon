import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const guinevere: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    credits: "credits to: {'@'}Robrun",
    generalInformationTitle: 'General Information:',
    generalInformationText:
      "Taking on the role of {guinevere} requires a delicate approach: she knows both the {goodLancelot} and {evilLancelot} but does not know their current allegiance. Her objective is to aid the side of good discreetly, as like {merlin}, she may be killed at the game's end if identified by the forces of evil.",
    generalTipsTitle: 'General Tips:',
    cautiousKnowledgeTitle: 'Be cautious with your knowledge:',
    cautiousKnowledgeText:
      '{guinevere} must use her awareness to subtly guide her allies towards victory without revealing her role.',
    useHintsTitle: 'Use hints wisely:',
    useHintsText: 'The ability to give subtle hints to your team without being too overt is crucial for {guinevere}.',
    balanceGameplayTitle: 'Maintain balance in your gameplay:',
    balanceGameplayText:
      "Sometimes, it's important not to appear too knowledgeable. Deliberate mistakes or silence can misdirect the forces of evil.",
    strategicTipsTitle: 'Strategic Tips:',
    determineLancelotLoyaltyTitle: "Determine Lancelot's loyalty:",
    determineLancelotLoyaltyText:
      'Strive to figure out which {goodLancelot} is true to the cause of {goodLancelot} and which may have turned to {evilLancelot}. This knowledge can significantly impact your strategy.',
    strategizeSilenceTitle: 'Strategize with silence:',
    strategizeSilenceText:
      'Sometimes, the best way to conceal your role is to hold back comments, especially in the early stages of the game.',
    buildTrustTitle: 'Build trust:',
    buildTrustText:
      'Convincing other players of your allegiance to good is as vital as revealing evil. Trust can sway team decisions.',
    conclusionText:
      "Playing as {guinevere} is challenging but immensely rewarding. With thoughtful strategy and judicious communication, you can lead the forces of good to victory while evading detection by evil's assassin. Good luck!",
  },
  ru: {
    credits: "благодарности: {'@'}Robrun",
    generalInformationTitle: 'Общая информация:',
    generalInformationText:
      'Взять на себя роль {guinevere} требует деликатного подхода: она знает как {goodLancelot}, так и {evilLancelot}, но не знает их текущей преданности. Её цель — незаметно помогать доброй стороне, ведь, как {merlin}, её могут убить в конце игры, если силы зла её обнаружат.',
    generalTipsTitle: 'Общие советы:',
    cautiousKnowledgeTitle: 'Будьте осторожны со своими знаниями:',
    cautiousKnowledgeText:
      '{guinevere} должна использовать свою осведомлённость, чтобы незаметно направлять своих союзников к победе, не выдавая свою роль.',
    useHintsTitle: 'Используйте подсказки разумно:',
    useHintsText:
      'Способность давать команде тонкие подсказки, не будучи слишком откровенной, имеет решающее значение для {guinevere}.',
    balanceGameplayTitle: 'Соблюдайте баланс в игре:',
    balanceGameplayText:
      'Иногда важно не казаться слишком осведомлённым. Намеренные ошибки или молчание могут запутать силы зла.',
    strategicTipsTitle: 'Стратегические советы:',
    determineLancelotLoyaltyTitle: 'Определите преданность Ланселота:',
    determineLancelotLoyaltyText:
      'Старайтесь выяснить, какой {goodLancelot} действительно верен добру, а какой мог перейти на сторону {evilLancelot}. Эта информация может существенно повлиять на вашу стратегию.',
    strategizeSilenceTitle: 'Стратегия молчания:',
    strategizeSilenceText:
      'Иногда лучший способ скрыть свою роль — воздержаться от комментариев, особенно на ранних этапах игры.',
    buildTrustTitle: 'Зарабатывайте доверие:',
    buildTrustText:
      'Убеждение других игроков в вашей преданности добру столь же важно, как и разоблачение зла. Доверие может повлиять на решения команды.',
    conclusionText:
      'Игра за {guinevere} сложна, но чрезвычайно важна. С продуманной стратегией и разумной коммуникацией вы можете привести силы добра к победе, избегая обнаружения ассасином зла. Удачи!',
  },
  'zh-CN': {
    credits: "鸣谢:{'@'}Robrun",
    generalInformationTitle: '一般信息：',
    generalInformationText:
      '扮演{guinevere}需要细致的方式:她既认识{goodLancelot}也认识{evilLancelot},但不清楚他们当前的立场。她的目标是悄悄帮助正义的一方,因为像{merlin}一样,如果被邪恶势力识破,她可能会在游戏结束时被杀。',
    generalTipsTitle: '基本提示:',
    cautiousKnowledgeTitle: '谨慎对待你的知识:',
    cautiousKnowledgeText: '{guinevere}必须利用她的洞察力,巧妙地引导盟友走向胜利,同时不暴露自己的角色。',
    useHintsTitle: '巧妙使用提示:',
    useHintsText: '为团队提供细腻提示而不过于直白,对于{guinevere}来说至关重要。',
    balanceGameplayTitle: '保持游戏平衡:',
    balanceGameplayText: '有时候,看起来过于博学并不理想。有意的失误或沉默可能会引导邪恶势力走向错误方向。',
    strategicTipsTitle: '策略提示:',
    determineLancelotLoyaltyTitle: '确认兰斯洛特的忠诚:',
    determineLancelotLoyaltyText:
      '努力判断哪个{goodLancelot}真正忠于正义,哪个可能已经转向{evilLancelot}。这些信息能显著影响你的策略。',
    strategizeSilenceTitle: '以沉默制定策略:',
    strategizeSilenceText: '有时候,隐藏自己角色的最佳方法就是保持沉默,尤其是在游戏初期。',
    buildTrustTitle: '建立信任:',
    buildTrustText: '说服其他玩家相信你忠于正义和揭露邪恶同样重要。信任能够左右团队决策。',
    conclusionText:
      '扮演{guinevere}虽然充满挑战,但收获非凡。通过周密的策略和明智的沟通,你可以带领正义力量获得胜利,同时躲避邪恶刺客的追捕。祝你好运!',
  },
  'zh-TW': {
    credits: "鳴謝:{'@'}Robrun",
    generalInformationTitle: '一般資訊：',
    generalInformationText:
      '扮演{guinevere}需要細膩的方式:她既認識{goodLancelot}也認識{evilLancelot},但卻不清楚他們當前的立場。她的目標是悄悄地幫助正義的一方,因為像{merlin}一樣,如果被邪惡勢力識破,她可能會在遊戲結束時被殺。',
    generalTipsTitle: '基本提示:',
    cautiousKnowledgeTitle: '謹慎對待你的知識:',
    cautiousKnowledgeText: '{guinevere}必須運用她的覺察,巧妙地引導盟友邁向勝利,同時不暴露自己的身分。',
    useHintsTitle: '明智運用提示:',
    useHintsText: '在不過於明顯的情況下給予隊伍細微提示的能力對{guinevere}至關重要。',
    balanceGameplayTitle: '保持遊戲平衡:',
    balanceGameplayText: '有時候,看起來過於博識並不理想。有意的錯誤或沉默可能誤導邪惡勢力。',
    strategicTipsTitle: '策略提示:',
    determineLancelotLoyaltyTitle: '判定蘭斯洛特的忠誠度:',
    determineLancelotLoyaltyText:
      '努力分辨哪位{goodLancelot}真正站在正義的一邊,哪位可能已轉向{evilLancelot}。這些資訊能顯著影響你的策略。',
    strategizeSilenceTitle: '以沉默制定策略:',
    strategizeSilenceText: '有時候,隱藏角色的最佳方式就是保持沉默,尤其是在遊戲的早期階段。',
    buildTrustTitle: '建立信任:',
    buildTrustText: '說服其他玩家相信你效忠正義與曝光邪惡一樣重要。信任可以左右團隊決策。',
    conclusionText:
      '扮演{guinevere}充滿挑戰,但回報豐厚。透過周密的策略和明智的溝通,你可以帶領正義的力量獲得勝利,同時躲避邪惡刺客的追殺。祝你好運!',
  },
  es: {
    credits: "créditos a: {'@'}Robrun",
    generalInformationTitle: 'Información General:',
    generalInformationText:
      'Asumir el rol de {guinevere} requiere un enfoque delicado: ella conoce tanto al {goodLancelot} como al {evilLancelot} pero no conoce su lealtad actual. Su objetivo es ayudar discretamente al bando del bien, ya que, al igual que {merlin}, podría ser asesinada al final del juego si las fuerzas del mal la identifican.',
    generalTipsTitle: 'Consejos Generales:',
    cautiousKnowledgeTitle: 'Ten cuidado con tu conocimiento:',
    cautiousKnowledgeText:
      '{guinevere} debe utilizar su conocimiento para guiar sutilmente a sus aliados hacia la victoria sin revelar su rol.',
    useHintsTitle: 'Usa las pistas sabiamente:',
    useHintsText:
      'La capacidad de dar sugerencias sutiles a tu equipo sin ser demasiado evidente es crucial para {guinevere}.',
    balanceGameplayTitle: 'Mantén el equilibrio en tu juego:',
    balanceGameplayText:
      'A veces, es importante no parecer demasiado omnisciente. Errores deliberados o el silencio pueden desviar la atención de las fuerzas del mal.',
    strategicTipsTitle: 'Consejos Estratégicos:',
    determineLancelotLoyaltyTitle: 'Determina la lealtad de Lancelot:',
    determineLancelotLoyaltyText:
      'Esfuérzate por descubrir qué {goodLancelot} es realmente fiel a la causa del bien y cuál puede haber pasado al {evilLancelot}. Este conocimiento puede impactar significativamente tu estrategia.',
    strategizeSilenceTitle: 'Estrategiza con silencio:',
    strategizeSilenceText:
      'A veces, la mejor manera de ocultar tu rol es abstenerte de comentar, especialmente en las primeras etapas del juego.',
    buildTrustTitle: 'Construye confianza:',
    buildTrustText:
      'Convencer a otros jugadores de tu lealtad hacia el bien es tan vital como revelar el mal. La confianza puede influir en las decisiones del equipo.',
    conclusionText:
      'Jugar como {guinevere} es un desafío, pero inmensamente gratificante. Con una estrategia reflexiva y una comunicación juiciosa, puedes llevar las fuerzas del bien a la victoria mientras esquivas al asesino del mal. ¡Buena suerte!',
  },
};
