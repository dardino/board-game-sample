import { BgsComponentTypeStatic } from "../../helpers/components";
import { GameStateErrorEvent, GameStateEvent } from "@dto/game-state.dto/game-state.dto";
import { matchPath, navigate } from "../../routes/navigation";
import style from "./bgs-game-in-progress.module.css";
import template from "./bgs-game-in-progress.template.html?raw";

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

export const BgsGameInProgressComponent: BgsComponentTypeStatic = class BgsGameInProgressComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-in-progress";

  #socket: WebSocket | null = null;

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
    this.#socket.addEventListener("close", () => this.#setConnectionStatus("Disconnected"));
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
    }
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
