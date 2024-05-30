import { GameDto } from "@entities/game.dto/game.dto";
import { GAME_MESSAGES } from "@entities/game.dto/game.messages";
import { Test, TestingModule } from "@nestjs/testing";
import { PLAYERS_MESSAGES } from "src/players/players.messages";
import { PlayersService } from "src/players/players.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";
import { GamesServices } from "./games.service";

class GamesServicesSubclass extends GamesServices {
  prepare(games: GameDto[]) {
    this.setGames(games);
  }
}

describe("GamesService", () => {
  let service: GamesServicesSubclass;
  let playerSvc: PlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesServicesSubclass, PlayersService],
    }).compile();

    service = module.get<GamesServicesSubclass>(GamesServicesSubclass);
    playerSvc = module.get<PlayersService>(PlayersService);
  });

  describe("getGamesIAmConnectedIn", () => {
    it("should return an array of games where the player is connected", async () => {
      // Arrange
      const nickname = "testPlayer";
      const game1: GameDto = await GameDto.createGame("test 1", {
        id: 1,
        isPlaying: true,
        nickname: "testPlayer",
      });
      const game2: GameDto = await GameDto.createGame("test 2", {
        id: 2,
        isPlaying: true,
        nickname: "testPlayer",
      });
      const game3: GameDto = await GameDto.createGame("test 3", {
        id: 3,
        isPlaying: true,
        nickname: "anotherPlayer",
      });
      service.prepare([game1, game2, game3]);

      // Act
      const result = await service.getGamesIAmConnectedIn(nickname);

      // Assert
      expect(result).toEqual([game1, game2]);
    });

    it("should return an empty array if the player is not connected in any game", async () => {
      // Arrange
      const nickname = "testPlayer";
      const game1: GameDto = await GameDto.createGame("test 1", {
        id: 1,
        isPlaying: true,
        nickname: "ciccio",
      });
      const game2: GameDto = await GameDto.createGame("test 2", {
        id: 2,
        isPlaying: true,
        nickname: "otherPlayer",
      });
      service.prepare([game1, game2]);

      // Act
      const result = await service.getGamesIAmConnectedIn(nickname);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("joinToGame", () => {
    it("should throw GameJoinException if game is not found", async () => {
      // Arrange
      const nickname = "testPlayer";
      const gameId = 1;
      await playerSvc.addPlayer(nickname);

      // Act & Assert
      await expect(service.joinToGame(nickname, gameId)).rejects.toThrow(
        GAME_MESSAGES.GAME_NOT_FOUND,
      );
    });

    it("should throw GameJoinException if player is not found", async () => {
      // Arrange
      const nickname = "nonExistingPlayer";
      const palyerId = 1;
      const game: GameDto = await GameDto.createGame("test 1", {
        id: palyerId,
        isPlaying: true,
        nickname: "Gabriele",
      });
      service.prepare([game]);

      // Act & Assert
      await expect(service.joinToGame(nickname, game.gameId)).rejects.toThrow(
        replacePlaceholders(PLAYERS_MESSAGES, "PLAYER_NOT_FOUND", { nickname }),
      );
    });

    it("should throw GameJoinException if player is already connected to the game", async () => {
      // Arrange
      const nickname = "testPlayer";

      await playerSvc.addPlayer(nickname);
      await playerSvc.addPlayer("creator");

      const creator = await playerSvc.getPlayer("creator");
      const player2 = await playerSvc.getPlayer(nickname);

      const game: GameDto = await GameDto.createGame("test 1", creator);
      service.prepare([game]);
      game.connectedPlayers.push(player2);

      const errMessage = replacePlaceholders(
        GAME_MESSAGES,
        "PLAYER_ALREDY_IN_GAME",
        {
          playername: nickname,
        },
      );

      // Act & Assert
      await expect(service.joinToGame(nickname, game.gameId)).rejects.toThrow(
        errMessage,
      );
    });

    it("should throw GameJoinException if the game is full", async () => {
      // Arrange
      await playerSvc.addPlayer("creator");
      await playerSvc.addPlayer("test 2");
      await playerSvc.addPlayer("test 3");

      const creator = await playerSvc.getPlayer("creator");
      const testPlayer1 = await playerSvc.getPlayer("test 2");
      const testPlayer2 = await playerSvc.getPlayer("test 3");

      const game: GameDto = await GameDto.createGame("test 1", creator);
      game.numberOfPlayers = 2;
      game.connectedPlayers.push(testPlayer1);
      service.prepare([game]);

      const errMessage = replacePlaceholders(GAME_MESSAGES, "GAME_IS_FULL", {});
      // Act & Assert
      await expect(
        service.joinToGame(testPlayer2.nickname, game.gameId),
      ).rejects.toThrow(errMessage);
    });

    it("should throw GameJoinException if the game has already started", async () => {
      // Arrange
      await playerSvc.addPlayer("creator");
      await playerSvc.addPlayer("test 2");
      await playerSvc.addPlayer("test 3");

      const creator = await playerSvc.getPlayer("creator");
      const testPlayer1 = await playerSvc.getPlayer("test 2");
      const testPlayer2 = await playerSvc.getPlayer("test 3");

      const game: GameDto = await GameDto.createGame("test 1", creator);
      game.numberOfPlayers = 2;
      game.connectedPlayers.push(testPlayer1);
      game.startedAt = new Date();

      service.prepare([game]);

      const errMessage = replacePlaceholders(
        GAME_MESSAGES,
        "GAME_ALREDY_STARTED",
        {},
      );

      // Act & Assert
      await expect(
        service.joinToGame(testPlayer2.nickname, game.gameId),
      ).rejects.toThrow(errMessage);
    });

    it('should add the player to the connected players list and return "Player successfully connected"', async () => {
      // Arrange
      await playerSvc.addPlayer("creator");
      await playerSvc.addPlayer("test 2");
      await playerSvc.addPlayer("test 3");

      const creator = await playerSvc.getPlayer("creator");
      const testPlayer1 = await playerSvc.getPlayer("test 2");
      const testPlayer2 = await playerSvc.getPlayer("test 3");

      const game: GameDto = await GameDto.createGame("test 1", creator);
      game.numberOfPlayers = 3;
      game.connectedPlayers.push(testPlayer1);

      service.prepare([game]);

      const successMessage = replacePlaceholders(
        GAME_MESSAGES,
        "PLAYER_JOINED",
        {
          playername: testPlayer2.nickname,
        },
      );

      // Act
      const result = await service.joinToGame(
        testPlayer2.nickname,
        game.gameId,
      );

      // Assert
      expect(result).toBe(successMessage);
      expect(game.connectedPlayers).toContain(testPlayer2);
    });
  });
});
