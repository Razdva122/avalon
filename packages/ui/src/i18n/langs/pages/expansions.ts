import type { TLanguage } from '@/i18n/interface';
import type { Dictionary } from '@avalon/types';

export const expansions: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Avalon expansions: rules and comparison',
    intro:
      'Looking for an Avalon expansion pack or extra cards? This guide compares the four optional modules available on this site. They add information or change mission play.',
    chooseTitle: 'Which expansion should you choose?',
    chooseText:
      'Start with {ladyOfLake} for private loyalty checks. Choose {excalibur} for changing a mission card, {plotCards} for several new actions, or {ladyOfSea} for more detailed evil role information. Read the base rules first, then add the mechanics your group wants.',
    compatibilityTitle: 'Can you combine expansions?',
    compatibilityText:
      "Room settings allow {ladyOfLake} or {ladyOfSea}, but not both. Either can be combined with {excalibur} and {plotCards}. These guides describe the site's implementation; a printed edition or another platform may use different rules.",
    ladyText: 'Privately check good or evil, then pass the token. Previous holders cannot be checked.',
    ladySeaText:
      'An alternative Lady that can reveal an evil role. Good roles remain unnamed, with exceptions for misleading loyalty.',
    excaliburText:
      "Flip one other mission participant's Success or Fail after cards are submitted, or skip using the sword.",
    plotCardsText: 'A 7- or 15-card deck adds loyalty checks, team rejection, leadership changes and public voting.',
  },
  ru: {
    seoHeading: 'Дополнения Авалона: правила и сравнение',
    intro:
      'Ищете дополнения или дополнительные карты для Авалона? Здесь сравниваются четыре модуля, доступные на сайте. Они добавляют информацию или меняют ход миссий.',
    chooseTitle: 'Какое дополнение выбрать?',
    chooseText:
      'Для тайных проверок подойдёт {ladyOfLake}. Для смены карты миссии — {excalibur}, для нескольких новых действий — {plotCards}, для более подробных сведений о злых ролях — {ladyOfSea}. Сначала изучите базовые правила, затем добавляйте нужные вашей компании механики.',
    compatibilityTitle: 'Можно ли сочетать дополнения?',
    compatibilityText:
      'В настройках комнаты можно выбрать {ladyOfLake} или {ladyOfSea}, но не обеих. Также можно включить {excalibur} и {plotCards}. Статьи описывают реализацию сайта: в настольном издании или на другой платформе правила могут отличаться.',
    ladyText: 'Тайная проверка добра или зла с передачей жетона. Прежних владельцев проверять нельзя.',
    ladySeaText:
      'Альтернативная Леди, способная раскрыть злую роль. Добрые роли не называются; есть исключения для ложной лояльности.',
    excaliburText: 'После сдачи карт меняет успех или провал другого участника миссии. Применение можно пропустить.',
    plotCardsText: 'Колода из 7 или 15 карт добавляет проверки, отмену команды, смену лидера и публичные голосования.',
  },
  es: {
    seoHeading: 'Expansiones de Avalon: reglas y comparación',
    intro:
      '¿Buscas expansiones o cartas adicionales para Avalon? Esta guía compara los cuatro módulos opcionales disponibles en el sitio. Añaden información o cambian las misiones.',
    chooseTitle: '¿Qué expansión elegir?',
    chooseText:
      'Elige {ladyOfLake} para consultas privadas de lealtad, {excalibur} para cambiar una carta de misión, {plotCards} para varias acciones nuevas o {ladyOfSea} para obtener más información sobre personajes malvados. Aprende primero las reglas básicas y añade las mecánicas que quiera tu grupo.',
    compatibilityTitle: '¿Se pueden combinar expansiones?',
    compatibilityText:
      'Los ajustes permiten {ladyOfLake} o {ladyOfSea}, pero no ambas. Cualquiera puede combinarse con {excalibur} y {plotCards}. Estas guías describen la versión del sitio; una edición impresa u otra plataforma puede tener reglas distintas.',
    ladyText: 'Consulta en privado bien o mal y pasa la ficha. No se puede consultar a portadores anteriores.',
    ladySeaText:
      'Una Dama alternativa que puede revelar un personaje malvado. No identifica personajes buenos y hay excepciones de lealtad.',
    excaliburText:
      'Invierte el Éxito o Fracaso de otro participante tras entregar las cartas de misión. Puedes no usarla.',
    plotCardsText: 'Un mazo de 7 o 15 cartas añade consultas, rechazo de equipos, cambios de líder y votos públicos.',
  },
  pt: {
    seoHeading: 'Expansões de Avalon: regras e comparação',
    intro:
      'Procurando expansões ou cartas extras para Avalon? Este guia compara os quatro módulos opcionais disponíveis no site. Eles acrescentam informação ou alteram missões.',
    chooseTitle: 'Qual expansão escolher?',
    chooseText:
      'Escolha {ladyOfLake} para verificações privadas de lealdade, {excalibur} para inverter uma carta de missão, {plotCards} para várias ações novas ou {ladyOfSea} para obter mais detalhes sobre personagens do mal. Aprenda as regras básicas e acrescente as mecânicas desejadas pelo grupo.',
    compatibilityTitle: 'É possível combinar expansões?',
    compatibilityText:
      'Os ajustes permitem {ladyOfLake} ou {ladyOfSea}, mas não ambas. Qualquer uma pode ser combinada com {excalibur} e {plotCards}. Estes guias descrevem a versão do site; uma edição impressa ou outra plataforma pode ter regras diferentes.',
    ladyText: 'Verifique bem ou mal em segredo e passe a ficha. Portadores anteriores não podem ser verificados.',
    ladySeaText:
      'Uma Dama alternativa que pode revelar um personagem do mal. Não identifica personagens do bem e há exceções de lealdade.',
    excaliburText:
      'Inverta o Sucesso ou Fracasso de outro participante após a entrega das cartas de missão. O uso é opcional.',
    plotCardsText:
      'Um baralho de 7 ou 15 cartas acrescenta verificações, rejeição de equipes, mudanças de líder e votos públicos.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆扩展规则：仙女、神剑与剧情卡比较',
    intro: '想了解阿瓦隆扩展包或额外卡牌？本指南比较本站提供的四种可选模块，它们增加信息或改变任务流程。',
    chooseTitle: '该选择哪种扩展？',
    chooseText:
      '想私下查验阵营可选{ladyOfLake}；想改变任务牌可选{excalibur}；想增加多种行动可选{plotCards}；想知道更多坏人角色信息可选{ladyOfSea}。先学会基础规则，再加入适合你们的机制。',
    compatibilityTitle: '扩展可以一起使用吗？',
    compatibilityText:
      '房间设置中{ladyOfLake}与{ladyOfSea}只能二选一，任一均可搭配{excalibur}和{plotCards}。指南说明本站实现，实体版本或其他平台的规则可能不同。',
    ladyText: '私下查验好坏阵营后传递标记，不能查验之前的持有者。',
    ladySeaText: '可揭示坏人角色的另一种仙女，不显示好人具体角色，并有误导阵营的例外。',
    excaliburText: '任务牌提交后翻转另一位参与者的成功或失败，也可选择不用剑。',
    plotCardsText: '7张或15张牌组增加阵营查验、否决队伍、更换队长和公开投票。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆擴充規則：仙女、神劍與劇情卡比較',
    intro: '想了解阿瓦隆擴充包或額外卡牌？本指南比較本站提供的四種可選模組，它們增加資訊或改變任務流程。',
    chooseTitle: '該選擇哪種擴充？',
    chooseText:
      '想私下查驗陣營可選{ladyOfLake}；想改變任務牌可選{excalibur}；想增加多種行動可選{plotCards}；想知道更多壞人角色資訊可選{ladyOfSea}。先學會基礎規則，再加入適合你們的機制。',
    compatibilityTitle: '擴充可以一起使用嗎？',
    compatibilityText:
      '房間設定中{ladyOfLake}與{ladyOfSea}只能二選一，任一均可搭配{excalibur}和{plotCards}。指南說明本站實作，實體版本或其他平台的規則可能不同。',
    ladyText: '私下查驗好壞陣營後傳遞標記，不能查驗之前的持有者。',
    ladySeaText: '可揭示壞人角色的另一種仙女，不顯示好人具體角色，並有誤導陣營的例外。',
    excaliburText: '任務牌提交後翻轉另一位參與者的成功或失敗，也可選擇不用劍。',
    plotCardsText: '7張或15張牌組增加陣營查驗、否決隊伍、更換隊長和公開投票。',
  },
};
