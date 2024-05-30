import { PlayerDto } from "../player.dto/player.dto";

export class GamestateDto {
  static startNewGame(players: PlayerDto[]): GamestateDto | null {
    const newGameState = new GamestateDto();
    newGameState.currentPlayers = players;
    return newGameState;
  }

  private currentPlayers: PlayerDto[];

  public get playerList(): readonly PlayerDto[] {
    return this.currentPlayers;
  }
}
