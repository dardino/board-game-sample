import { Injectable, NotFoundException } from "@nestjs/common";
import { GameDto } from "src/entities/game.dto/game.dto";
import { GAME_MESSAGES } from "src/entities/game.dto/game.messages";
import { hasNickname } from "src/entities/player.dto/player.dto.utils";
import { GameJoinException } from "src/errors/gameJoin";
import { PlayersService } from "src/players/players.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";

@Injectable()
export class GamesServices {
  #allGames: GameDto[] = [];

  /**
   *
   */
  constructor(private readonly playersService: PlayersService) {}

  async getList(): Promise<GameDto[]> {
    return this.#allGames;
  }

  protected setGames(games: GameDto[]) {
    this.#allGames = games;
  }

  /**
   * Retrieves the list of free games.
   * A game is considered free if the number of connected players is less than the total number of players.
   * @returns An array of free games.
   */
  async getFreeGames() {
    return this.#allGames.filter(
      (game) => game.connectedPlayers.length < game.maxPlayers,
    );
  }

  /**
   * Retrieves the games in which the specified nickname is connected.
   *
   * @param nickname - The nickname of the player.
   * @returns An array of games in which the player is connected.
   */
  async getGamesIAmConnectedIn(nickname: string) {
    return this.#allGames.filter((game) =>
      game.connectedPlayers.some(hasNickname(nickname)),
    );
  }

  async gameById(gameId: GameDto["gameId"]) {
    return this.#allGames.find((game) => game.gameId === gameId);
  }

  /**
   * Joins a player to a game.
   *
   * @param nickname - The nickname of the player.
   * @param gameId - The ID of the game.
   * @returns A string indicating the result of the operation.
   * @throws {GameJoinException} If the game is not found, player is not found, player is already connected to the game, the game is full or already started.
   */
  async joinToGame(nickname: string, gameId: number) {
    const player = await this.playersService.getPlayer(nickname);
    const game = this.#allGames.find((game) => game.gameId === gameId);
    if (!game) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, "GAME_NOT_FOUND", {}),
      );
    }

    if (game.startedAt != null) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, "GAME_ALREDY_STARTED", {}),
      );
    }

    if (game.connectedPlayers.some(hasNickname(nickname))) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, "PLAYER_ALREDY_IN_GAME", {
          playername: nickname,
        }),
      );
    }

    if (game.connectedPlayers.length >= game.maxPlayers) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, "GAME_IS_FULL", {}),
      );
    }

    game.connectedPlayers.push(player);
    player.isPlaying = true;

    return replacePlaceholders(GAME_MESSAGES, "PLAYER_JOINED", {
      playername: player.nickname,
    });
  }

  /**
   * Crea una istanza di partita
   * @param nickname nikname del creatore della partita
   * @param gameTitle titolo della partita
   * @returns istanza del gioco creato
   */
  async createNewGame(nickname: string, gameTitle: string) {
    const player = await this.playersService.getPlayer(nickname);
    const newGame = await GameDto.createGame(gameTitle, player);
    return newGame;
  }

  /**
   * Restituisce un oggetto contenente le informazioni utili ad un giocatore per collegarsi ad una partita
   * @param gameId identificativo della partita
   * @returns un oggetto con le informazioni sulla partita
   */
  async getGameStats(gameId: GameDto["gameId"]): Promise<{
    playersMax: number;
    playersMin: number;
    joinedPlayers: number;
    elapesd: number | null;
  }> {
    const game = await this.gameById(gameId);
    if (!game) {
      throw new NotFoundException("Game not found");
    }
    return {
      elapesd: game.startedAt ? Date.now() - game.startedAt.valueOf() : null,
      joinedPlayers: game.connectedPlayers.length,
      playersMax: game.maxPlayers,
      playersMin: 2,
    };
  }
}
