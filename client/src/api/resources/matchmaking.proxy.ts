import { GameDto } from "@dto/matchmaking/game.dto";
import { BaseProxy } from "../baseProxy";

export class MatchMakingProxy extends BaseProxy {

  /**
   * returns all game data
   * @param args
   * @returns
   */
  public static getGame: MatchMakingProxy["getGame"] = (...args) => new MatchMakingProxy().getGame(...args);

  /**
   * Joins a game.
   * @returns
   */
  public static joinGame: MatchMakingProxy["joinGame"] = (...args) => new MatchMakingProxy().joinGame(...args);

  /**
   * Create a game.
   * @returns
   */
  public static createGame: MatchMakingProxy["createGame"] = (...args) => new MatchMakingProxy().createGame(...args);

  /**
   * Retrieves the information of the current player.
   * @returns A Promise that resolves to a PlayerDto object representing the current player, or null if the player is not found.
   */
  public static getGames: MatchMakingProxy["getGames"] = () => new MatchMakingProxy().getGames();

  /**
   * Creates an instance of MatchMakingProxy.
   *
   * Calls the constructor of the base class (BaseProxy) with the path "mm".
   * @constructor
   */
  private constructor () {
    super("mm");
  }


  private async getGames () {
    return await this.get<GameDto[], "games">("games");
  }

  private async getGame (gameId: number) {
    return await this.get<GameDto, "game/:gameId">("game/:gameId", { gameId: gameId.toString() });
  }

  public async joinGame (gameId: number, nickName: string) {
    return await this.post<string, "join", { gameId: number; nickName: string }>("join", { gameId, nickName });
  }

  private async createGame (gameTitle: string, nickName: string) {
    return await this.post<number, "game", { nickName: string; gameTitle: string }>("game", { nickName, gameTitle });
  }

}
