import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

export const lady: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    intro:
      ' is an expansion that introduces a new strategic element and provides the ability to gain additional information about the loyalties of other players. It is used in <strong>games with 7 or more</strong> participants and adds more depth to the gameplay.',
    title: 'Rules for using "Lady of lake" (Inquisitor Token in \'The Resistance\'):',
    whenToUseIt: 'When to Use It:',
    comesIntoPlay:
      ' The {ladyOfLake} comes into play after the second quest is completed. That means it becomes available starting from the third round of the game.',
    selectingTheHolder: 'Selecting the Holder:',
    initiallyGetsPlayer:
      ' Initially, the {ladyOfLake} gets the player to the right of the first leader. The player who receives the title {ladyOfLake} uses her power at the end of each round (after the second), passing it to another player who has not yet received the {ladyOfLake}.',
    applyingTheAbility: 'Applying the Ability:',
    choosesPlayer:
      ' The owner of the {ladyOfLake} chooses another player and secretly learns their role — whether that player is a Servant of Arthur (good) or a Minion of Mordred (evil).',
    passingTheLady: 'Passing the "Lady of the Lake":',
    passesToChecked:
      ' After using her ability, the {ladyOfLake} owner passes it to the player whose loyalty was just checked. This player will then use {ladyOfLake} in the next round.',
    restrictionRecurrent: 'Restriction on Recurrent Checks:',
    cannotCheckAgain:
      ' A player who has already been passed the {ladyOfLake} cannot be checked again. This rule helps ensure that each round, new information is revealed about a different player.',
    strategicUse: 'Strategic Use:',
    strategicPossibilities:
      ' The use of the {ladyOfLake} adds strategic possibilities to the game. Players can use the information gained to plan their actions, trying to identify traitors among the participants.',
  },
  ru: {
    intro:
      ' — это дополнение, которое вводит новый стратегический элемент и предоставляет возможность получить дополнительную информацию о лояльности других игроков. Оно используется в <strong>играх с 7 или более</strong> участниками и добавляет глубину игровому процессу.',
    title: 'Правила использования "Леди Озера" (инквизиторский токен в \'Сопротивление\'):',
    whenToUseIt: 'Когда использовать:',
    comesIntoPlay:
      ' {ladyOfLake} вступает в игру после завершения второго похода. Это означает, что она становится доступна, начиная с третьего раунда игры.',
    selectingTheHolder: 'Выбор держателя:',
    initiallyGetsPlayer:
      ' Изначально {ladyOfLake} передаётся игроку справа от первого лидера. Игрок, получивший титул {ladyOfLake}, использует её силу в конце каждого раунда (после второго), передавая её другому игроку, который ещё не получал {ladyOfLake}.',
    applyingTheAbility: 'Использование способности:',
    choosesPlayer:
      ' Владелец {ladyOfLake} выбирает другого игрока и тайно узнаёт его роль — является ли этот игрок слугой Артура (свет) или приспешником Мордреда (тьма).',
    passingTheLady: 'Передача "Леди Озера":',
    passesToChecked:
      ' После использования способности владелец {ladyOfLake} передаёт её игроку, чья лояльность только что была проверена. Этот игрок затем использует {ladyOfLake} в следующем раунде.',
    restrictionRecurrent: 'Ограничение на повторные проверки:',
    cannotCheckAgain:
      ' Игрок, который уже получил {ladyOfLake}, не может быть проверен снова. Это правило помогает гарантировать, что в каждом раунде раскрывается новая информация о другом игроке.',
    strategicUse: 'Стратегическое использование:',
    strategicPossibilities:
      ' Использование {ladyOfLake} добавляет стратегические возможности в игру. Игроки могут использовать полученную информацию для планирования своих действий, пытаясь выявить предателей среди участников.',
  },
  'zh-CN': {
    intro:
      ' 是一个扩展，介绍了一种新的战略元素，并提供获得其他玩家忠诚度的附加信息的能力。它用于<strong>7个或以上</strong>参与者的游戏，增加了更多游戏深度。',
    title: '使用 "湖中仙女"（反抗者中的审问标志）的规则：',
    whenToUseIt: '使用时机：',
    comesIntoPlay: ' {ladyOfLake}在第二个任务完成后加入游戏。这意味着从游戏的第三轮开始可用。',
    selectingTheHolder: '选择持有者：',
    initiallyGetsPlayer:
      ' 最初，{ladyOfLake}传给第一个领导者右边的玩家。获得{ladyOfLake}头衔的玩家在每轮结束（第二轮之后）使用她的能力，并将其传给另一个尚未获得{ladyOfLake}的玩家。',
    applyingTheAbility: '应用能力：',
    choosesPlayer:
      ' {ladyOfLake}的拥有者选择另一位玩家，秘密了解他们的角色——该玩家是亚瑟的仆人（善）还是莫德雷德的手下（恶）。',
    passingTheLady: '传递"湖上女士"：',
    passesToChecked:
      ' 使用能力后，{ladyOfLake}的拥有者将其传递给刚刚忠诚被检查的玩家。这个玩家将在下一轮使用{ladyOfLake}。',
    restrictionRecurrent: '重复检查的限制：',
    cannotCheckAgain:
      ' 已经传递过{ladyOfLake}的玩家不能再被检查。该规则有助于确保每一个轮次都有新的信息被揭露关于不同的玩家。',
    strategicUse: '战略性使用：',
    strategicPossibilities:
      ' 使用{ladyOfLake}为游戏增添了战略性的可能性。玩家可以使用获得的信息制定行动计划，试图识别参与者中的叛徒。',
  },
  'zh-TW': {
    intro:
      ' 是一個擴展，介紹了一種新的戰略元素，並提供獲取其他玩家忠誠度的附加信息的能力。它用於<strong>7位或更多</strong>參加者的遊戲中，增加了更多遊戲深度。',
    title: '使用 "湖中仙女"（反抗者中的審問標記）的規則：',
    whenToUseIt: '使用時機：',
    comesIntoPlay: ' {ladyOfLake}在第二個任務完成後加入遊戲。這表示從遊戲的第三輪開始可用。',
    selectingTheHolder: '選擇持有者：',
    initiallyGetsPlayer:
      ' 最初，{ladyOfLake}傳給第一個領導者右邊的玩家。獲得{ladyOfLake}頭銜的玩家在每輪結束（第二輪之後）使用她的能力，並將其傳給另一個尚未獲得{ladyOfLake}的玩家。',
    applyingTheAbility: '應用能力：',
    choosesPlayer:
      ' {ladyOfLake}的擁有者選擇另一位玩家，秘密了解他們的角色——該玩家是亞瑟的僕人（善）還是莫德雷德的手下（惡）。',
    passingTheLady: '傳遞"湖上女士"：',
    passesToChecked:
      ' 使用能力後，{ladyOfLake}的擁有者將其傳遞給剛剛忠誠被檢查的玩家。這個玩家將在下一輪使用{ladyOfLake}。',
    restrictionRecurrent: '重複檢查的限制：',
    cannotCheckAgain: ' 已經傳遞過{ladyOfLake}的玩家不能再被檢查。此規則有助于確保每輪都揭露新的信息關於不同的玩家。',
    strategicUse: '戰略性使用：',
    strategicPossibilities:
      ' 使用{ladyOfLake}為游戏增添了戰略性的可能性。玩家可以使用獲得的信息制定行動計劃，試圖識別參加者中的叛徒。',
  },
  es: {
    intro:
      ' es una expansión que introduce un nuevo elemento estratégico y proporciona la capacidad de obtener información adicional sobre las lealtades de otros jugadores. Se utiliza en <strong>juegos con 7 o más</strong> participantes y añade más profundidad al juego.',
    title: 'Reglas para usar "Dama del Lago" (Ficha de Inquisidor en \'La Resistencia\'):',
    whenToUseIt: 'Cuándo Usarla:',
    comesIntoPlay:
      ' La {ladyOfLake} entra en juego después de que se completa la segunda misión. Esto significa que está disponible a partir de la tercera ronda del juego.',
    selectingTheHolder: 'Seleccionando al Portador:',
    initiallyGetsPlayer:
      ' Inicialmente, la {ladyOfLake} es otorgada al jugador a la derecha del primer líder. El jugador que recibe el título de {ladyOfLake} utiliza su poder al final de cada ronda (después de la segunda), pasándola a otro jugador que aún no haya recibido la {ladyOfLake}.',
    applyingTheAbility: 'Aplicación de la Habilidad:',
    choosesPlayer:
      ' El dueño de la {ladyOfLake} elige a otro jugador y aprende secretamente su rol — si ese jugador es un Servidor de Arturo (bueno) o un Secuaz de Mordred (malo).',
    passingTheLady: 'Pasando la "Dama del Lago":',
    passesToChecked:
      ' Después de usar su habilidad, el dueño de {ladyOfLake} la pasa al jugador cuya lealtad acaba de ser comprobada. Este jugador usará entonces {ladyOfLake} en la siguiente ronda.',
    restrictionRecurrent: 'Restricción sobre Comprobaciones Recurrentes:',
    cannotCheckAgain:
      ' Un jugador que ya ha recibido la {ladyOfLake} no puede ser comprobado de nuevo. Esta regla ayuda a asegurar que en cada ronda se revele nueva información sobre un jugador diferente.',
    strategicUse: 'Uso Estratégico:',
    strategicPossibilities:
      ' El uso de la {ladyOfLake} añade posibilidades estratégicas al juego. Los jugadores pueden usar la información obtenida para planificar sus acciones, tratando de identificar a los traidores entre los participantes.',
  },
};
