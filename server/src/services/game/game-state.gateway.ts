import {
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
  if (!isRecord(message) || !("type" in message) || !("gameId" in message)) {
    return false;
  }
  return message.type === "subscribe" &&
    typeof message.gameId === "number" &&
    Number.isSafeInteger(message.gameId) &&
    message.gameId >= 0;
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

  #subscriptions = new Map<GameWebSocket, number>();

  constructor (
    private readonly gamesService: GamesServices,
    lobbyEvents: LobbyEventsService,
  ) {
    lobbyEvents.events$.subscribe((event) => this.#handleGameEvent(event));
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

    if (!isSubscription(message)) {
      if (isGameActionRequest(message)) {
        this.#handleAction(client, message);
      } else {
        this.#send(client, {
          type: "game-error",
          message: "Expected a game subscription or a valid game action.",
        });
      }
      return;
    }

    try {
      const state = this.gamesService.getGameState(message.gameId);
      this.#subscriptions.set(client, message.gameId);
      this.#send(client, state);
    } catch (error) {
      this.#sendError(client, message.gameId, error);
    }
  }

  #handleAction (client: GameWebSocket, request: GameActionRequest) {
    if (this.#subscriptions.get(client) !== request.gameId) {
      this.#sendActionResult(client, request, {
        code: "NOT_SUBSCRIBED",
        message: "Subscribe to this game before sending actions.",
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

  #handleGameEvent (event: GameEvent) {
    if (event.type === "game-removed") {
      for (const [client, gameId] of this.#subscriptions) {
        if (gameId === event.gameId) {
          this.#send(client, {
            type: "game-error",
            gameId,
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

    for (const [client, gameId] of this.#subscriptions) {
      if (gameId !== event.game.gameId) continue;
      try {
        const state = this.gamesService.getGameState(gameId);
        this.#send(client, state);
      } catch (error) {
        this.#sendError(client, gameId, error);
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
    if (error instanceof GameJoinException && error.details.internalCode === 1001) {
      errorEvent.code = "GAME_NOT_FOUND";
    }
    this.#send(client, errorEvent);
  }

  #send (
    client: GameWebSocket,
    message: GameStateEvent | GameStateErrorEvent | GameActionResultEvent,
  ) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

}
