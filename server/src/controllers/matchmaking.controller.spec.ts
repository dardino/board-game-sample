import { GameOneRuleService } from "@/gameone/rule-manager/rule-manager.service";
import { MeService } from "@/me/me.service";
import { GamesServices } from "@/services/game/games.service";
import { LobbyEventsService } from "@/services/game/lobby-events.service";
import { PlayersService } from "@/services/players/players.service";
import { SystemPlayerService } from "@/services/system-player/system-player.service";
import { ContextIdFactory, REQUEST } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vitest } from "vitest";
import { MatchMakingController } from "./matchmaking.controller";

describe(
  "Match Making controller",
  () => {

    let mmController: MatchMakingController;
    let gameService: GamesServices;

    beforeEach(async () => {

      const contextId = ContextIdFactory.create();
      vitest.
        spyOn(
          ContextIdFactory,
          "getByRequest",
        ).
        mockImplementation(() => contextId);

      const app: TestingModule = await Test.createTestingModule({
        controllers: [MatchMakingController],
        providers: [
          GameOneRuleService,
          LobbyEventsService,
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
      playerSvc.addPlayer("player 1", "ClientId1");
      playerSvc.addPlayer("player 2", "ClientId2");
      playerSvc.addPlayer("player 3", "ClientId3");
      playerSvc.addPlayer("player 4", "ClientId4");
      playerSvc.addPlayer("player 5", "ClientId5");

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
        expect(games[0].elapsed).toBe(null);
        expect(games[0].gameId).toBe(0);
        expect(games[0].joinedPlayers).toBe(1);
        expect(games[0].playersMax).toBe(4);
        expect(games[0].playersMin).toBe(2);
        expect(games[0].title).toBe("Test");
        expect(games[0].players).toEqual(["player 1"]);
        expect(games[0].createdBy).toBe("player 1");

      },
    );

    it(
      "streams a game snapshot and real-time player updates",
      async () => {
        const gameId = await mmController.createGame({
          gameTitle: "Live game",
          nickName: "player 1",
        });
        const received: unknown[] = [];
        const subscription = mmController.getEvents(gameId.toString()).
          subscribe((event) => received.push(event.data));

        await mmController.joinGame({
          nickName: "player 2",
          gameId,
        });

        expect(received).toHaveLength(2);
        expect(received[0]).toMatchObject({
          type: "game-updated",
          game: {
            createdBy: "player 1",
            joinedPlayers: 1,
            players: ["player 1"],
          },
        });
        expect(received[1]).toMatchObject({
          type: "game-updated",
          game: {
            joinedPlayers: 2,
            players: [
              "player 1",
              "player 2",
            ],
          },
        });
        subscription.unsubscribe();
      },
    );

    it(
      "streams updated lobby lists",
      async () => {
        const received: unknown[] = [];
        const subscription = mmController.getEvents().
          subscribe((event) => received.push(event.data));

        await mmController.createGame({
          gameTitle: "Live game",
          nickName: "player 1",
        });

        expect(received).toHaveLength(2);
        expect(received[0]).toMatchObject({
          type: "lobbies-updated",
          games: [],
        });
        expect(received[1]).toMatchObject({
          type: "lobbies-updated",
          games: [
            {
              title: "Live game",
              joinedPlayers: 1,
            },
          ],
        });
        subscription.unsubscribe();
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

  },
);
