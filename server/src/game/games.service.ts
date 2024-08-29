import { GAME_MESSAGES } from "@models/game.model/game.messages";
import { GameModel } from "@models/game.model/game.model";
import { Injectable } from "@nestjs/common";
import { GameJoinException } from "src/errors/gameJoin";
import { GameStartException } from "src/errors/gameStart";
import { GameOneRuleService } from "src/gameone/rule-manager/rule-manager.service";
import { PlayersService } from "src/players/players.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";
import { hasNickname } from "src/utils/player.dto.utils";

@Injectable()
export class GamesServices {

  #allGames: GameModel[] = [];

  /**
   *
   */
  constructor (
    private readonly playersService: PlayersService,
    private readonly ruleManagerService: GameOneRuleService,
  ) {
    //
  }

  async getList (): Promise<GameModel[]> {
    return this.#allGames;
  }

  protected setGames (games: GameModel[]) {
    this.#allGames = games;
  }

  /**
   * Retrieves the list of free games.
   * A game is considered free if the number of connected players is less than the total number of players.
   * @returns An array of free games.
   */
  async getFreeGames () {
    return this.#allGames.filter((game) => game.connectedPlayers.length < game.maxPlayers);
  }

  /**
   * Retrieves the games in which the specified nickname is connected.
   *
   * @param nickname - The nickname of the player.
   * @returns An array of games in which the player is connected.
   */
  async getGamesIAmConnectedIn (nickname: string) {
    return this.#allGames.filter((game) => game.connectedPlayers.some(hasNickname(nickname)));
  }

  async gameById (gameId: GameModel["gameId"]) {
    const game = this.#allGames.find((game) => game.gameId === gameId);
    if (!game) {
      throw new GameJoinException({ message: replacePlaceholders(GAME_MESSAGES, "GAME_NOT_FOUND", { gameIdString: gameId.toString() }), internalCode: 1001, gameId });
    } else {
      return game;
    }
  }

  /**
   * Joins a player to a game.
   *
   * @param nickname - The nickname of the player.
   * @param gameId - The ID of the game.
   * @returns A string indicating the result of the operation.
   * @throws {GameJoinException} If the game is not found, player is not found, player is already connected to the game, the game is full or already started.
   */
  async joinToGame (nickname: string, gameId: number) {
    const player = await this.playersService.getPlayer(nickname);
    const game = this.#allGames.find((game) => game.gameId === gameId);
    const gameIdString = gameId.toString();
    if (!game) {
      throw new GameJoinException({ message: replacePlaceholders(GAME_MESSAGES, "GAME_NOT_FOUND", { gameIdString }), internalCode: 1001, gameId });
    }

    if (game.startedAt != null) {
      throw new GameJoinException({ message: replacePlaceholders(GAME_MESSAGES, "GAME_ALREDY_STARTED", { gameIdString }), internalCode: 1002, gameId });
    }

    if (game.connectedPlayers.some(hasNickname(nickname))) {
      throw new GameJoinException({ message: replacePlaceholders(GAME_MESSAGES, "PLAYER_ALREDY_IN_GAME", { playername: nickname }), internalCode: 1003, gameId });
    }

    if (game.connectedPlayers.length >= game.maxPlayers) {
      throw new GameJoinException({ message: replacePlaceholders(GAME_MESSAGES, "GAME_IS_FULL", {}), internalCode: 1004, gameId });
    }

    this.ruleManagerService.addPlayer(
      game,
      player,
    );
    player.isPlaying = true;

    return replacePlaceholders(GAME_MESSAGES, "PLAYER_JOINED", { playername: player.nickname });
  }

  /**
   * Start a game if game is ready to go.
   *
   * @param nickname - The nickname of the player.
   * @param gameId - The ID of the game.
   * @returns A date indicating the starting time.
   * @throws {GameStartException} If the game is not found, player is not found, player is already connected to the game, the game is full or already started.
   */
  async startGame (nickname: string, gameId: number) {
    const game = this.#allGames.find((game) => game.gameId === gameId);
    const gameIdString = gameId.toString();
    if (!game) {
      throw new GameStartException(replacePlaceholders(GAME_MESSAGES, "GAME_NOT_FOUND", { gameIdString }), 2001);
    }

    if (game.connectedPlayers.length < game.minPlayersToStart) {
      throw new GameStartException(replacePlaceholders(GAME_MESSAGES, "GAME_IS_NOT_FULL", { }), 2002);
    }

    if (game.startedAt != null) {
      throw new GameStartException(replacePlaceholders(GAME_MESSAGES, "GAME_ALREDY_STARTED", { }), 2003);
    }

    if (game.connectedPlayers[0].nickname !== nickname) {
      throw new GameStartException(replacePlaceholders(GAME_MESSAGES, "YOU_ARE_NOT_THE_GAME_OWNER", { }), 2004);
    }

    this.ruleManagerService.start(game);
  }

  /**
   * Crea una istanza di partita
   * @param nickname nikname del creatore della partita
   * @param gameTitle titolo della partita
   * @returns istanza del gioco creato
   */
  async createNewGame (nickname: string, gameTitle: string) {
    const player = await this.playersService.getPlayer(nickname);
    const newGame = await GameModel.createGame(
      gameTitle,
      player,
    );
    this.#allGames.push(newGame);
    return newGame;
  }

  /**
   * Restituisce un oggetto contenente le informazioni utili ad un giocatore per collegarsi ad una partita
   * @param gameId identificativo della partita
   * @returns un oggetto con le informazioni sulla partita
   */
  getGameStats (game: GameModel): {
    playersMax: number;
    playersMin: number;
    joinedPlayers: number;
    elapesd: number | null;
    title: string;
  } {
    return {
      elapesd: game.startedAt
        ? Date.now() - game.startedAt.valueOf()
        : null,
      joinedPlayers: game.connectedPlayers.length,
      playersMax: game.maxPlayers,
      playersMin: 2,
      title: game.gameTitle,
    };
  }

}
