import { CHARACTERS } from "@/gameone/gameone-contents";
import { GameOneRuleService } from "@/gameone/rule-manager/rule-manager.service";
import { GameoneState } from "@/gameone/rules/state.types";
import { GameStateGateway, GameWebSocket } from "@/services/game/game-state.gateway";
import { LobbyEventsService } from "@/services/game/lobby-events.service";
import { PlayersService } from "@/services/players/players.service";
import { GamesServices } from "./games.service";
import { describe, expect, it } from "vitest";

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
    expect(game.ruleState.allowedNextActions).toEqual(["CharacterSelection"]);

    const socket = new TestGameSocket();
    gateway.handleConnection(socket);
    socket.receive(JSON.stringify({
      type: "subscribe",
      gameId: game.gameId,
    }));
    expect(JSON.parse(socket.messages[0])).toMatchObject({
      type: "game-state",
      gameId: game.gameId,
      phase: "Setup",
      turnPhase: "CharacterSelection",
    });

    const events: unknown[] = [];
    const subscription = lobbyEvents.events$.subscribe((event) => events.push(event));
    socket.receive(JSON.stringify({
      type: "game-action",
      requestId: "character-selection-1",
      gameId: game.gameId,
      actorPlayerId: game.connectedPlayers[0].id,
      action: {
        phase: "Setup",
        kind: "CharacterSelection",
        selectedCharacters: game.connectedPlayers.map((player, index) => ({
          playerId: player.id,
          characterId: CHARACTERS[index].characterId,
          characterName: CHARACTERS[index].characterClass,
        })),
      },
    }));
    const selection = gamesService.getGameState(game.gameId);

    expect(selection.phase).toBe("PlayerTurn");
    expect(selection.state).toMatchObject({
      charactersByPlayers: expect.arrayContaining(game.connectedPlayers.map((player, index) => ({
        playerId: player.id,
        character: expect.objectContaining({
          characterName: CHARACTERS[index].characterClass,
        }),
      }))),
    });
    expect(events).toHaveLength(2);
    expect(socket.messages).toHaveLength(3);
    expect(JSON.parse(socket.messages[1])).toMatchObject({
      type: "game-state",
      gameId: game.gameId,
      phase: "PlayerTurn",
      allowedActions: ["Move", "Fight", "Pass"],
    });
    expect(JSON.parse(socket.messages[2])).toMatchObject({
      type: "game-action-result",
      requestId: "character-selection-1",
      status: "accepted",
    });
    socket.receive(JSON.stringify({
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
    expect(JSON.parse(socket.messages[3])).toMatchObject({
      type: "game-action-result",
      requestId: "wrong-player-1",
      status: "rejected",
      error: {
        code: "ACTION_REJECTED",
      },
    });
    gateway.handleDisconnect(socket);
    subscription.unsubscribe();
  });
});
