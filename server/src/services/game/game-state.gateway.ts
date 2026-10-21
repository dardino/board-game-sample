import {
  GameChatMessageRequest,
  GameChatMessageResultEvent,
  GameActionRequest,
  GameActionResultEvent,
  GameStateErrorEvent,
  GameStateEvent,
  GameStateSubscription,
} from "@dto/game-state.dto/game-state.dto";
import { WebSocketGateway } from "@nestjs/websockets";
import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { Connections } from "@/gameone/gameone-contents";
import { AllPossibleAction } from "@/gameone/rules/state.types";
import { GameJoinException } from "@/errors/gameJoin";
import { GamesServices } from "./games.service";
import { LobbyEventsService } from "./lobby-events.service";

export interface GameWebSocket {
  readyState: number;
  on(event: "message", listener: (data: { toString: () => string }) => void): void;
  send(data: string): void;
  close(): void;
}

function isSubscription (message: unknown): message is GameStateSubscription {
  if (!isRecord(message) ||
    !("type" in message) ||
    !("gameId" in message) ||
    !("playerId" in message)) {
    return false;
  }
  return message.type === "subscribe" &&
    typeof message.gameId === "number" &&
    Number.isSafeInteger(message.gameId) &&
    message.gameId >= 0 &&
    typeof message.playerId === "number" &&
    Number.isSafeInteger(message.playerId) &&
    message.playerId >= 0;
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConnection (value: unknown): value is typeof Connections[number] {
  return Connections.some((connection) => connection === value);
}

function isGameActionRequest (message: unknown): message is GameActionRequest {
  return isRecord(message) &&
    message.type === "game-action" &&
    typeof message.requestId === "string" &&
    message.requestId.length > 0 &&
    message.requestId.length <= 100 &&
    typeof message.gameId === "number" &&
    Number.isSafeInteger(message.gameId) &&
    message.gameId >= 0 &&
    typeof message.actorPlayerId === "number" &&
    Number.isSafeInteger(message.actorPlayerId) &&
    "action" in message;
}

function isGameChatMessageRequest (message: unknown): message is GameChatMessageRequest {
  return isRecord(message) &&
    message.type === "chat-message" &&
    typeof message.requestId === "string" &&
    message.requestId.length > 0 &&
    message.requestId.length <= 100 &&
    typeof message.gameId === "number" &&
    Number.isSafeInteger(message.gameId) &&
    message.gameId >= 0 &&
    typeof message.message === "string";
}

function isClientGameAction (action: unknown): action is AllPossibleAction {
  if (!isRecord(action)) return false;
  if (action.kind === "CharacterSelection") {
    return action.phase === "Setup" &&
      typeof action.playerId === "number" &&
      Number.isSafeInteger(action.playerId) &&
      typeof action.characterId === "number" &&
      Number.isSafeInteger(action.characterId) &&
      typeof action.characterName === "string" &&
      action.characterName.trim().length > 0;
  }
  if (action.phase !== "PlayerTurn" ||
    typeof action.playerId !== "number" ||
    !Number.isSafeInteger(action.playerId)) {
    return false;
  }
  switch (action.kind) {

    case "Move":
      return isConnection(action.direction);
    case "PickATile":
      return isConnection(action.position);
    case "PlaceTile":
      return typeof action.rotation === "number" &&
        [0, 1, 2, 3, 4, 5].includes(action.rotation);
    case "Fight":
      return isRecord(action.tile) &&
        typeof action.tile.x === "number" &&
        Number.isFinite(action.tile.x) &&
        typeof action.tile.y === "number" &&
        Number.isFinite(action.tile.y) &&
        isRecord(action.attack) &&
        action.attack.type === "";
    case "Pass":
      return true;
    default:
      return false;

  }
}

@WebSocketGateway({ path: "/ws" })
export class GameStateGateway {

  #subscriptions = new Map<GameWebSocket, {
    gameId: number;
    playerId: number;
  }>();

  constructor (
    private readonly gamesService: GamesServices,
    lobbyEvents: LobbyEventsService,
  ) {
    lobbyEvents.events$.subscribe((event) => this.#handleGameEvent(event));
    lobbyEvents.gameStateUpdates$.subscribe((gameId) => this.#broadcastGameState(gameId));
  }

  handleConnection (client: GameWebSocket) {
    client.on("message", (data) => this.#handleMessage(client, data.toString()));
  }

  handleDisconnect (client: GameWebSocket) {
    this.#subscriptions.delete(client);
  }

  #handleMessage (client: GameWebSocket, payload: string) {
    let message: unknown;
    try {
      message = JSON.parse(payload);
    } catch {
      this.#send(client, {
        type: "game-error",
        message: "Invalid WebSocket message.",
      });
      return;
    }

    if (isGameChatMessageRequest(message)) {
      this.#handleChatMessage(client, message);
      return;
    }
    if (isGameActionRequest(message)) {
      this.#handleAction(client, message);
      return;
    }
    if (!isSubscription(message)) {
      this.#send(client, {
        type: "game-error",
        message: "Expected a game subscription or a valid game action.",
      });
      return;
    }

    try {
      const state = this.gamesService.getGameStateForPlayer(message.gameId, message.playerId);
      this.#subscriptions.set(client, {
        gameId: message.gameId,
        playerId: message.playerId,
      });
      this.#send(client, state);
    } catch (error) {
      this.#sendError(client, message.gameId, error);
    }
  }

  #handleAction (client: GameWebSocket, request: GameActionRequest) {
    const subscription = this.#subscriptions.get(client);
    if (!subscription || subscription.gameId !== request.gameId) {
      this.#sendActionResult(client, request, {
        code: "NOT_SUBSCRIBED",
        message: "Subscribe to this game before sending actions.",
      });
      return;
    }
    if (subscription.playerId !== request.actorPlayerId) {
      this.#sendActionResult(client, request, {
        code: "PLAYER_MISMATCH",
        message: "The action player does not match the subscribed player.",
      });
      return;
    }
    if (!isClientGameAction(request.action)) {
      this.#sendActionResult(client, request, {
        code: "INVALID_ACTION",
        message: "The action payload is invalid or is not a player action.",
      });
      return;
    }

    try {
      this.gamesService.applyGameAction(
        request.gameId,
        request.actorPlayerId,
        request.action,
      );
      this.#send(client, {
        type: "game-action-result",
        requestId: request.requestId,
        gameId: request.gameId,
        status: "accepted",
      });
    } catch (error) {
      this.#sendActionResult(client, request, {
        code: "ACTION_REJECTED",
        message: error instanceof Error
          ? error.message
          : "The action was rejected.",
      });
    }
  }

  #sendActionResult (
    client: GameWebSocket,
    request: GameActionRequest,
    error: NonNullable<GameActionResultEvent["error"]>,
  ) {
    this.#send(client, {
      type: "game-action-result",
      requestId: request.requestId,
      gameId: request.gameId,
      status: "rejected",
      error,
    });
  }

  #handleChatMessage (client: GameWebSocket, request: GameChatMessageRequest) {
    const subscription = this.#subscriptions.get(client);
    if (!subscription || subscription.gameId !== request.gameId) {
      this.#sendChatMessageResult(client, request, {
        code: "NOT_SUBSCRIBED",
        message: "Subscribe to this game as a player before sending chat messages.",
      });
      return;
    }

    try {
      this.gamesService.addChatMessage(
        request.gameId,
        subscription.playerId,
        request.message,
      );
      this.#send(client, {
        type: "chat-message-result",
        requestId: request.requestId,
        gameId: request.gameId,
        status: "accepted",
      });
    } catch (error) {
      this.#sendChatMessageResult(client, request, {
        code: "CHAT_MESSAGE_REJECTED",
        message: error instanceof Error
          ? error.message
          : "The chat message was rejected.",
      });
      if (error instanceof GameJoinException && error.details.internalCode === 1005) {
        client.close();
        this.#subscriptions.delete(client);
      }
    }
  }

  #sendChatMessageResult (
    client: GameWebSocket,
    request: GameChatMessageRequest,
    error: NonNullable<GameChatMessageResultEvent["error"]>,
  ) {
    this.#send(client, {
      type: "chat-message-result",
      requestId: request.requestId,
      gameId: request.gameId,
      status: "rejected",
      error,
    });
  }

  #handleGameEvent (event: GameEvent) {
    if (event.type === "game-removed") {
      for (const [client, subscription] of this.#subscriptions) {
        if (subscription.gameId === event.gameId) {
          this.#send(client, {
            type: "game-error",
            gameId: subscription.gameId,
            code: "GAME_NOT_FOUND",
            message: "The game is no longer available.",
          });
          client.close();
          this.#subscriptions.delete(client);
        }
      }
      return;
    }
    if (event.type !== "game-updated") return;

    this.#broadcastGameState(event.game.gameId);
  }

  #broadcastGameState (gameId: number) {
    for (const [client, subscription] of this.#subscriptions) {
      if (subscription.gameId !== gameId) continue;
      try {
        const state = this.gamesService.getGameStateForPlayer(gameId, subscription.playerId);
        this.#send(client, state);
      } catch (error) {
        this.#sendError(client, gameId, error);
        if (error instanceof GameJoinException &&
          [1001, 1005].includes(error.details.internalCode)) {
          client.close();
          this.#subscriptions.delete(client);
        }
      }
    }
  }

  #sendError (client: GameWebSocket, gameId: number, error: unknown) {
    const errorEvent: GameStateErrorEvent = {
      type: "game-error",
      gameId,
      message: error instanceof Error
        ? error.message
        : "Unable to retrieve game state.",
    };
    if (error instanceof GameJoinException) {
      if (error.details.internalCode === 1001) errorEvent.code = "GAME_NOT_FOUND";
      if (error.details.internalCode === 1005) errorEvent.code = "NOT_A_PLAYER";
    }
    this.#send(client, errorEvent);
  }

  #send (
    client: GameWebSocket,
    message: GameStateEvent | GameStateErrorEvent | GameActionResultEvent | GameChatMessageResultEvent,
  ) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

}
