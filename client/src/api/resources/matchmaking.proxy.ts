import { BaseProxy } from "../baseProxy";

export class MatchMakingProxy extends BaseProxy {

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
    return await this.get<Games[] | null, "games">("games");
  }

}
