import { ContextIdFactory, REQUEST } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { GamesServices } from "src/game/games.service";
import { GameOneRuleService } from "src/gameone/rule-manager/rule-manager.service";
import { MeService } from "src/me/me.service";
import { PlayersService } from "src/players/players.service";
import { SystemPlayerService } from "src/system-player/system-player.service";
import { MatchMakingController } from "./matchmaking.controller";

describe("Match Making controller", () => {
  let mmController: MatchMakingController;
  let gameService: GamesServices;

  beforeEach(async () => {
    const contextId = ContextIdFactory.create();
    jest.
      spyOn(
        ContextIdFactory,
        "getByRequest",
      ).
      mockImplementation(() => contextId);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [MatchMakingController],
      providers: [
        GameOneRuleService,
        PlayersService,
        SystemPlayerService,
        MeService,
        GamesServices,
      ],
    }).
      overrideProvider(REQUEST).
      useValue({
        cookies: {
          "player.nickname": "test",
        },
      }).
      compile();

    mmController = app.get<MatchMakingController>(MatchMakingController);
    expect(mmController).not.toBe(undefined);
    expect(mmController).not.toBe(null);
    const playerSvc = app.get<PlayersService>(PlayersService);
    gameService = app.get<GamesServices>(GamesServices);
    playerSvc.addPlayer("player 1");
    playerSvc.addPlayer("player 2");
    playerSvc.addPlayer("player 3");
    playerSvc.addPlayer("player 4");
    playerSvc.addPlayer("player 5");
  });

  it(
    "Get a list of free games with empty list",
    async () => {
      const games = await mmController.getGames();
      expect(games.length).toBe(0);
    },
  );

  it(
    "Get a list of free games after create one",
    async () => {
      const gameId = await mmController.createGame({
        gameTitle: "Test",
        nickName: "player 1",
      });
      expect(gameId).toBeGreaterThanOrEqual(0);
      const games = await mmController.getGames();
      expect(games.length).toBe(1);
      expect(games[0].elapesd).toBe(null);
      expect(games[0].gameId).toBe(0);
      expect(games[0].joinedPlayers).toBe(1);
      expect(games[0].playersMax).toBe(4);
      expect(games[0].playersMin).toBe(2);
      expect(games[0].title).toBe("Test");
    },
  );

  it(
    "Get a list of free games after create one, join with other 3 players",
    async () => {
      const gameId = await mmController.createGame({
        gameTitle: "Test",
        nickName: "player 1",
      });
        // fill the game
      await Promise.all([
        mmController.joinGame({ nickName: "player 2",
          gameId }),
        mmController.joinGame({ nickName: "player 3",
          gameId }),
        mmController.joinGame({ nickName: "player 4",
          gameId }),
      ]);
      const games = await mmController.getGames();
      expect(games.length).toBe(0); // the only one game is full then the list should be empty
    },
  );

  it(
    "Start a game",
    async () => {
      const gameId = await mmController.createGame({
        gameTitle: "Test",
        nickName: "player 1",
      });
        // fill the game
      await Promise.all([
        mmController.joinGame({ nickName: "player 2",
          gameId }),
        mmController.joinGame({ nickName: "player 3",
          gameId }),
        mmController.joinGame({ nickName: "player 4",
          gameId }),
      ]);
      const myGames = await gameService.getGamesIAmConnectedIn("player 1");
      await mmController.startGame({ gameId,
        nickName: "player 1" });
      expect(myGames[0].startedAt).not.toBeNull();
    },
  );
});
