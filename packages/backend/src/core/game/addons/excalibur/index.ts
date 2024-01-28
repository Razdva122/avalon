import { IGameAddon } from '@/core/game/addons/interface';
import { Game } from '@/core/game';
import { TGameStage } from '@avalon/types';

export class ExcaliburAddon implements IGameAddon {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  afterInitialization() {
    // On check loyalty user with lady of lake can select players
    this.game.selectAvailable.giveExcalibur = (player) => Boolean(player.features.isLeader);

    return true;
  }

  afterSelectTeam(nextStage: TGameStage) {
    if (nextStage === 'giveExcalibur') {
      return true;
    }

    this.game.leader.features.waitForAction = true;
    this.game.updateStage('giveExcalibur');

    return false;
  }

  afterOnMission() {
    this.game.updateStage('useExcalibur');

    return false;
  }

  giveExcalibur(executorID: string) {
    if (this.game.stage !== 'giveExcalibur') {
      throw new Error(`You cant give excalibur on stage ${this.game.stage}`);
    }

    if (this.game.leader.user.id !== executorID) {
      throw new Error('Only leader can give excalibur');
    }

    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can get excalibur');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    if (selectedPlayer === this.game.leader) {
      throw new Error('You cant give excalibur to your self');
    }

    selectedPlayer.features.excalibur = true;

    this.game.sentTeamNextStage();
    this.game.stateObserver.gameStateChanged();
  }

  useExcalibur(executorID: string) {
    if (this.game.stage !== 'useExcalibur') {
      throw new Error(`You cant give excalibur on stage ${this.game.stage}`);
    }

    const ownerOfExcalibur = this.game.players.find((player) => player.features.excalibur)!;

    if (ownerOfExcalibur.user.id !== executorID) {
      throw new Error('Only owner of excalibur can use it');
    }

    if (this.game.selectedPlayers.length > 1) {
      throw new Error('Excalibur can be used only on one player');
    }

    const selectedPlayer = this.game.selectedPlayers[0];

    if (selectedPlayer) {
      const mission = this.game.currentMission;

      const action = mission.data.actions.find((action) => action.player === selectedPlayer);

      if (!action) {
        throw new Error('You cant use excalibur on player not on a mission');
      }

      action.value = action.value === 'fail' ? 'success' : 'fail';
      mission.finishMission();
    }
  }
}
