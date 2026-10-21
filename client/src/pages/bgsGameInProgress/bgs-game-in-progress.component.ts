import { BgsComponentTypeStatic } from "../../helpers/components";
import {
  GameActionResultEvent,
  GameStateErrorEvent,
  GameStateEvent,
} from "@dto/game-state.dto/game-state.dto";
import { matchPath, navigate } from "../../routes/navigation";
import { Registration } from "../../services/registration/registration.service";
import style from "./bgs-game-in-progress.module.css";
import template from "./bgs-game-in-progress.template.html?css-module";

function isGameStateEvent (message: unknown): message is GameStateEvent {
  return typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "game-state" &&
    "gameId" in message &&
    typeof message.gameId === "number" &&
    "phase" in message &&
    "currentPlayer" in message &&
    "turnPhase" in message &&
    "allowedActions" in message &&
    Array.isArray(message.allowedActions);
}

function isGameStateErrorEvent (message: unknown): message is GameStateErrorEvent {
  return typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "game-error" &&
    "message" in message &&
    typeof message.message === "string";
}

function isGameActionResultEvent (message: unknown): message is GameActionResultEvent {
  if (
    typeof message !== "object" ||
    message === null ||
    !("type" in message) ||
    message.type !== "game-action-result" ||
    !("requestId" in message) ||
    typeof message.requestId !== "string" ||
    !("gameId" in message) ||
    typeof message.gameId !== "number" ||
    !("status" in message) ||
    message.status !== "accepted" && message.status !== "rejected"
  ) {
    return false;
  }
  return message.status === "accepted" ||
    "error" in message &&
    typeof message.error === "object" &&
    message.error !== null &&
    "code" in message.error &&
    typeof message.error.code === "string" &&
    "message" in message.error &&
    typeof message.error.message === "string";
}

export const BgsGameInProgressComponent: BgsComponentTypeStatic = class BgsGameInProgressComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-in-progress";

  #socket: WebSocket | null = null;

  #gameId: number | null = null;

  #pendingActions = new Map<string, {
    resolve: (result: GameActionResultEvent) => void;
    timeoutId: number;
  }>();

  constructor () {
    super();
    this.innerHTML = template;
    this.classList.add(style.game);
  }

  public static register () {
    customElements.define(
      BgsGameInProgressComponent.tagName,
      BgsGameInProgressComponent,
    );
  }

  connectedCallback () {
    const gameId = Number(matchPath(
      "/game/:id/in-progress",
      location.pathname,
    )?.params.id);
    if (!Number.isSafeInteger(gameId) || gameId < 0) {
      navigate("/games");
      return;
    }
    this.#gameId = gameId;

    this.#setConnectionStatus("Connecting...");
    const url = new URL("/ws", location.href);
    url.protocol = url.protocol === "https:"
      ? "wss:"
      : "ws:";
    this.#socket = new WebSocket(url);
    this.#socket.addEventListener("open", () => {
      this.#socket?.send(JSON.stringify({
        type: "subscribe",
        gameId,
      }));
      this.#setConnectionStatus("Live");
    });
    this.#socket.addEventListener("message", this.#handleMessage);
    this.#socket.addEventListener("error", () => this.#setConnectionStatus("Connection error"));
    this.#socket.addEventListener("close", this.#handleSocketClose);
  }

  sendGameAction (action: unknown): Promise<GameActionResultEvent> {
    const socket = this.#socket;
    const gameId = this.#gameId;
    if (!socket || socket.readyState !== WebSocket.OPEN || gameId === null) {
      return Promise.reject(new Error("The game connection is not open."));
    }

    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.#pendingActions.delete(requestId);
        resolve({
          type: "game-action-result",
          requestId,
          gameId,
          status: "rejected",
          error: {
            code: "TIMEOUT",
            message: "The server did not respond to the game action.",
          },
        });
      }, 15000);
      this.#pendingActions.set(requestId, {
        resolve,
        timeoutId,
      });
      try {
        socket.send(JSON.stringify({
          type: "game-action",
          requestId,
          gameId,
          actorPlayerId: Registration.PlayerId,
          action,
        }));
      } catch (error) {
        window.clearTimeout(timeoutId);
        this.#pendingActions.delete(requestId);
        reject(error);
      }
    });
  }

  disconnectedCallback () {
    this.#socket?.close();
    this.#socket = null;
  }

  #handleMessage = (event: MessageEvent<string>) => {
    let message: unknown;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Unable to parse game state message:", error);
      this.#setConnectionStatus("Invalid game state received");
      return;
    }

    if (isGameStateEvent(message)) {
      this.#renderGameState(message);
    } else if (isGameStateErrorEvent(message)) {
      this.#setConnectionStatus(message.message);
    } else if (isGameActionResultEvent(message)) {
      const pendingAction = this.#pendingActions.get(message.requestId);
      if (pendingAction) {
        window.clearTimeout(pendingAction.timeoutId);
        this.#pendingActions.delete(message.requestId);
        pendingAction.resolve(message);
      }
      this.dispatchEvent(new CustomEvent("game-action-result", {
        detail: message,
        bubbles: true,
      }));
    }
  };

  #handleSocketClose = () => {
    this.#setConnectionStatus("Disconnected");
    for (const [requestId, pendingAction] of this.#pendingActions) {
      window.clearTimeout(pendingAction.timeoutId);
      pendingAction.resolve({
        type: "game-action-result",
        requestId,
        gameId: this.#gameId ?? -1,
        status: "rejected",
        error: {
          code: "CONNECTION_CLOSED",
          message: "The game connection was closed before the action completed.",
        },
      });
    }
    this.#pendingActions.clear();
  };

  #renderGameState (state: GameStateEvent) {
    this.#setText("#gamePhase", state.phase ?? "—");
    this.#setText("#currentPlayer", state.currentPlayer ?? "—");
    const turnPhase = state.turnPhase ?? "—";
    const allowedActions = state.allowedActions.length > 0
      ? `Available: ${state.allowedActions.join(", ")}`
      : "";
    this.#setText("#turnPhase", [turnPhase, allowedActions].filter(Boolean).join(" — "));
    this.#setConnectionStatus("Live");
  }

  #setText (selector: string, value: string) {
    const element = this.querySelector(selector);
    if (element) element.textContent = value;
  }

  #setConnectionStatus (status: string) {
    this.#setText("#connectionStatus", status);
  }

};
