import { getTimeStampFromNow, toMilliseconds } from "src/tools/timingHelpers";
import { PlayerDto } from "../player.dto/player.dto";

export class GamestateDto {
  static #maxTurnDuration = toMilliseconds("s", 30);

  static startNewGame(players: PlayerDto[]): GamestateDto | null {
    const newGameState = new GamestateDto();
    newGameState.#currentPlayers = players;
    newGameState.#nextTournDeadline = getTimeStampFromNow(
      this.#maxTurnDuration,
    );
    return newGameState;
  }

  #currentPlayers: PlayerDto[] = [];
  #turnPlayerIndex: number = 0;
  #nextTournDeadline: string = "";

  public get playerList(): readonly Readonly<PlayerDto>[] {
    return this.#currentPlayers;
  }

  public get turnPlayer(): Readonly<PlayerDto> {
    return this.#currentPlayers[this.#turnPlayerIndex] as Readonly<PlayerDto>;
  }

  public get nextTournDeadline() {
    return this.#nextTournDeadline;
  }
}
