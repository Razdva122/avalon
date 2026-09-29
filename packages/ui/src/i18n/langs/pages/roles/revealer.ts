import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const revealer: { [key in TLanguage]: Dictionary<string> } = {
  pt: {
    seoHeading: 'Revelador em Avalon: quando o papel é revelado',
    seoTeam: 'Mal. Ser revelado não elimina você da partida nem muda seu lado.',
    seoAbility:
      '{revealer} é revelado a todos após a segunda missão fracassada. Contam as missões da partida, não suas próprias cartas de Falha.',
    seoLimit:
      'Ele aparece automaticamente após a missão 2? Não: duas missões precisam ter falhado. Depois, ainda pode votar, liderar e escolher Sucesso ou Falha.',
    seoScenario1:
      'Com resultados Sucesso, Falha, Falha, a revelação acontece após a missão 3, mesmo que você não tenha participado das equipes que falharam.',
    seoScenario2:
      'Após a revelação, o bem provavelmente rejeitará equipes com você. Seus votos e propostas ainda influenciam a partida: não exponha seus aliados.',
    commonAdviceTitle: 'Conselhos Gerais:',
    commonAdviceTakeResponsibilityHeading: 'Assuma a Responsabilidade:',
    commonAdviceTakeResponsibilityText:
      'Sabendo que após a segunda falha seu papel será público, tente tomar a iniciativa durante as missões fracassadas para proteger seus aliados e garantir o sucesso geral da equipe.',
    commonAdviceConfuseOpponentsHeading: 'Confunda os Oponentes Mesmo Após a Revelação:',
    commonAdviceConfuseOpponentsText:
      'Depois que seu papel for revelado, continue semeando confusão entre os oponentes, manipulando fluxos de informação para apoiar seus aliados e criar desordem entre os inimigos.',
  },
  en: {
    seoHeading: 'Revealer in Avalon: When the Role Is Revealed',
    seoTeam: 'Evil. Being revealed does not remove you from the game or change your side.',
    seoAbility:
      '{revealer} is publicly revealed after the second failed mission. The count is failed missions across the game, not your own Fail cards.',
    seoLimit:
      'Is the Revealer exposed after mission 2 automatically? No. Two missions must have failed. Afterwards, the Revealer can still vote, lead and play Success or Fail on missions.',
    seoScenario1:
      'If the results are Success, Fail, Fail, the reveal happens after mission 3, even if you were not on those failed teams.',
    seoScenario2:
      'Once revealed, expect good to reject teams containing you. Your votes and proposals can still affect the game, so do not give away your allies.',
    commonAdviceTitle: 'General Advice:',
    commonAdviceTakeResponsibilityHeading: 'Take Responsibility:',
    commonAdviceTakeResponsibilityText:
      "Knowing that after the second failure your role will be public, try to take the initiative during failed missions to cover your allies and ensure the team's overall success.",
    commonAdviceConfuseOpponentsHeading: 'Confuse Opponents Even After Revelation:',
    commonAdviceConfuseOpponentsText:
      'After your role is revealed, continue to sow confusion among opponents by manipulating information streams to support your allies and create disorder among enemies.',
  },
  ru: {
    seoHeading: 'Разоблаченная в Авалоне: когда раскрывается роль',
    seoTeam: 'Зло. Раскрытие не выводит вас из игры и не меняет сторону.',
    seoAbility:
      '{revealer} раскрывается всем после второй проваленной миссии. Считаются проваленные миссии всей игры, а не ваши личные карты провала.',
    seoLimit:
      'Роль автоматически раскрывается после второй миссии? Нет, должны провалиться две миссии. После раскрытия можно голосовать, быть лидером и выбирать успех или провал.',
    seoScenario1:
      'При результатах «успех, провал, провал» роль раскроется после третьей миссии, даже если вы не были в проваленных командах.',
    seoScenario2:
      'После раскрытия добро, скорее всего, будет отвергать команды с вами. Голосования и предложения всё ещё влияют на игру; не выдавайте союзников.',
    commonAdviceTitle: 'Общие советы:',
    commonAdviceTakeResponsibilityHeading: 'Берите ответственность на себя:',
    commonAdviceTakeResponsibilityText:
      'Зная, что после второго провала ваша роль станет общедоступной, постарайтесь взять на себя инициативу в провальных миссиях, чтобы прикрыть союзников и обеспечить общий успех команды.',
    commonAdviceConfuseOpponentsHeading: 'Путайте противников даже после раскрытия:',
    commonAdviceConfuseOpponentsText:
      'После открытия вашей роли продолжайте сеять смятение среди оппонентов, манипулируя информационными потоками для поддержки союзников и создания путаницы у врагов.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆被揭示者：何时公开身份与后续玩法',
    seoTeam: '坏人。公开身份不会让你出局，也不会改变阵营。',
    seoAbility: '{revealer}在第二次任务失败后向所有人公开。这里统计全局失败的任务数量，不是你个人出的失败牌数量。',
    seoLimit: '第2次任务结束就自动公开吗？不是，必须已有两次任务失败。公开后仍可投票、当队长并选择成功或失败。',
    seoScenario1: '如果结果依次为成功、失败、失败，身份在第3次任务后公开，即使你没有参加那些失败的队伍。',
    seoScenario2: '公开后，好人可能拒绝让你上任务，但你的投票和提案仍能影响游戏。不要顺带暴露队友。',
    commonAdviceTitle: '一般建议：',
    commonAdviceTakeResponsibilityHeading: '承担责任：',
    commonAdviceTakeResponsibilityText:
      '知道在第二次失败后,您的角色将公开,请尝试在失败任务中主动出击,以保护您的盟友并确保团队整体成功。',
    commonAdviceConfuseOpponentsHeading: '即使在暴露后也要混淆对手:',
    commonAdviceConfuseOpponentsText:
      '在您的角色被揭露后,继续在对手中制造混乱,通过操控信息流来支持盟友,并在敌人中制造迷惑。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆被揭示者：何時公開身分與後續玩法',
    seoTeam: '壞人。公開身分不會讓你出局，也不會改變陣營。',
    seoAbility: '{revealer}在第二次任務失敗後向所有人公開。這裡統計全局失敗的任務數量，不是你個人出的失敗牌數量。',
    seoLimit: '第2次任務結束就自動公開嗎？不是，必須已有兩次任務失敗。公開後仍可投票、當隊長並選擇成功或失敗。',
    seoScenario1: '如果結果依次為成功、失敗、失敗，身分在第3次任務後公開，即使你沒有參加那些失敗的隊伍。',
    seoScenario2: '公開後，好人可能拒絕讓你上任務，但你的投票和提案仍能影響遊戲。不要順帶暴露隊友。',
    commonAdviceTitle: '一般建議：',
    commonAdviceTakeResponsibilityHeading: '承擔責任：',
    commonAdviceTakeResponsibilityText:
      '知道在第二次失敗後,您的角色將公開,請嘗試在失敗的任務中主動出擊,以保護您的盟友並確保團隊整體的成功。',
    commonAdviceConfuseOpponentsHeading: '即使在暴露後也要混淆對手:',
    commonAdviceConfuseOpponentsText:
      '在您的角色被揭露後,繼續在對手中製造混亂,透過操控資訊流來支持盟友,並在敵人中製造迷惑。',
  },
  es: {
    seoHeading: 'Revelador en Avalon: cuándo se revela el rol',
    seoTeam: 'Mal. Ser revelado no te elimina de la partida ni cambia tu bando.',
    seoAbility:
      '{revealer} se revela a todos después de la segunda misión fallida. Se cuentan misiones fallidas de toda la partida, no tus propias cartas.',
    seoLimit:
      '¿Se revela automáticamente tras la misión 2? No: deben haber fallado dos misiones. Después aún puede votar, liderar y elegir Éxito o Fracaso.',
    seoScenario1:
      'Con resultados Éxito, Fracaso, Fracaso, se revela tras la misión 3, aunque no haya participado en los equipos que fallaron.',
    seoScenario2:
      'Tras revelarte, es probable que el bien rechace equipos contigo. Tus votos y propuestas siguen influyendo: evita delatar a tus aliados.',
    commonAdviceTitle: 'Consejos Generales:',
    commonAdviceTakeResponsibilityHeading: 'Asume la Responsabilidad',
    commonAdviceTakeResponsibilityText:
      'Sabiendo que después del segundo fallo tu rol se hará público, intenta tomar la iniciativa en las misiones fallidas para proteger a tus aliados y asegurar el éxito general del equipo.',
    commonAdviceConfuseOpponentsHeading: 'Confunde a los Oponentes Incluso Después de la Revelación:',
    commonAdviceConfuseOpponentsText:
      'Después de que tu rol sea revelado, continúa sembrando confusión entre los oponentes manipulando los flujos de información para apoyar a tus aliados y crear desorden entre los enemigos.',
  },
};
