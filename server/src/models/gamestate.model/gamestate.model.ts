import { PlayerDto } from "@dto/player.dto/player.dto";
import { getTimeStampFromNow, toMilliseconds } from "src/tools/timingHelpers";

export class GamestateModel {

  static #maxTurnDuration = toMilliseconds(
    "s",
    30,
  );

  static startNewGame (players: PlayerDto[]): GamestateModel | null {

    const newGameState = new GamestateModel();
    newGameState.#currentPlayers = players;
    newGameState.#nextTournDeadline = getTimeStampFromNow(this.#maxTurnDuration);
    return newGameState;

  }

  #currentPlayers: PlayerDto[] = [];

  #turnPlayerIndex = 0;

  #nextTournDeadline = "";

  public get playerList (): readonly Readonly<PlayerDto>[] {

    return this.#currentPlayers;

  }

  public get turnPlayer (): Readonly<PlayerDto> {

    return this.#currentPlayers[this.#turnPlayerIndex] as Readonly<PlayerDto>;

  }

  public get nextTournDeadline () {

    return this.#nextTournDeadline;

  }

}
