import { PlayerDto } from "@dto/player.dto/player.dto";
import { GamestateModel } from "../gamestate.model/gamestate.model";

let gameCounter = 0;

/**
 * Represents a game data transfer object.
 */
export class GameModel {

  public gameId: number;

  public gameTitle: string;

  public minPlayersToStart: number;

  public maxPlayers: number;

  public connectedPlayers: PlayerDto[];

  public createdBy: PlayerDto["nickname"];

  public createdAt: Date;

  public startedAt: Date | null;

  public gameState: GamestateModel | null;

  /**
   * Creates a new game instance with the specified title and creator.
   *
   * @param title - The title of the game.
   * @param creator - The creator of the game.
   * @returns A new instance of the GameModel class.
   */
  static async createGame (title: string, creator: PlayerDto) {

    const newGame = new GameModel();
    newGame.gameTitle = title;
    newGame.gameId = gameCounter++;
    newGame.minPlayersToStart = 2;
    newGame.maxPlayers = 4;
    newGame.gameState = null;
    newGame.connectedPlayers = [creator];
    newGame.createdBy = creator.nickname;
    newGame.createdAt = new Date();
    newGame.startedAt = null;
    creator.isPlaying = true;
    return newGame;

  }

}
