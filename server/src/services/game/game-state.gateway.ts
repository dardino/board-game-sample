import {
  GameStateErrorEvent,
  GameStateEvent,
  GameStateSubscription,
} from "@dto/game-state.dto/game-state.dto";
import { WebSocketGateway } from "@nestjs/websockets";
import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { GamesServices } from "./games.service";
import { LobbyEventsService } from "./lobby-events.service";

export interface GameWebSocket {
  readyState: number;
  on(event: "message", listener: (data: { toString: () => string }) => void): void;
  send(data: string): void;
  close(): void;
}

function isSubscription (message: unknown): message is GameStateSubscription {
  if (typeof message !== "object" || message === null || !("type" in message) || !("gameId" in message)) {
    return false;
  }
  return message.type === "subscribe" &&
    typeof message.gameId === "number" &&
    Number.isSafeInteger(message.gameId) &&
    message.gameId >= 0;
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
      this.#send(client, {
        type: "game-error",
        message: "Expected a game subscription with a valid game ID.",
      });
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

  #handleGameEvent (event: GameEvent) {
    if (event.type === "game-removed") {
      for (const [client, gameId] of this.#subscriptions) {
        if (gameId === event.gameId) {
          this.#send(client, {
            type: "game-error",
            gameId,
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
    this.#send(client, {
      type: "game-error",
      gameId,
      message: error instanceof Error
        ? error.message
        : "Unable to retrieve game state.",
    });
  }

  #send (client: GameWebSocket, message: GameStateEvent | GameStateErrorEvent) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

}
