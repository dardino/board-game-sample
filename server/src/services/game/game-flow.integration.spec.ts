import { CHARACTERS } from "@/gameone/gameone-contents";
import { GameOneRuleService } from "@/gameone/rule-manager/rule-manager.service";
import { GameoneState } from "@/gameone/rules/state.types";
import { GameStateGateway, GameWebSocket } from "@/services/game/game-state.gateway";
import { LobbyEventsService } from "@/services/game/lobby-events.service";
import { PlayersService } from "@/services/players/players.service";
import { GamesServices } from "./games.service";
import { afterEach, describe, expect, it, vi } from "vitest";

class TestGameSocket implements GameWebSocket {

  readyState = 1;

  #messageListener: ((data: { toString: () => string }) => void) | null = null;

  messages: string[] = [];

  on (_event: "message", listener: (data: { toString: () => string }) => void) {
    this.#messageListener = listener;
  }

  send (message: string) {
    this.messages.push(message);
  }

  close () {
    this.readyState = 3;
  }

  receive (message: string) {
    this.#messageListener?.({ toString: () => message });
  }

}

function isGameoneState (state: unknown): state is GameoneState {
  return typeof state === "object" &&
    state !== null &&
    "allowedNextActions" in state &&
    Array.isArray(state.allowedNextActions);
}

describe("Complete game flow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers four players, starts their game, and assigns each a character", async () => {
    const playersService = new PlayersService();
    const lobbyEvents = new LobbyEventsService();
    const gamesService = new GamesServices(
      playersService,
      new GameOneRuleService(),
      lobbyEvents,
    );
    const gateway = new GameStateGateway(gamesService, lobbyEvents);
    const nicknames = ["owner", "player-two", "player-three", "player-four"];

    for (const [index, nickname] of nicknames.entries()) {
      await playersService.addPlayer(nickname, `client-${index}`);
    }

    const game = await gamesService.createNewGame(nicknames[0], "Integration game");
    for (const nickname of nicknames.slice(1)) {
      await gamesService.joinToGame(nickname, game.gameId);
    }

    expect(game.connectedPlayers.map((player) => player.nickname)).toEqual(nicknames);

    await gamesService.startGame(nicknames[0], game.gameId);
    expect(game.startedAt).toBeInstanceOf(Date);
    expect(isGameoneState(game.ruleState)).toBe(true);
    if (!isGameoneState(game.ruleState)) {
      throw new Error("The started game does not contain a valid Eldorasia state.");
    }
    expect(game.ruleState.allowedNextActions).toContain("CharacterSelection");

    const sockets = game.connectedPlayers.map(() => new TestGameSocket());
    for (const [index, socket] of sockets.entries()) {
      const player = game.connectedPlayers[index];
      if (!player) throw new Error("Expected a player for each game socket.");
      gateway.handleConnection(socket);
      socket.receive(JSON.stringify({
        type: "subscribe",
        gameId: game.gameId,
        playerId: player.id,
      }));
      expect(JSON.parse(socket.messages[0])).toMatchObject({
        type: "game-state",
        gameId: game.gameId,
        chat: {
          messages: [],
        },
        phase: "Setup",
        turnPhase: "CharacterSelection",
        characterSelection: {
          selectedCharacters: [],
          availableCharacters: expect.arrayContaining([
            {
              characterId: 5,
              characterClass: "Bardo",
              startingLife: 7,
              startingEnergy: 5,
              movementSpeed: 2,
              defence: 1,
            },
          ]),
        },
      });

    }

    const events: unknown[] = [];
    const subscription = lobbyEvents.events$.subscribe((event) => events.push(event));
    for (const [index, player] of game.connectedPlayers.entries()) {
      sockets[index].receive(JSON.stringify({
        type: "game-action",
        requestId: `character-selection-${index}`,
        gameId: game.gameId,
        actorPlayerId: player.id,
        action: {
          phase: "Setup",
          kind: "CharacterSelection",
          playerId: player.id,
          characterId: CHARACTERS[index].characterId,
          characterName: CHARACTERS[index].characterClass,
        },
      }));
      expect(JSON.parse(sockets[index].messages.at(-1)!)).toMatchObject({
        type: "game-action-result",
        requestId: `character-selection-${index}`,
        status: "accepted",
      });
    }
    for (const [index, player] of game.connectedPlayers.entries()) {
      sockets[index].receive(JSON.stringify({
        type: "game-action",
        requestId: `character-ready-${index}`,
        gameId: game.gameId,
        actorPlayerId: player.id,
        action: {
          phase: "Setup",
          kind: "CharacterSelectionReady",
          playerId: player.id,
        },
      }));
    }
    const selection = gamesService.getGameState(game.gameId);

    expect(selection.phase).toBe("CharacterReveal");
    expect(selection.characterSelection.stage).toBe("revealing");
    expect(selection.state).toMatchObject({
      charactersByPlayers: expect.arrayContaining(game.connectedPlayers.map((player, index) => ({
        playerId: player.id,
        character: expect.objectContaining({
          characterName: CHARACTERS[index].characterClass,
        }),
      }))),
    });
    for (const [index, player] of game.connectedPlayers.entries()) {
      sockets[index].receive(JSON.stringify({
        type: "game-action",
        requestId: `reveal-ready-${index}`,
        gameId: game.gameId,
        actorPlayerId: player.id,
        action: {
          phase: "CharacterReveal",
          kind: "CharacterRevealReady",
          playerId: player.id,
        },
      }));
    }
    expect(gamesService.getGameState(game.gameId).phase).toBe("PlayerTurn");

    sockets[0].receive(JSON.stringify({
      type: "chat-message",
      requestId: "chat-message-1",
      gameId: game.gameId,
      message: "Hello party!",
    }));
    expect(JSON.parse(sockets[0].messages.at(-1)!)).toMatchObject({
      type: "chat-message-result",
      requestId: "chat-message-1",
      status: "accepted",
    });
    for (const socket of sockets) {
      const parsedMessages = socket.messages.map((message) => JSON.parse(message));
      const gameStates = parsedMessages.filter((message) => message.type === "game-state");
      expect(gameStates).toHaveLength(14);
      expect(gameStates.at(-1)).toMatchObject({
        chat: {
          messages: [
            {
              playerId: game.connectedPlayers[0].id,
              nickname: nicknames[0],
              text: "Hello party!",
            },
          ],
        },
      });
    }

    expect(events).toHaveLength(24);
    for (const socket of sockets) {
      if (socket === sockets[0]) {
        expect(socket.messages).toHaveLength(18);
      } else {
        expect(socket.messages).toHaveLength(17);
      }
      const parsedMessages = socket.messages.map((message) => JSON.parse(message));
      const gameStates = parsedMessages.filter((message) => message.type === "game-state");
      expect(gameStates).toHaveLength(14);
      expect(gameStates.at(-1)).toMatchObject({
        type: "game-state",
        gameId: game.gameId,
        phase: "PlayerTurn",
        allowedActions: ["Move", "Fight", "Pass"],
      });
    }
    sockets[0].receive(JSON.stringify({
      type: "game-action",
      requestId: "wrong-player-1",
      gameId: game.gameId,
      actorPlayerId: game.connectedPlayers[0].id,
      action: {
        phase: "PlayerTurn",
        kind: "Pass",
        playerId: game.connectedPlayers[1].id,
      },
    }));
    expect(JSON.parse(sockets[0].messages.at(-1)!)).toMatchObject({
      type: "game-action-result",
      requestId: "wrong-player-1",
      status: "rejected",
      error: {
        code: "ACTION_REJECTED",
      },
    });
    const outsider = await playersService.addPlayer("observer", "client-observer");
    const outsiderSocket = new TestGameSocket();
    gateway.handleConnection(outsiderSocket);
    outsiderSocket.receive(JSON.stringify({
      type: "subscribe",
      gameId: game.gameId,
      playerId: outsider.id,
    }));
    expect(JSON.parse(outsiderSocket.messages[0])).toMatchObject({
      type: "game-error",
      gameId: game.gameId,
      code: "NOT_A_PLAYER",
    });
    outsiderSocket.receive(JSON.stringify({
      type: "chat-message",
      requestId: "outsider-chat",
      gameId: game.gameId,
      message: "I am not playing.",
    }));
    expect(JSON.parse(outsiderSocket.messages[1])).toMatchObject({
      type: "chat-message-result",
      requestId: "outsider-chat",
      status: "rejected",
      error: {
        code: "NOT_SUBSCRIBED",
      },
    });
    gateway.handleDisconnect(outsiderSocket);

    await gamesService.leaveGame(nicknames[3], game.gameId);
    expect(JSON.parse(sockets[3].messages.at(-1)!)).toMatchObject({
      type: "game-error",
      gameId: game.gameId,
      code: "NOT_A_PLAYER",
    });
    expect(sockets[3].readyState).toBe(3);

    for (const socket of sockets) gateway.handleDisconnect(socket);
    subscription.unsubscribe();
  });

  it("places the START tile when the character reveal phase completes", async () => {
    vi.useFakeTimers();
    const playersService = new PlayersService();
    const lobbyEvents = new LobbyEventsService();
    const gamesService = new GamesServices(
      playersService,
      new GameOneRuleService(),
      lobbyEvents,
    );
    const nicknames = ["owner", "player-two"];
    for (const [index, nickname] of nicknames.entries()) {
      await playersService.addPlayer(nickname, `start-tile-client-${index}`);
    }
    const game = await gamesService.createNewGame(nicknames[0], "Start tile timing");
    await gamesService.joinToGame(nicknames[1], game.gameId);
    await gamesService.startGame(nicknames[0], game.gameId);

    expect(gamesService.getGameState(game.gameId).state).toMatchObject({
      onboardTiles: [],
    });

    await vi.advanceTimersByTimeAsync(40_000);

    const startedState = gamesService.getGameState(game.gameId);
    expect(startedState.phase).toBe("PlayerTurn");
    expect(startedState.state).toMatchObject({
      onboardTiles: [
        expect.objectContaining({
          type: "Start",
        }),
      ],
    });
  });

  it("resolves preferences and assignments when the 30s and 10s timers expire", async () => {
    vi.useFakeTimers();
    const playersService = new PlayersService();
    const lobbyEvents = new LobbyEventsService();
    const gamesService = new GamesServices(
      playersService,
      new GameOneRuleService(),
      lobbyEvents,
    );
    const nicknames = ["owner", "player-two", "player-three"];
    for (const [index, nickname] of nicknames.entries()) {
      await playersService.addPlayer(nickname, `timer-client-${index}`);
    }
    const game = await gamesService.createNewGame(nicknames[0], "Timed selection");
    for (const nickname of nicknames.slice(1)) {
      await gamesService.joinToGame(nickname, game.gameId);
    }
    await gamesService.startGame(nicknames[0], game.gameId);
    const preferenceId = CHARACTERS[0].characterId;
    for (const player of game.connectedPlayers.slice(0, 2)) {
      gamesService.applyGameAction(game.gameId, player.id, {
        phase: "Setup",
        kind: "CharacterSelection",
        playerId: player.id,
        characterId: preferenceId,
        characterName: CHARACTERS[0].characterClass,
      });
    }
    expect(gamesService.getGameState(game.gameId).characterSelection).toMatchObject({
      stage: "choosing",
      endsAt: Date.now() + 30_000,
    });

    await vi.advanceTimersByTimeAsync(30_000);
    const reveal = gamesService.getGameState(game.gameId);
    expect(reveal.phase).toBe("CharacterReveal");
    expect(reveal.characterSelection).toMatchObject({
      stage: "revealing",
      endsAt: Date.now() + 10_000,
    });
    if (!isGameoneState(reveal.state)) throw new Error("The game state is not available.");
    const assignments = reveal.state.charactersByPlayers;
    expect(assignments).toHaveLength(3);
    expect(new Set(assignments.map(({ character }) => character.characterId)).size).toBe(3);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(gamesService.getGameState(game.gameId).phase).toBe("PlayerTurn");
    expect(gamesService.getGameState(game.gameId).characterSelection.stage).toBeNull();
  });

  it("pauses game actions on disconnect and resumes the selection timer after reconnection", async () => {
    vi.useFakeTimers();
    const playersService = new PlayersService();
    const lobbyEvents = new LobbyEventsService();
    const gamesService = new GamesServices(
      playersService,
      new GameOneRuleService(),
      lobbyEvents,
    );
    const gateway = new GameStateGateway(gamesService, lobbyEvents);
    const nicknames = ["owner", "player-two"];
    for (const [index, nickname] of nicknames.entries()) {
      await playersService.addPlayer(nickname, `reconnect-client-${index}`);
    }
    const game = await gamesService.createNewGame(nicknames[0], "Reconnect game");
    await gamesService.joinToGame(nicknames[1], game.gameId);
    await gamesService.startGame(nicknames[0], game.gameId);

    const player = game.connectedPlayers[0];
    const otherPlayer = game.connectedPlayers[1];
    if (!player || !otherPlayer) throw new Error("The started game is missing its players.");
    const sockets = [player, otherPlayer].map((connectedPlayer) => {
      const socket = new TestGameSocket();
      gateway.handleConnection(socket);
      socket.receive(JSON.stringify({
        type: "subscribe",
        gameId: game.gameId,
        playerId: connectedPlayer.id,
      }));
      return socket;
    });

    await vi.advanceTimersByTimeAsync(5_000);
    gateway.handleDisconnect(sockets[0]);

    expect(gamesService.getGameState(game.gameId).characterSelection.endsAt).toBe(Date.now() + 40_000);
    expect(gamesService.getGameState(game.gameId)).toMatchObject({
      reconnection: {
        paused: true,
        resumesAt: Date.now() + 15_000,
        disconnectedPlayerIds: [player.id],
      },
    });
    expect(() => gamesService.applyGameAction(game.gameId, otherPlayer.id, {
      phase: "Setup",
      kind: "CharacterSelection",
      playerId: otherPlayer.id,
      characterId: CHARACTERS[0].characterId,
      characterName: CHARACTERS[0].characterClass,
    })).toThrow("paused");

    await vi.advanceTimersByTimeAsync(4_000);
    const reconnectingSocket = new TestGameSocket();
    gateway.handleConnection(reconnectingSocket);
    reconnectingSocket.receive(JSON.stringify({
      type: "subscribe",
      gameId: game.gameId,
      playerId: player.id,
    }));

    expect(JSON.parse(reconnectingSocket.messages[0] ?? "{}")).toMatchObject({
      type: "game-state",
      reconnection: {
        paused: false,
        resumesAt: null,
        disconnectedPlayerIds: [],
      },
      characterSelection: {
        endsAt: Date.now() + 25_000,
      },
    });
    expect(JSON.parse(sockets[1].messages.at(-1) ?? "{}")).toMatchObject({
      type: "game-state",
      reconnection: {
        paused: false,
      },
    });
  });

  it("resumes the game after the 15-second reconnect window expires", async () => {
    vi.useFakeTimers();
    const playersService = new PlayersService();
    const lobbyEvents = new LobbyEventsService();
    const gamesService = new GamesServices(
      playersService,
      new GameOneRuleService(),
      lobbyEvents,
    );
    const gateway = new GameStateGateway(gamesService, lobbyEvents);
    const nicknames = ["owner", "player-two"];
    for (const [index, nickname] of nicknames.entries()) {
      await playersService.addPlayer(nickname, `timeout-client-${index}`);
    }
    const game = await gamesService.createNewGame(nicknames[0], "Reconnect timeout");
    await gamesService.joinToGame(nicknames[1], game.gameId);
    await gamesService.startGame(nicknames[0], game.gameId);

    const player = game.connectedPlayers[0];
    if (!player) throw new Error("The started game is missing its owner.");
    const socket = new TestGameSocket();
    gateway.handleConnection(socket);
    socket.receive(JSON.stringify({
      type: "subscribe",
      gameId: game.gameId,
      playerId: player.id,
    }));

    await vi.advanceTimersByTimeAsync(5_000);
    gateway.handleDisconnect(socket);
    await vi.advanceTimersByTimeAsync(14_999);
    expect(gamesService.getGameState(game.gameId)).toMatchObject({
      reconnection: {
        paused: true,
      },
    });

    await vi.advanceTimersByTimeAsync(1);
    expect(gamesService.getGameState(game.gameId)).toMatchObject({
      reconnection: {
        paused: false,
        resumesAt: null,
        disconnectedPlayerIds: [],
      },
      characterSelection: {
        endsAt: Date.now() + 25_000,
      },
    });
  });
});
