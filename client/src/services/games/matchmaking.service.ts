import { MatchMakingProxy } from "../../api/resources/matchmaking.proxy";
import { Registration } from "../registration/registration.service";

export class MatchMakingService {

  public static createGame: MatchMakingService["createGame"] = (...args) => new MatchMakingService().createGame(...args);

  public static joinGame: MatchMakingService["joinGame"] = (...args) => new MatchMakingService().joinGame(...args);

  public static getGames: MatchMakingService["getGames"] = () => new MatchMakingService().getGames();

  private async joinGame (gameId: number) {
    try {
      return await MatchMakingProxy.joinGame(gameId, Registration.NickName);
    } catch {
      return null;
    }
  }

  private async getGames () {
    try {
      return await MatchMakingProxy.getGames();
    } catch {
      return null;
    }
  }

  private async createGame (title: string) {
    return await MatchMakingProxy.createGame(title, Registration.NickName);
  }

}
