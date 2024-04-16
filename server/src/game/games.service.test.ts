import { Test, TestingModule } from '@nestjs/testing';
import { GameDto } from 'src/entities/game.dto/game.dto';
import { PlayerDto } from 'src/entities/player.dto/player.dto';
import { PlayersService } from 'src/players/players.service';
import { GamesServices } from './games.service';

class GamesServicesSubclass extends GamesServices {
  prepare(games: GameDto[]) {
    this.setGames(games);
  }
}

describe('GamesService', () => {
  let service: GamesServicesSubclass;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesServicesSubclass, PlayersService],
    }).compile();

    service = module.get<GamesServicesSubclass>(GamesServicesSubclass);
  });

  describe('getGamesIAmConnectedIn', () => {
    it('should return an array of games where the player is connected', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const game1: GameDto = await GameDto.createGame('test 1', {
        id: 1,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      const game2: GameDto = await GameDto.createGame('test 2', {
        id: 2,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      const game3: GameDto = await GameDto.createGame('test 3', {
        id: 3,
        isPlaying: true,
        nickname: 'anotherPlayer',
      });
      service.prepare([game1, game2, game3]);

      // Act
      const result = await service.getGamesIAmConnectedIn(nickname);

      // Assert
      expect(result).toEqual([game1, game2]);
    });

    it('should return an empty array if the player is not connected in any game', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const game1: GameDto = await GameDto.createGame('test 1', {
        id: 1,
        isPlaying: true,
        nickname: 'ciccio',
      });
      const game2: GameDto = await GameDto.createGame('test 2', {
        id: 2,
        isPlaying: true,
        nickname: 'otherPlayer',
      });
      service.prepare([game1, game2]);

      // Act
      const result = await service.getGamesIAmConnectedIn(nickname);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('joinToGame', () => {
    it('should throw GameJoinException if game is not found', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const gameId = 1;

      // Act & Assert
      await expect(service.joinToGame(nickname, gameId)).rejects.toThrowError(
        'Game not found',
      );
    });

    it('should throw GameJoinException if player is not found', async () => {
      // Arrange
      const nickname = 'nonExistingPlayer';
      const gameId = 1;
      const game: GameDto = await GameDto.createGame('test 1', {
        id: gameId,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      service.prepare([game]);

      // Act & Assert
      await expect(service.joinToGame(nickname, gameId)).rejects.toThrowError(
        'Player not found',
      );
    });

    it('should throw GameJoinException if player is already connected to the game', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const gameId = 1;
      const game: GameDto = await GameDto.createGame('test 1', {
        id: gameId,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      const player: PlayerDto = { id: 1, nickname, isPlaying: false };
      game.connectedPlayers.push(player);
      service.prepare([game]);

      // Act & Assert
      await expect(
        service.joinToGame(nickname, gameId),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        'Player is already connected to this game',
      );
    });

    it('should throw GameJoinException if the game is full', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const gameId = 1;
      const game: GameDto = await GameDto.createGame('test 1', {
        id: gameId,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      game.numberOfPlayers = 1;
      const player: PlayerDto = { nickname: 'asdf', id: 2, isPlaying: false };
      game.connectedPlayers.push(player);
      service.prepare([game]);

      // Act & Assert
      await expect(service.joinToGame(nickname, gameId)).rejects.toThrowError(
        'Game is full',
      );
    });

    it('should throw GameJoinException if the game has already started', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const gameId = 1;
      const game: GameDto = await GameDto.createGame('test 1', {
        id: gameId,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      service.prepare([game]);

      // Act & Assert
      await expect(service.joinToGame(nickname, gameId)).rejects.toThrowError(
        'Game already started',
      );
    });

    it('should add the player to the connected players list and return "Player successfully connected"', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const gameId = 1;
      const game: GameDto = await GameDto.createGame('test 1', {
        id: gameId,
        isPlaying: true,
        nickname: 'testPlayer',
      });
      const player: PlayerDto = { id: 1, nickname, isPlaying: false };
      service.prepare([game]);

      // Act
      const result = await service.joinToGame(nickname, gameId);

      // Assert
      expect(result).toBe('Player successfully connected');
      expect(game.connectedPlayers).toContain(player);
    });
  });
});
