import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const minion: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Minion of Mordred in Avalon: Rules & Strategy',
    seoTeam: 'Evil. The ordinary {minion} is a Minion of Mordred, not the special Mordred role.',
    seoAbility:
      'At setup, a Minion knows the participating evil allies except {oberon} and {wraith}. They can choose Success or Fail when sent on a mission.',
    seoLimit:
      'Does Merlin see a Minion of Mordred? Yes. Being Mordred’s minion does not grant {mordred}’s protection from {merlin}. Playing Success does not turn a Minion good.',
    seoScenario1:
      'If another evil player joins your mission, consider that two Fails may expose multiple evil participants. Account for roles that are forced to fail.',
    seoScenario2:
      'A Success may help you gain trust for a later mission. It is a strategic choice, not proof of good allegiance.',
    strategicTipsTitle: 'Strategic Tips:',
    tipDiscreetCollaborationTitle: 'Discreet Collaboration:',
    tipDiscreetCollaborationText:
      'If another evil player joins your mission, consider that two Fails may expose multiple evil participants. Account for roles that are forced to fail.',
    tipDeceptionTitle: 'Deception:',
    tipDeceptionText:
      "Perfect the art of deception. Blending in as one of the 'Good' can help you influence their decisions and protect your identity.",
    tipPublicDemeanorTitle: 'Public Demeanor:',
    tipPublicDemeanorText:
      'Be mindful of your public actions and words. Try to avoid suspicion by not being too defensive or too aggressive.',
  },
  ru: {
    seoHeading: 'Миньон в Авалоне: приспешник Мордреда и его правила',
    seoTeam: 'Зло. Обычный {minion} — приспешник Мордреда, а не особая роль Мордред.',
    seoAbility:
      'На старте Миньон знает злых союзников, кроме ролей {oberon} и {wraith}. В миссии он может выбрать успех или провал.',
    seoLimit:
      'Видит ли Мерлин приспешника Мордреда? Да. Название не даёт защиты роли {mordred} от роли {merlin}. Выбор успеха не превращает Миньона в доброго.',
    seoScenario1:
      'Если в миссии есть другой злой, учтите: два провала могут выдать нескольких злых участников. Помните о ролях с обязательным провалом.',
    seoScenario2:
      'Успех может помочь заслужить доверие для следующего похода. Это тактический выбор, а не доказательство доброй стороны.',
    strategicTipsTitle: 'Стратегические советы:',
    tipDiscreetCollaborationTitle: 'Деликатное сотрудничество:',
    tipDiscreetCollaborationText:
      'Если в миссии есть другой злой, учтите: два провала могут выдать нескольких злых участников. Помните о ролях с обязательным провалом.',
    tipDeceptionTitle: 'Обман:',
    tipDeceptionText:
      'Отточите искусство обмана. Притворившись членом «Добрых», вы сможете влиять на их решения и скрывать свою истинную личность.',
    tipPublicDemeanorTitle: 'Публичное поведение:',
    tipPublicDemeanorText:
      'Следите за своими публичными действиями и речью. Старайтесь не вызывать подозрений, не будучи слишком оборонительным или агрессивным.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆士兵：莫德雷德爪牙的规则与策略',
    seoTeam: '坏人。普通{minion}是莫德雷德的爪牙，不是莫德雷德这个特殊角色。',
    seoAbility: '开局认识坏人队友，但不包括{oberon}和{wraith}。参加任务时可选择成功或失败。',
    seoLimit:
      '梅林能看到莫德雷德的爪牙吗？能。这个称呼不会赋予{mordred}躲过{merlin}的能力。出成功也不会让士兵变成好人。',
    seoScenario1: '队伍里有另一名坏人时，两张失败牌可能暴露多名坏人。要考虑是否有强制出失败的角色。',
    seoScenario2: '出成功可以为后续任务争取信任。这是策略选择，不是好人身份的证明。',
    strategicTipsTitle: '策略提示:',
    tipDiscreetCollaborationTitle: '谨慎合作:',
    tipDiscreetCollaborationText: '队伍里有另一名坏人时，两张失败牌可能暴露多名坏人。要考虑是否有强制出失败的角色。',
    tipDeceptionTitle: '欺骗:',
    tipDeceptionText: '精通欺骗的艺术。伪装成"正义"一员可以帮助你影响对方决策并保护你的身份。',
    tipPublicDemeanorTitle: '公共形象:',
    tipPublicDemeanorText: '注意你的公开言行。尽量避免过分防备或过于激进,以免引起他人怀疑。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆士兵：莫德雷德爪牙的規則與策略',
    seoTeam: '壞人。普通{minion}是莫德雷德的爪牙，不是莫德雷德這個特殊角色。',
    seoAbility: '開局認識壞人隊友，但不包括{oberon}和{wraith}。參加任務時可選擇成功或失敗。',
    seoLimit:
      '梅林能看到莫德雷德的爪牙嗎？能。這個稱呼不會賦予{mordred}躲過{merlin}的能力。出成功也不會讓士兵變成好人。',
    seoScenario1: '隊伍裡有另一名壞人時，兩張失敗牌可能暴露多名壞人。要考慮是否有強制出失敗的角色。',
    seoScenario2: '出成功可以為後續任務爭取信任。這是策略選擇，不是好人身分的證明。',
    strategicTipsTitle: '策略提示:',
    tipDiscreetCollaborationTitle: '謹慎合作:',
    tipDiscreetCollaborationText: '隊伍裡有另一名壞人時，兩張失敗牌可能暴露多名壞人。要考慮是否有強制出失敗的角色。',
    tipDeceptionTitle: '欺騙:',
    tipDeceptionText: '精通欺騙的藝術。假扮成"正義"一員能幫助你影響他們的決策並保護你的身份。',
    tipPublicDemeanorTitle: '公開形象:',
    tipPublicDemeanorText: '注意你的公開言行。避免過分防備或過於激進,以免引起他人懷疑。',
  },
  es: {
    seoHeading: 'Secuaz de Mordred en Avalon: reglas y estrategia',
    seoTeam: 'Mal. Un {minion} normal es un esbirro de Mordred, no el rol especial de Mordred.',
    seoAbility:
      'Al inicio conoce a los aliados malvados salvo {oberon} y {wraith}. En una misión puede elegir Éxito o Fracaso.',
    seoLimit:
      '¿Merlín ve al Secuaz de Mordred? Sí. El nombre no le da la protección de {mordred} frente a {merlin}. Jugar Éxito no lo convierte en bueno.',
    seoScenario1:
      'Si hay otro malvado en la misión, dos Fracasos podrían delatar a varios participantes. Considera los roles obligados a fallar.',
    seoScenario2:
      'Un Éxito puede ganar confianza para una misión posterior. Es una decisión táctica, no una prueba de lealtad al bien.',
    strategicTipsTitle: 'Consejos Estratégicos:',
    tipDiscreetCollaborationTitle: 'Colaboración discreta:',
    tipDiscreetCollaborationText:
      'Si hay otro malvado en la misión, dos Fracasos podrían delatar a varios participantes. Considera los roles obligados a fallar.',
    tipDeceptionTitle: 'Engaño:',
    tipDeceptionText:
      "Perfecciona el arte del engaño. Hacerse pasar por uno de los 'Buenos' puede ayudarte a influir en sus decisiones y proteger tu identidad.",
    tipPublicDemeanorTitle: 'Comportamiento público:',
    tipPublicDemeanorText:
      'Cuida tus actos y palabras en público. Trata de evitar generar sospechas, sin ser ni demasiado defensivo ni excesivamente agresivo.',
  },
  pt: {
    seoHeading: 'Lacaio de Mordred em Avalon: regras e estratégia',
    seoTeam: 'Mal. Um {minion} comum é um lacaio de Mordred, não o papel especial Mordred.',
    seoAbility:
      'No início, conhece os aliados do mal, exceto {oberon} e {wraith}. Numa missão pode escolher Sucesso ou Falha.',
    seoLimit:
      'Merlin vê o Lacaio de Mordred? Sim. O nome não oferece a proteção de {mordred} contra {merlin}. Jogar Sucesso não torna o Lacaio bom.',
    seoScenario1:
      'Se outro jogador do mal estiver na missão, duas Falhas podem denunciar vários participantes. Considere os papéis obrigados a falhar.',
    seoScenario2:
      'Um Sucesso pode conquistar confiança para uma missão posterior. É uma escolha tática, não uma prova de lealdade ao bem.',
    strategicTipsTitle: 'Dicas Estratégicas:',
    tipDiscreetCollaborationTitle: 'Colaboração Discreta:',
    tipDiscreetCollaborationText:
      'Se outro jogador do mal estiver na missão, duas Falhas podem denunciar vários participantes. Considere os papéis obrigados a falhar.',
    tipDeceptionTitle: 'Engano:',
    tipDeceptionText:
      "Aperfeiçoe a arte do engano. Misturar-se como um dos membros do 'Bem' pode ajudá-lo a influenciar suas decisões e proteger sua identidade.",
    tipPublicDemeanorTitle: 'Comportamento Público:',
    tipPublicDemeanorText:
      'Esteja atento às suas ações e palavras públicas. Tente evitar suspeitas não sendo muito defensivo ou muito agressivo.',
  },
};
