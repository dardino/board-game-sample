import { BgsComponentTypeStatic } from "../../helpers/components";
import {
  GameCharacterSelectionStatus,
  GameActionResultEvent,
  GameStateErrorEvent,
  GameStateEvent,
} from "@dto/game-state.dto/game-state.dto";
import { matchPath, navigate } from "../../routes/navigation";
import { Registration } from "../../services/registration/registration.service";
import style from "./bgs-game-in-progress.module.css";
import template from "./bgs-game-in-progress.template.html?css-module";

function isCharacterSelectionStatus (value: unknown): value is GameCharacterSelectionStatus {
  if (typeof value !== "object" || value === null) return false;
  if (!("players" in value) || !Array.isArray(value.players)) return false;
  if (!("availableCharacters" in value) || !Array.isArray(value.availableCharacters)) return false;
  if (!("selectedCharacters" in value) || !Array.isArray(value.selectedCharacters)) return false;
  if (!value.players.every(isGamePlayer)) return false;
  if (!value.availableCharacters.every(isAvailableCharacter)) return false;
  return value.selectedCharacters.every(isSelectedCharacter);
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGamePlayer (value: unknown): boolean {
  return isRecord(value) &&
    typeof value.playerId === "number" &&
    typeof value.nickname === "string";
}

function isAvailableCharacter (value: unknown): boolean {
  return isRecord(value) &&
    typeof value.characterId === "number" &&
    typeof value.characterClass === "string" &&
    typeof value.startingLife === "number" &&
    typeof value.startingEnergy === "number" &&
    typeof value.movementSpeed === "number" &&
    typeof value.defence === "number";
}

function isSelectedCharacter (value: unknown): boolean {
  return isRecord(value) &&
    typeof value.playerId === "number" &&
    typeof value.nickname === "string" &&
    typeof value.characterId === "number" &&
    typeof value.characterName === "string";
}

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
    Array.isArray(message.allowedActions) &&
    message.allowedActions.every((action) => typeof action === "string") &&
    "characterSelection" in message &&
    isCharacterSelectionStatus(message.characterSelection);
}

function isGameStateErrorEvent (message: unknown): message is GameStateErrorEvent {
  return typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "game-error" &&
    "message" in message &&
    typeof message.message === "string" &&
    (!("code" in message) || message.code === "GAME_NOT_FOUND");
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

  #lastGameState: GameStateEvent | null = null;

  #selectionPending = false;

  #leavingPage = false;

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
    this.#leavingPage = true;
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
      if (message.code === "GAME_NOT_FOUND") {
        this.#returnToGames();
      } else {
        this.#setConnectionStatus(message.message);
      }
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
    this.#returnToGames();
  };

  #returnToGames () {
    if (this.#leavingPage) return;
    this.#leavingPage = true;
    navigate("/games");
  }

  #renderGameState (state: GameStateEvent) {
    this.#lastGameState = state;
    this.#setText("#gamePhase", state.phase ?? "—");
    this.#setText("#currentPlayer", state.currentPlayer ?? "—");
    const turnPhase = state.turnPhase ?? "—";
    const allowedActions = state.allowedActions.length > 0
      ? `Available: ${state.allowedActions.join(", ")}`
      : "";
    this.#setText("#turnPhase", [turnPhase, allowedActions].filter(Boolean).join(" — "));
    this.#renderCharacterSelection(state);
    this.#setConnectionStatus("Live");
  }

  #renderCharacterSelection (state: GameStateEvent) {
    const panel = this.querySelector<HTMLElement>("#characterSelection");
    const grid = this.querySelector<HTMLElement>("#characterGrid");
    const roster = this.querySelector<HTMLUListElement>("#selectedCharacters");
    if (!panel || !grid || !roster) return;

    const selection = state.characterSelection;
    const isSelectionPhase = state.phase === "Setup" && state.turnPhase === "CharacterSelection";
    panel.hidden = !isSelectionPhase;
    if (!isSelectionPhase) return;

    const playerId = Registration.PlayerId;
    const player = selection.players.find((candidate) => candidate.playerId === playerId);
    const ownSelection = selection.selectedCharacters.find((candidate) => candidate.playerId === playerId);
    const selectedByCharacter = new Map(
      selection.selectedCharacters.map((candidate) => [candidate.characterId, candidate]),
    );
    const canChoose = Boolean(player && !ownSelection);

    this.#setText(
      "#selectionInstructions",
      player
        ? ownSelection
          ? "You have chosen your character. Waiting for the other players."
          : "Choose one character. Each character can be chosen by only one player."
        : "Join this game to select a character.",
    );
    if (!ownSelection && !this.#selectionPending) {
      this.#setText(
        "#selectionFeedback",
        `${selection.selectedCharacters.length} of ${selection.players.length} players have chosen.`,
      );
    } else if (ownSelection && !this.#selectionPending) {
      this.#setText("#selectionFeedback", `Your character is ${ownSelection.characterName}.`);
    }

    const themes = [
      style.characterThemeBlue,
      style.characterThemeRed,
      style.characterThemePurple,
      style.characterThemeGreen,
    ];
    grid.replaceChildren(...selection.availableCharacters.map((character, index) => {
      const selected = selectedByCharacter.get(character.characterId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `${style.characterCard} ${themes[index % themes.length]}`;
      button.disabled = !canChoose || Boolean(selected) || this.#selectionPending;
      button.setAttribute("aria-pressed", String(selected?.playerId === playerId));

      const characterClass = document.createElement("span");
      characterClass.className = style.characterClass;
      characterClass.textContent = character.characterClass;

      const name = document.createElement("h2");
      name.className = style.characterName;
      name.textContent = character.characterClass;

      const stats = document.createElement("span");
      stats.className = style.characterStats;
      for (const [label, value] of [
        ["Life", character.startingLife],
        ["Energy", character.startingEnergy],
        ["Movement", character.movementSpeed],
        ["Defence", character.defence],
      ] as const) {
        const stat = document.createElement("span");
        stat.className = style.characterStat;
        const statLabel = document.createElement("span");
        statLabel.className = style.characterStatLabel;
        statLabel.textContent = label;
        const statValue = document.createElement("strong");
        statValue.className = style.characterStatValue;
        statValue.textContent = String(value);
        stat.append(statLabel, statValue);
        stats.append(stat);
      }

      const availability = document.createElement("span");
      availability.className = style.characterAvailability;
      availability.textContent = selected
        ? selected.playerId === playerId
          ? "Your character"
          : `Chosen by ${selected.nickname}`
        : canChoose
          ? "Choose character"
          : ownSelection
            ? "Selection complete"
            : "Unavailable";
      button.append(characterClass, name, stats, availability);
      if (canChoose && !selected) {
        button.addEventListener("click", () => {
          void this.#selectCharacter(character.characterId, character.characterClass);
        });
      }
      return button;
    }));

    roster.replaceChildren(...selection.selectedCharacters.map((chosen) => {
      const item = document.createElement("li");
      item.textContent = `${chosen.nickname}: ${chosen.characterName}`;
      return item;
    }));
  }

  async #selectCharacter (characterId: number, characterName: string) {
    this.#selectionPending = true;
    this.#setText("#selectionFeedback", `Selecting ${characterName}...`);
    if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
    try {
      const result = await this.sendGameAction({
        phase: "Setup",
        kind: "CharacterSelection",
        playerId: Registration.PlayerId,
        characterId,
        characterName,
      });
      this.#selectionPending = false;
      if (result.status === "accepted") {
        this.#setText("#selectionFeedback", `Selected ${characterName}.`);
        return;
      }
      if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
      this.#setText("#selectionFeedback", result.error?.message ?? "The character selection was rejected.");
    } catch (error) {
      this.#selectionPending = false;
      if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
      this.#setText(
        "#selectionFeedback",
        error instanceof Error
          ? error.message
          : "Unable to send the character selection.",
      );
    }
  }

  #setText (selector: string, value: string) {
    const element = this.querySelector(selector);
    if (element) element.textContent = value;
  }

  #setConnectionStatus (status: string) {
    this.#setText("#connectionStatus", status);
  }

};
