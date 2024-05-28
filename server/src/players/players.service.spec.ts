/**
 * @fileoverview Unit tests for the PlayersService class.
 * FILEPATH: /home/gbrunori/dev/gitHub/board-game-sample/server/src/players/players.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';

/**
 * Test suite for the PlayersService class.
 */
describe('PlayersService', () => {
  let service: PlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayersService],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  /**
   * Test case: should check if the service is defined.
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Test suite for the getAllPlayers method.
   */
  describe('getAllPlayers', () => {
    /**
     * Test case: should return an empty array.
     */
    it('should return an empty array', async () => {
      const playerList = service.getAllPlayers();
      expect(playerList).toBeInstanceOf(Array);
      expect(playerList.length).toEqual(0);
    });
  });

  /**
   * Test suite for the addPlayer method.
   */
  describe('addPlayer', () => {
    /**
     * Test case: should add a player and return it.
     * The addPlayer method is called with 'testPlayer' as an argument.
     * We expect the returned player's id to be 0 (assuming this is the first player added and ids start from 0).
     */
    it('should add a player and return it', async () => {
      const result = await service.addPlayer('testPlayer');
      expect(result.id).toBe(0);
    });

    /**
     * Test case: should throw an error if a player with the same nickname already exists.
     * The addPlayer method is called twice with the same argument 'testPlayer'.
     * We expect the second call to throw an error because a player with the same nickname already exists.
     */
    it('should throw an error if a player with the same nickname already exists', async () => {
      await service.addPlayer('testPlayer');
      await expect(service.addPlayer('testPlayer')).rejects.toThrow();
    });

    /**
     * Test case: should verify that the newly added player is actually in the list, has the correct nickname, and is not playing.
     * The addPlayer method is called with 'testPlayer' as an argument.
     * Then, we use the getPlayer method to get the newly added player.
     * We expect the player's nickname to be 'testPlayer' and the player not to be playing.
     */
    it('should verify that the newly added player is in the list, has the correct nickname, and is not playing', async () => {
      await service.addPlayer('testPlayer');
      const player = await service.getPlayer('testPlayer');
      expect(player.nickname).toBe('testPlayer');
      expect(player.isPlaying).toBe(false);
    });

    /**
     * Test case: should verify that the total number of players is increased by 1 when a new player is added.
     * Before adding a new player, we get the total number of players.
     * Then, we add a new player and get the total number of players again.
     * We expect the total number of players after adding the new player to be equal to the total number of players before the addition plus 1.
     */
    it('should verify that the total number of players is increased by 1 when a new player is added', async () => {
      const initialPlayerCount = await service.getTotalPlayers();
      await service.addPlayer('testPlayer');
      const finalPlayerCount = await service.getTotalPlayers();
      expect(finalPlayerCount).toBe(initialPlayerCount + 1);
    });
  });

  /**
   * Test suite for the getPlayer method.
   */
  describe('getPlayer', () => {
    /**
     * Test case: should return the player with the correct nickname.
     */
    it('should return the player with the correct nickname', async () => {
      // Arrange
      const nickname = 'testPlayer';
      const player = await service.addPlayer(nickname);

      // Act
      const result = await service.getPlayer(nickname);

      // Assert
      expect(result).toEqual(player);
    });

    /**
     * Test case: should throw an error if the player with the given nickname does not exist.
     */
    it('should throw an error if the player with the given nickname does not exist', async () => {
      // Arrange
      const nickname = 'nonExistingPlayer';
      service.clearPlayers();

      // Act and Assert
      await expect(service.getPlayer(nickname)).rejects.toThrow(
        `Non esiste un giocatore con il nickname ${nickname}`,
      );
    });
  });

  /**
   * Test suite for the clearPlayers method.
   */
  describe('clearPlayers', () => {
    /**
     * Test case: should verify that the player list is properly cleared by the 'clearPlayers' method.
     * Before calling the 'clearPlayers' method, we add a new player.
     * Then, we call the 'clearPlayers' method and get the total number of players.
     * We expect the total number of players after calling the 'clearPlayers' method to be 0.
     */
    it('should verify that the player list is properly cleared by the "clearPlayers" method', async () => {
      await service.addPlayer('testPlayer');
      service.clearPlayers();
      const totalPlayers = await service.getTotalPlayers();
      expect(totalPlayers).toBe(0);
    });
  });

  /**
   * Test suite for the removePlayer method.
   */
  describe('removePlayer', () => {
    /**
     * Test case: should remove the player with the given nickname.
     */
    it('should remove the player with the given nickname', async () => {
      // Arrange
      const nickname = 'testPlayer';
      await service.addPlayer(nickname);

      // Act
      await service.removePlayer(nickname);

      // Assert
      expect(service.getPlayer(nickname)).rejects.toThrow(
        `Non esiste un giocatore con il nickname ${nickname}`,
      );
    });

    /**
     * Test case: should throw an error if the player with the given nickname does not exist.
     */
    it('should throw an error if the player with the given nickname does not exist', async () => {
      // Arrange
      const nickname = 'nonExistingPlayer';

      // Act and Assert
      expect(service.removePlayer(nickname)).rejects.toThrow(
        `Non esiste un giocatore con il nickname ${nickname}`,
      );
    });
  });
});
