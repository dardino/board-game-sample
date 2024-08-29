import { MatchMakingService } from "../games/matchmaking.service";

export class GameService {

  // #region service come SINGLETON
  static #instance: GameService | null;

  private static get instance () {
    if (GameService.#instance == null) throw new Error("GameService not initialized");
    return GameService.#instance!;
  }
  // #endregion service come SINGLETON

  public static async Initialize (GameId: number) {
    GameService.#instance = new GameService(GameId);
  }

  public static ConnectToGame = () => GameService.instance.#connectToGame();

  static get GameId () {
    return GameService.instance.GameId;
  }

  constructor (public readonly GameId: number) {

  }

  async #connectToGame () {
    await MatchMakingService.joinGame(this.GameId);
    return this.GameId;
  }

}
