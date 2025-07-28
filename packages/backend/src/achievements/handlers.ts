import {
  VisualGameState,
  TLoyalty,
  HistoryAssassinate,
  HistoryVote,
  CheckLoyalty,
  HistoryMission,
} from '@avalon/types';
import { AchievementService } from './index';
import {
  ACHIEVEMENT_LIGHT_WINS,
  ACHIEVEMENT_DARK_WINS,
  ACHIEVEMENT_DIFFERENT_PLAYER_COUNT,
  ACHIEVEMENT_ALL_STANDARD_ROLES,
  ACHIEVEMENT_ASSASSIN_KILLS,
  ACHIEVEMENT_BODYGUARD,
  ACHIEVEMENT_UNDERCOVER_AGENT,
  ACHIEVEMENT_USELESS_ROLE,
  ACHIEVEMENT_DETECTIVE,
  ACHIEVEMENT_WRONG_CHOICE,
  ACHIEVEMENT_SEER,
  ACHIEVEMENT_MISTAKES_HAPPEN,
  ACHIEVEMENT_SERIAL_KILLER,
  ACHIEVEMENT_SECRET_HUNTER,
  ACHIEVEMENT_TOP_PLAYER,
  ACHIEVEMENT_STILL_WORTHY,
  evilRolesImportance,
  goodRolesImportance,
  STANDARD_ROLES,
} from '@avalon/types';
import { eventBus } from '@/helpers';

/**
 * Класс для обработки игровых событий и обновления достижений
 */
export class AchievementHandlers {
  private achievementService: AchievementService;

  constructor(achievementService: AchievementService) {
    this.achievementService = achievementService;
    eventBus.on('playerReachTop1', (playerID) => this.processEvents('top1', playerID));
    eventBus.on('playerRevealSecret', (playerID) => this.processEvents('secret', playerID));
  }

  /**
   * Обработчик завершения игры
   */
  async handleGameEnd(game: VisualGameState): Promise<void> {
    try {
      const players = game.players;

      // Определяем победившую сторону
      const winnerTeam = game.result?.winner;

      if (!winnerTeam) {
        return;
      }

      // Обрабатываем достижения для каждого игрока
      for (const player of players) {
        try {
          // Определяем лояльность игрока
          const playerLoyalty = Object.keys(evilRolesImportance).includes(player.role) ? 'evil' : 'good';

          // Определяем, является ли игрок победителем
          const isWinner = playerLoyalty === winnerTeam;

          // Обрабатываем базовые достижения
          await this.processBasicAchievements(player.id, isWinner, playerLoyalty, game.players.length);

          // Обрабатываем сложные достижения
          await this.processComplexAchievements(player.id, game, isWinner);
        } catch (error) {
          console.error(`Error processing achievements for player ${player.id}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing achievements for game ${game.uuid}:`, error);
    }
  }

  private async processEvents(type: 'top1' | 'secret', playerID: string): Promise<void> {
    await this.achievementService.updateAchievementProgress(
      playerID,
      type === 'secret' ? ACHIEVEMENT_SECRET_HUNTER : ACHIEVEMENT_TOP_PLAYER,
    );
  }

  /**
   * Обработка базовых достижений
   */
  private async processBasicAchievements(
    playerID: string,
    isWinner: boolean,
    playerLoyalty: TLoyalty,
    playerCount: number,
  ): Promise<void> {
    // Достижение за победы на стороне света
    if (isWinner && playerLoyalty === 'good') {
      await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_LIGHT_WINS);
    }

    // Достижение за победы на стороне тьмы
    if (isWinner && playerLoyalty === 'evil') {
      await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_DARK_WINS);
    }

    // Достижение за победы в играх с разным количеством игроков
    if (isWinner) {
      await this.achievementService.updateAchievementProgress(
        playerID,
        ACHIEVEMENT_DIFFERENT_PLAYER_COUNT,
        playerCount,
      );
    }
  }

  /**
   * Обработка сложных достижений
   */
  private async processComplexAchievements(playerID: string, game: VisualGameState, isWinner: boolean): Promise<void> {
    // Найдем игрока в игре
    const player = game.players.find((p) => p.id === playerID);

    if (!player) {
      return;
    }

    // Обработка достижения "Выиграть за все стандартные роли"
    // Обновляем прогресс только если игрок победил
    if (isWinner && STANDARD_ROLES.includes(player.role)) {
      await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_ALL_STANDARD_ROLES, player.role);
    }

    // Обработка достижения "Охотник на волшебников"
    // Выдается, когда ассасин успешно убивает Мерлина
    if (player.features.isAssassin && game.result?.reason === 'killMerlin') {
      await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_ASSASSIN_KILLS);
    }

    // Обработка достижения "Телохранитель"
    // Выдается, когда игрок с ролью 'percival' был убит вместо Мерлина
    if (player.role === 'percival') {
      const assassinateHistory = game.history.find(
        (history): history is HistoryAssassinate =>
          history.type === 'assassinate' &&
          history.assassinateType === 'merlin' &&
          history.killedIDs.includes(playerID),
      );

      if (assassinateHistory) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_BODYGUARD);
      }
    }

    // Обработка достижения "Бесполезная роль"
    // Выдается, когда игрок с ролью 'cleric' является лидером первого похода, который был одобрен
    if (player.role === 'cleric') {
      // Ищем в истории игры первое успешное голосование
      const firstApproveVote = game.history.find(
        (history): history is HistoryVote => history.type === 'vote' && history.result === 'approve',
      );

      if (firstApproveVote && firstApproveVote.leaderID === playerID) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_USELESS_ROLE);
      }
    }

    // Обработка достижения "Агент под прикрытием"
    // Выдается, когда игрок с ролью 'merlin' дважды взял моргану в команду и выйграл игру
    if (player.role === 'merlin') {
      const playerVotes = game.history.filter(
        (history): history is HistoryVote => history.type === 'vote' && history.leaderID === playerID,
      );

      const morganaID = game.players.find((player) => player.role === 'morgana')?.id;

      if (playerVotes.filter((el) => el.team.some((member) => member.id === morganaID)).length >= 2 && isWinner) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_UNDERCOVER_AGENT);
      }
    }

    // Обработка достижения "Сыщик"
    // Выдается, когда игрок с ролью 'merlin' проверил роль 'mordred'
    if (player.role === 'merlin') {
      const playerChecks = game.history.filter(
        (history): history is CheckLoyalty => history.type === 'checkLoyalty' && history.validatorID === playerID,
      );

      const mordredID = game.players.find((player) => player.role === 'mordred')?.id;

      if (playerChecks.some((el) => el.inspectedID === mordredID)) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_DETECTIVE);
      }
    }

    // Обработка достижения "Неправильный выбор"
    // Выдается, когда игрок с ролью 'morgana' попадает в три провальных похода
    if (player.role === 'morgana') {
      const morganaMissions = game.history.filter(
        (history): history is HistoryMission =>
          history.type === 'mission' &&
          history.result === 'fail' &&
          history.actions.some((action) => action.playerID === playerID),
      );

      if (morganaMissions.length >= 3) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_WRONG_CHOICE);
      }
    }

    // Обработка достижения "Провидец"
    // Выдается, когда игрок с ролью 'servant' собрал все походы без мафий
    if (player.role === 'servant') {
      const playerVotes = game.history.filter(
        (history): history is HistoryVote => history.type === 'vote' && history.leaderID === playerID,
      );

      const evilIDs = game.players
        .filter((player) => Object.keys(evilRolesImportance).includes(player.role))
        .map((player) => player.id);
      // В играх до 6 человек 3 похода, в играх 6+ 2 похода
      const enoughElements = game.players.length > 6 ? 2 : 3;

      if (
        playerVotes.length >= enoughElements &&
        playerVotes.every((vote) => vote.team.every((member) => !evilIDs.includes(member.id)))
      ) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_SEER);
      }
    }

    // Обработка достижения "Ошибки случаются"
    // Выдается, когда все игроки сил тьмы нажали fail в миссии
    if (Object.keys(evilRolesImportance).includes(player.role)) {
      const evilPlayersIDs = game.players
        .filter((el) => Object.keys(evilRolesImportance).includes(el.role))
        .map((el) => el.id);

      const missions = game.history.filter(
        (history): history is HistoryMission =>
          history.type === 'mission' &&
          evilPlayersIDs.every((id) =>
            history.actions.some((action) => action.playerID === id && 'value' in action && action.value === 'fail'),
          ),
      );

      if (missions.length > 0) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_MISTAKES_HAPPEN);
      }
    }

    // Обработка достижения "Серийный убийца"
    // Выдается, когда игрок убил мерлина/клирика/любовников
    if (
      player.features.isAssassin &&
      game.result?.reason &&
      ['killMerlin', 'killLovers', 'killCleric'].includes(game.result.reason)
    ) {
      await this.achievementService.updateAchievementProgress(
        playerID,
        ACHIEVEMENT_SERIAL_KILLER,
        game.result.reason.slice(4),
      );
    }

    // Обработка достижения "Все еще достоин"
    // Выдается, когда игрок будучи мирным использовал экскалибур и выйграл игру
    if (Object.keys(goodRolesImportance).includes(player.role) && isWinner) {
      const mission = game.history.find(
        (history): history is HistoryMission =>
          history.type === 'mission' &&
          history.index === 4 &&
          history.actions.some((action) => action.switchedBy === playerID),
      );

      if (mission) {
        await this.achievementService.updateAchievementProgress(playerID, ACHIEVEMENT_STILL_WORTHY);
      }
    }
  }
}
