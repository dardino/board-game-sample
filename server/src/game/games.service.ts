import { Injectable } from '@nestjs/common';
import { GameDto } from 'src/entities/game.dto/game.dto';
import { hasNickname } from 'src/entities/player.dto/player.dto.utils';
import { GameJoinException } from 'src/errors/gameJoin';
import { PlayersService } from 'src/players/players.service';

@Injectable()
export class GamesServices {
  #allGames: GameDto[];

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
    const game = this.#allGames.find((game) => game.gameId === gameId);
    if (!game) {
      throw new GameJoinException('Game not found');
    }

    const player = await this.playersService.getPlayer(nickname);
    if (!player) {
      return new GameJoinException('Player not found');
    }

    if (game.connectedPlayers.some(hasNickname(nickname))) {
      return new GameJoinException('Player is already connected to this game');
    }

    if (game.connectedPlayers.length >= game.numberOfPlayers) {
      return new GameJoinException('Game is full');
    }

    if (game.startedAt != null) {
      return new GameJoinException('Game already started');
    }

    game.connectedPlayers.push(player);

    return 'Player successfully connected';
  }

  async createNewGame(nickname: string, gameTitle: string) {
    const player = await this.playersService.getPlayer(nickname);
    const newGame = await GameDto.createGame(gameTitle, player);
    return newGame;
  }
}
