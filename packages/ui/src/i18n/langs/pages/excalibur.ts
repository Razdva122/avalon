import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const excalibur: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    intro:
      '{excalibur} introduces an additional layer of strategy and interaction among players. It complements the base rules of the game and offers new possibilities throughout the gameplay.',
    title: 'Rules for using "Excalibur" (Sergeant in \'The Resistance\'):',
    assign: 'Assigning "Excalibur":',
    leaderInstructions:
      ' Before the mission starts, the mission leader selects a participant from those assigned to the mission to receive {excalibur}. The leader must pass {excalibur} to someone else on the mission besides themselves.',
    voting: 'Voting for the Mission:',
    votingInstructions:
      ' All players at the table are aware of to whom {excalibur} has been given, and they proceed to vote for or against the mission.',
    usage: 'Using Excalibur:',
    usageInstructions:
      ' After all mission participants have made their choice (success or failure), it is the turn of the {excalibur} holder, who has the opportunity to change the submitted vote of any one participant.',
    transparency: 'Excalibur Transparency:',
    transparencyInstructions:
      ' Everyone at the table can see whether {excalibur} was used. If {excalibur} was deployed, all players know on whom it was used, but only the {excalibur} holder and the targeted individual know what the original vote was. The rest of the players can only speculate based on the mission outcome.',
    strategicValue: 'Strategic Value:',
    strategicInstructions:
      ' Possessing {excalibur} adds strategic depth to the game by allowing one player to potentially alter the course of the game by influencing the actions of both good and evil characters. {excalibur} can be a pivotal factor in the outcomes of mission votes, especially during critical moments in the game.',
  },
  ru: {
    intro:
      '{excalibur} вводит дополнительный уровень стратегии и взаимодействия среди игроков. Это дополнение к базовым правилам игры, которое предлагает новые возможности в процессе игры.',
    title: 'Правила использования "Экскалибура" (Сержант в \'Сопротивлении\'):',
    assign: 'Назначение "Экскалибура":',
    leaderInstructions:
      ' Перед началом миссии лидер выбирает участника из тех, кто назначен на миссию, чтобы передать ему {excalibur}. Лидер обязан передать {excalibur} кому-то еще на миссии, кроме себя.',
    voting: 'Голосование за миссию:',
    votingInstructions:
      ' Все игроки за столом знают, кому передан {excalibur}, и переходят к голосованию за или против миссии.',
    usage: 'Использование Экскалибура:',
    usageInstructions:
      ' После того как все участники миссии сделали свой выбор (успех или провал), наступает очередь держателя {excalibur}, который получает возможность изменить отправленный голос любого из участников.',
    transparency: 'Прозрачность Экскалибура:',
    transparencyInstructions:
      ' Все за столом могут увидеть, был ли использован {excalibur}. Если {excalibur} был применен, все игроки знают, на кого он был использован, но только держатель {excalibur} и целевой человек знают, каким был оригинальный голос. Остальные игроки могут лишь строить догадки на основе исхода миссии.',
    strategicValue: 'Стратегическая ценность:',
    strategicInstructions:
      ' Обладание {excalibur} добавляет стратегическую глубину в игру, позволяя одному игроку потенциально изменить ход игры, влияя на действия как добрых, так и злых персонажей. {excalibur} может быть ключевым фактором в исходах голосований миссий, особенно в критические моменты игры.',
  },
  'zh-CN': {
    intro:
      '{excalibur} 为玩家之间引入了一个额外的战略和互动层面。它补充了游戏的基本规则，并在游戏过程中提供了新的可能性。',
    title: '使用“神剑”（反抗组织中的“军士”）的规则：',
    assign: '分配“神剑”：',
    leaderInstructions:
      '任务开始前，任务领导者从被指派执行任务的参与者中选择一位接受 {excalibur}。领导者必须将 {excalibur} 传给任务中的其他人，而不是自己。',
    voting: '任务投票：',
    votingInstructions: '桌上所有玩家都知道 {excalibur} 被给予了谁，接着投票决定支持或反对任务。',
    usage: '使用 神剑：',
    usageInstructions:
      '所有任务参与者做出选择（成功还是失败）后，轮到 {excalibur} 持有者，他有机会更改任何一名参与者的提交投票。',
    transparency: '神剑 的透明度：',
    transparencyInstructions:
      '桌上所有人都可以看到 {excalibur} 是否被使用。如果 {excalibur} 被使用，所有玩家知道影响了谁，但只有持有 {excalibur} 的人和被目标的个人知道原始的投票是什么。其他玩家只能根据任务结果来推测。',
    strategicValue: '战略价值：',
    strategicInstructions:
      '拥有 {excalibur} 为游戏增加了战略深度，使一个玩家可以通过影响好和坏角色的行为，潜在地改变游戏进程。{excalibur} 可以成为影响任务投票结果的关键因素，特别是在游戏的重要时刻。',
  },
  'zh-TW': {
    intro:
      '{excalibur} 為玩家之間引入了一個額外的戰略和互動層面。它補充了遊戲的基本規則，並在遊戲過程中提供了新的可能性。',
    title: '使用“神劍”（反抗勢力中的“軍士”）的規則：',
    assign: '分配“神劍”：',
    leaderInstructions:
      '任務開始前，任務領導者從被指派執行任務的參與者中選擇一位接受 {excalibur}。領導者必須將 {excalibur} 傳給任務中的其他人，而不是自己。',
    voting: '任務投票：',
    votingInstructions: '桌上所有玩家都知道 {excalibur} 被給予了誰，接著投票決定支持或反對任務。',
    usage: '使用 神劍：',
    usageInstructions:
      '所有任務參與者做出選擇（成功還是失敗）後，輪到 {excalibur} 持有者，他有機會更改任何一名參與者的提交投票。',
    transparency: '神劍 的透明度：',
    transparencyInstructions:
      '桌上所有人都可以看到 {excalibur} 是否被使用。如果 {excalibur} 被使用，所有玩家知道影響了誰，但只有持有 {excalibur} 的人和被目標的個人知道原始的投票是什麼。其他玩家只能根據任務結果來推測。',
    strategicValue: '戰略價值：',
    strategicInstructions:
      '擁有 {excalibur} 為遊戲增加了戰略深度，使一個玩家可以通過影響好和壞角色的行為，潛在地改變遊戲進程。{excalibur} 可以成為影響任務投票結果的關鍵因素，特別是在遊戲的重要時刻。',
  },
  es: {
    intro:
      '{excalibur} introduce una capa adicional de estrategia e interacción entre los jugadores. Complementa las reglas básicas del juego y ofrece nuevas posibilidades a lo largo de la partida.',
    title: 'Reglas para usar "Excalibur" (Sargento en \'La Resistencia\'):',
    assign: 'Asignación de "Excalibur":',
    leaderInstructions:
      ' Antes de que comience la misión, el líder de la misión selecciona a un participante de los asignados a la misión para recibir {excalibur}. El líder debe pasar {excalibur} a alguien más en la misión además de ellos mismos.',
    voting: 'Votación para la Misión:',
    votingInstructions:
      ' Todos los jugadores en la mesa saben a quién se le ha dado {excalibur} y proceden a votar a favor o en contra de la misión.',
    usage: 'Uso de Excalibur:',
    usageInstructions:
      ' Después de que todos los participantes de la misión hayan hecho su elección (éxito o fracaso), es el turno del poseedor de {excalibur}, quien tiene la oportunidad de cambiar el voto presentado de cualquier participante.',
    transparency: 'Transparencia de Excalibur:',
    transparencyInstructions:
      ' Todos en la mesa pueden ver si {excalibur} fue utilizado. Si {excalibur} fue desplegado, todos los jugadores saben sobre quién se utilizó, pero solo el poseedor de {excalibur} y la persona objetivo saben cuál fue el voto original. El resto de los jugadores solo puede especular basándose en el resultado de la misión.',
    strategicValue: 'Valor Estratégico:',
    strategicInstructions:
      ' Poseer {excalibur} agrega profundidad estratégica al juego al permitir que un jugador potencialmente altere el curso del juego al influir en las acciones de personajes tanto buenos como malos. {excalibur} puede ser un factor decisivo en los resultados de las votaciones de misiones, especialmente durante momentos críticos en el juego.',
  },
};
