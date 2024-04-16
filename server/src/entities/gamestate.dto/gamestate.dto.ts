import { PlayerDto } from '../player.dto/player.dto';

export class GamestateDto {
  static startNewGame(players: PlayerDto[]): GamestateDto | null {
    const newGameState = new GamestateDto();
    newGameState.currentPlayers = players;
    return newGameState;
  }

  public currentPlayers: PlayerDto[];
}
