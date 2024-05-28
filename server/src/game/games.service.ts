import { Injectable } from '@nestjs/common';
import { GameDto } from 'src/entities/game.dto/game.dto';
import { GAME_MESSAGES } from 'src/entities/game.dto/game.messages';
import { hasNickname } from 'src/entities/player.dto/player.dto.utils';
import { GameJoinException } from 'src/errors/gameJoin';
import { PlayersService } from 'src/players/players.service';
import { replacePlaceholders } from 'src/tools/replacePlaceholders';

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
      (game) => game.connectedPlayers.length < game.numberOfPlayers,
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
        replacePlaceholders(GAME_MESSAGES, 'GAME_NOT_FOUND', {}),
      );
    }

    if (game.startedAt != null) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, 'GAME_ALREDY_STARTED', {}),
      );
    }

    if (game.connectedPlayers.some(hasNickname(nickname))) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, 'PLAYER_ALREDY_IN_GAME', {
          playername: nickname,
        }),
      );
    }

    if (game.connectedPlayers.length >= game.numberOfPlayers) {
      throw new GameJoinException(
        replacePlaceholders(GAME_MESSAGES, 'GAME_IS_FULL', {}),
      );
    }

    game.connectedPlayers.push(player);
    player.isPlaying = true;

    return replacePlaceholders(GAME_MESSAGES, 'PLAYER_JOINED', {
      playername: player.nickname,
    });
  }

  async createNewGame(nickname: string, gameTitle: string) {
    const player = await this.playersService.getPlayer(nickname);
    const newGame = await GameDto.createGame(gameTitle, player);
    return newGame;
  }
}
