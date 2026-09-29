import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const lunatic: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Lunatic in Avalon: Must-Fail Rule & Strategy',
    seoTeam: 'Evil. You win with the evil team.',
    seoAbility:
      '{lunatic} must submit Fail on every mission they join. Unlike an ordinary {minion}, they cannot choose Success to gain trust.',
    seoLimit:
      'Does one Lunatic always fail the mission? Not if that mission requires two Fail cards. The forced card is not a guarantee of the final result; {excalibur}, when enabled, can also change a card.',
    seoScenario1:
      'On a mission needing only one Fail, your required card will fail it unless another enabled mechanic changes that card.',
    seoScenario2:
      'On the fourth mission with 7–10 players, two Fail cards are needed. If you are the only evil participant, your one Fail is not enough.',
    generalTipsHeader: 'General Tips:',
    strategicFailure: 'Incorporate mandatory failure strategically:',
    strategicFailureDetails:
      'While you must always vote "Fail" when on a mission, be strategic about your gameplay in other aspects to avoid immediate detection.',
    deceiveWithBluff: 'Bluff effectively:',
    bluffTechnique:
      'Conceal your obligated failure by participating in discussions and strategies as if you have a choice, maintaining an air of unpredictability.',
    covertSupportAllies: 'Align with other minions subtly:',
    subtleAlignment:
      'Although your role requires overt sabotage, look for opportunities to support other minions in more covert ways.',
  },
  ru: {
    seoHeading: 'Лунатик в Авалоне: обязательный провал и стратегия',
    seoTeam: 'Зло. Вы побеждаете вместе с командой зла.',
    seoAbility:
      '{lunatic} обязан дать провал в каждой миссии, где участвует. В отличие от обычной роли {minion}, успех ради доверия ему недоступен.',
    seoLimit:
      'Всегда ли Лунатик проваливает миссию? Если нужны две карты провала, одной недостаточно. Обязательная карта не гарантирует итог; включённый {excalibur} также может изменить карту.',
    seoScenario1:
      'В миссии с порогом в один провал ваша обязательная карта провалит поход, если другая включённая механика её не изменит.',
    seoScenario2:
      'В четвёртой миссии на 7–10 игроков нужны два провала. Если вы единственный злой участник, одной вашей карты недостаточно.',
    generalTipsHeader: 'Общие советы:',
    strategicFailure: 'Используйте обязательный провал стратегически:',
    strategicFailureDetails:
      'Хотя на миссии вам всегда приходится голосовать за «Неудачу», проявляйте стратегичность в игре в других аспектах, чтобы избежать немедленного обнаружения.',
    deceiveWithBluff: 'Эффективно блефуйте:',
    bluffTechnique:
      'Скрывайте свой обязательный провал, участвуя в обсуждениях и стратегиях так, как будто у вас есть выбор, сохраняя атмосферу непредсказуемости.',
    covertSupportAllies: 'Ненавязчиво скоординируйтесь с другими миньонами:',
    subtleAlignment:
      'Хотя ваша роль требует открытого саботажа, ищите возможности поддержать других миньонов более скрытно.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆疯子：强制失败与任务策略',
    seoTeam: '坏人。你随邪恶阵营获胜。',
    seoAbility: '{lunatic}参加的每次任务都必须出失败。与普通{minion}不同，不能用成功牌换取信任。',
    seoLimit:
      '有疯子就一定任务失败吗？若任务需要两张失败牌，一张不够。强制出的牌不保证最终结果；启用的{excalibur}也可能改变任务牌。',
    seoScenario1: '只需一张失败牌的任务中，你的牌会使任务失败，除非其他已启用的机制改变了这张牌。',
    seoScenario2: '7至10人局的第4次任务需要两张失败牌。如果你是唯一的坏人，仅靠你的一张失败牌不够。',
    generalTipsHeader: '基本提示:',
    strategicFailure: '战略性地融入强制失败:',
    strategicFailureDetails: '虽然在任务中你必须始终投票"失败",但在其他方面需要采用策略以避免立即被发现。',
    deceiveWithBluff: '有效地虚张声势:',
    bluffTechnique: '通过参与讨论和策略制定,假装你有选择权,从而掩盖你被迫失败的事实,并保持一种不可预测的氛围。',
    covertSupportAllies: '巧妙地与其他爪牙协调:',
    subtleAlignment: '虽然你的角色要求明面上的破坏,但也要寻找机会以更加隐秘的方式支持其他爪牙。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆瘋子：強制失敗與任務策略',
    seoTeam: '壞人。你隨邪惡陣營獲勝。',
    seoAbility: '{lunatic}參加的每次任務都必須出失敗。與普通{minion}不同，不能用成功牌換取信任。',
    seoLimit:
      '有瘋子就一定任務失敗嗎？若任務需要兩張失敗牌，一張不夠。強制出的牌不保證最終結果；啟用的{excalibur}也可能改變任務牌。',
    seoScenario1: '只需一張失敗牌的任務中，你的牌會使任務失敗，除非其他已啟用的機制改變了這張牌。',
    seoScenario2: '7至10人局的第4次任務需要兩張失敗牌。如果你是唯一的壞人，僅靠你的一張失敗牌不夠。',
    generalTipsHeader: '基本提示:',
    strategicFailure: '策略性地融入強制性失敗:',
    strategicFailureDetails: '儘管在任務中你必須始終投票「失敗」,但在其他方面的遊戲策略上要謹慎,以避免立即被發現。',
    deceiveWithBluff: '有效地虛張聲勢:',
    bluffTechnique: '通過參與討論和策略制定,假裝你有選擇權,從而掩飾你被迫的失敗,同時保持不可預測的氣息。',
    covertSupportAllies: '巧妙地與其他爪牙協同:',
    subtleAlignment: '儘管你的角色要求明顯破壞,但尋找以更隱秘方式支持其他爪牙的機會。',
  },
  es: {
    seoHeading: 'Lunático en Avalon: Fracaso obligatorio y estrategia',
    seoTeam: 'Mal. Ganas con el equipo del mal.',
    seoAbility:
      '{lunatic} debe jugar Fracaso en cada misión en la que participa. A diferencia de un {minion} normal, no puede jugar Éxito para ganar confianza.',
    seoLimit:
      '¿Un Lunático siempre hace fallar la misión? No si se necesitan dos Fracasos. Su carta obligatoria no garantiza el resultado; {excalibur}, si está habilitado, también puede cambiar una carta.',
    seoScenario1:
      'En una misión que necesita un solo Fracaso, tu carta hará que falle salvo que otra mecánica habilitada la cambie.',
    seoScenario2:
      'En la cuarta misión con 7–10 jugadores se necesitan dos Fracasos. Si eres el único malvado, tu carta no basta.',
    generalTipsHeader: 'Consejos Generales:',
    strategicFailure: 'Incorpora el fallo obligatorio de manera estratégica:',
    strategicFailureDetails:
      'Aunque siempre debes votar "Fallo" cuando estés en una misión, sé estratégico en otros aspectos de tu juego para evitar ser detectado de inmediato.',
    deceiveWithBluff: 'Engaña de manera efectiva:',
    bluffTechnique:
      'Oculta tu fracaso forzado participando en debates y estrategias como si tuvieras opción, manteniendo un ambiente de impredecibilidad.',
    covertSupportAllies: 'Aliéntate sutilmente con otros secuaces:',
    subtleAlignment:
      'Aunque tu rol requiera sabotaje abierto, busca oportunidades para apoyar a otros secuaces de forma más encubierta.',
  },
  pt: {
    seoHeading: 'Lunático em Avalon: Falha obrigatória e estratégia',
    seoTeam: 'Mal. Você vence com a equipe do mal.',
    seoAbility:
      '{lunatic} deve jogar Falha em toda missão de que participa. Ao contrário de um {minion} comum, não pode jogar Sucesso para ganhar confiança.',
    seoLimit:
      'Um Lunático sempre faz a missão falhar? Não se forem necessárias duas Falhas. Sua carta obrigatória não garante o resultado; {excalibur}, quando habilitada, também pode alterar uma carta.',
    seoScenario1:
      'Numa missão que exige uma Falha, sua carta fará a missão fracassar, a menos que outra mecânica habilitada a altere.',
    seoScenario2:
      'Na quarta missão com 7–10 jogadores são necessárias duas Falhas. Se você for o único jogador do mal, sua carta não basta.',
    generalTipsHeader: 'Dicas Gerais:',
    strategicFailure: 'Incorpore a falha obrigatória estrategicamente:',
    strategicFailureDetails:
      'Embora você deva sempre votar "Falha" quando estiver em uma missão, seja estratégico em outros aspectos do seu jogo para evitar detecção imediata.',
    deceiveWithBluff: 'Blefe efetivamente:',
    bluffTechnique:
      'Oculte sua falha obrigatória participando de discussões e estratégias como se tivesse escolha, mantendo um ar de imprevisibilidade.',
    covertSupportAllies: 'Alinhe-se com outros lacaios sutilmente:',
    subtleAlignment:
      'Embora seu papel exija sabotagem aberta, procure oportunidades para apoiar outros lacaios de maneiras mais encobertas.',
  },
};
