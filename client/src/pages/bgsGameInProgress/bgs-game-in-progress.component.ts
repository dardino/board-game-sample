import { BgsComponentTypeStatic } from "../../helpers/components";
import {
  GameChatMessageResultEvent,
  GameChatState,
  GameCharacterSelectionStatus,
  GameActionResultEvent,
  GameStateErrorEvent,
  GameStateEvent,
} from "@dto/game-state.dto/game-state.dto";
import { matchPath, navigate } from "../../routes/navigation";
import { Registration } from "../../services/registration/registration.service";
import { BgsGameChatComponent } from "./components/bgs-game-chat/bgs-game-chat.component";
import { BgsGameSidebarComponent } from "./components/bgs-game-sidebar/bgs-game-sidebar.component";
import style from "./bgs-game-in-progress.module.css";
import template from "./bgs-game-in-progress.template.html?css-module";

interface BgsGameChatElement extends HTMLElement {
  setChatState (state: GameChatState, currentPlayerId: number): void;
  completeSend (result: GameChatMessageResultEvent): void;
  failSend (message: string): void;
}

function isGameChatState (value: unknown): value is GameChatState {
  if (!isRecord(value) || !Array.isArray(value.messages)) return false;
  return value.messages.every((message) => {
    return isRecord(message) &&
      typeof message.playerId === "number" &&
      typeof message.nickname === "string" &&
      typeof message.text === "string" &&
      typeof message.sentAt === "string";
  });
}

function isCharacterSelectionStatus (value: unknown): value is GameCharacterSelectionStatus {
  if (typeof value !== "object" || value === null) return false;
  if (!("stage" in value) || value.stage !== null && value.stage !== "choosing" && value.stage !== "revealing") return false;
  if (!("endsAt" in value) || value.endsAt !== null && typeof value.endsAt !== "number") return false;
  if (!("readyPlayerIds" in value) || !Array.isArray(value.readyPlayerIds) ||
    !value.readyPlayerIds.every((playerId) => typeof playerId === "number")) return false;
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
    "chat" in message &&
    isGameChatState(message.chat) &&
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
    (!("code" in message) ||
      message.code === "GAME_NOT_FOUND" ||
      message.code === "NOT_A_PLAYER");
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

function isGameChatMessageResultEvent (message: unknown): message is GameChatMessageResultEvent {
  if (!isRecord(message) ||
    message.type !== "chat-message-result" ||
    typeof message.requestId !== "string" ||
    typeof message.gameId !== "number" ||
    message.status !== "accepted" && message.status !== "rejected") {
    return false;
  }
  return message.status === "accepted" ||
    isRecord(message.error) &&
    typeof message.error.code === "string" &&
    typeof message.error.message === "string";
}

export const BgsGameInProgressComponent: BgsComponentTypeStatic = class BgsGameInProgressComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-in-progress";

  #socket: WebSocket | null = null;

  #gameId: number | null = null;

  #playerId: number | null = null;

  #lastGameState: GameStateEvent | null = null;

  #selectionPending = false;

  #selectionClock: ReturnType<typeof setInterval> | null = null;

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
    if (!customElements.get(BgsGameSidebarComponent.tagName)) {
      BgsGameSidebarComponent.register();
    }
    if (!customElements.get(BgsGameChatComponent.tagName)) {
      BgsGameChatComponent.register();
    }
    customElements.define(
      BgsGameInProgressComponent.tagName,
      BgsGameInProgressComponent,
    );
  }

  connectedCallback () {
    this.#leavingPage = false;
    this.addEventListener("game-chat-send", this.#handleChatSend);
    this.#selectionClock = setInterval(() => {
      if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
    }, 1000);
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
    void this.#connectToGame(gameId);
  }

  async #connectToGame (gameId: number) {
    let player: Awaited<ReturnType<typeof Registration.GetMe>>;
    try {
      player = await Registration.GetMe();
    } catch (error) {
      console.error("Unable to load the current player:", error);
      this.#setConnectionStatus("Unable to load player identity.");
      return;
    }
    if (this.#leavingPage) return;
    if (player === null) {
      if (Registration.status === "error") {
        this.#setConnectionStatus(Registration.Errors.join(" "));
      } else {
        navigate("/join");
      }
      return;
    }

    this.#playerId = player.id;
    const url = new URL("/ws", location.href);
    url.protocol = url.protocol === "https:"
      ? "wss:"
      : "ws:";
    this.#socket = new WebSocket(url);
    this.#socket.addEventListener("open", () => {
      this.#socket?.send(JSON.stringify({
        type: "subscribe",
        gameId,
        playerId: player.id,
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
    const playerId = this.#playerId;
    if (!socket || socket.readyState !== WebSocket.OPEN || gameId === null || playerId === null) {
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
          actorPlayerId: playerId,
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
    this.removeEventListener("game-chat-send", this.#handleChatSend);
    if (this.#selectionClock !== null) {
      clearInterval(this.#selectionClock);
      this.#selectionClock = null;
    }
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
      if (message.code === "GAME_NOT_FOUND" || message.code === "NOT_A_PLAYER") {
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
    } else if (isGameChatMessageResultEvent(message)) {
      this.querySelector<BgsGameChatElement>("#gameChat")?.completeSend(message);
    }
  };

  #handleChatSend = (event: Event) => {
    if (!(event instanceof CustomEvent) || !isRecord(event.detail) ||
      typeof event.detail.message !== "string") {
      return;
    }

    const socket = this.#socket;
    const gameId = this.#gameId;
    const chat = this.querySelector<BgsGameChatElement>("#gameChat");
    if (!socket || socket.readyState !== WebSocket.OPEN || gameId === null) {
      chat?.failSend("The game connection is not open.");
      return;
    }

    try {
      socket.send(JSON.stringify({
        type: "chat-message",
        requestId: crypto.randomUUID(),
        gameId,
        message: event.detail.message,
      }));
    } catch (error) {
      chat?.failSend(error instanceof Error
        ? error.message
        : "Unable to send the chat message.");
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
    const layout = this.querySelector<HTMLElement>("#gameLayout");
    const sidebar = this.querySelector<HTMLElement>("#gameSidebar");
    if (layout && sidebar) {
      sidebar.hidden = false;
      layout.classList.add(style.gameLayoutWithSidebar);
    }
    if (this.#playerId !== null) {
      this.querySelector<BgsGameChatElement>("#gameChat")?.setChatState(
        state.chat,
        this.#playerId,
      );
    }
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
    const isChoosing = selection.stage === "choosing" && state.phase === "Setup";
    const isRevealing = selection.stage === "revealing" && state.phase === "CharacterReveal";
    panel.hidden = !isChoosing && !isRevealing;
    if (!isChoosing && !isRevealing) return;

    const playerId = this.#playerId;
    if (playerId === null) return;
    const player = selection.players.find((candidate) => candidate.playerId === playerId);
    const isReady = selection.readyPlayerIds.includes(playerId);
    const canChoose = Boolean(player && isChoosing && !isReady);

    let instructions = "Join this game to select a character.";
    if (isRevealing) {
      instructions = "These are the final character assignments. The game will begin shortly.";
    } else if (player && isReady) {
      instructions = "You're ready. Your preference is locked while the others finish.";
    } else if (player) {
      instructions = "Choose or change your preference. Multiple players can choose the same character.";
    }
    this.#setText("#selectionInstructions", instructions);
    if (!this.#selectionPending) {
      this.#setText(
        "#selectionFeedback",
        isRevealing
          ? `${selection.readyPlayerIds.length} of ${selection.players.length} players are ready.`
          : `${selection.selectedCharacters.length} of ${selection.players.length} players have chosen.`,
      );
    }
    this.#setText(
      "#selectionTimer",
      selection.endsAt === null
        ? ""
        : `${Math.max(0, Math.ceil((selection.endsAt - Date.now()) / 1000))}s`,
    );
    const readyButton = this.querySelector<HTMLButtonElement>("#selectionReady");
    if (readyButton) {
      readyButton.hidden = !player;
      readyButton.disabled = !player || isReady || this.#selectionPending;
      readyButton.textContent = isReady
        ? "Ready ✓"
        : "Ready";
      readyButton.onclick = () => {
        void this.#readyForNextPhase(isChoosing);
      };
    }

    const themes: Record<string, string> = {
      Chierico: style.characterThemeCleric,
      Barbaro: style.characterThemeBarbarian,
      Mago: style.characterThemeMage,
      Ladro: style.characterThemeRogue,
      Bardo: style.characterThemeBard,
    };
    grid.replaceChildren(...selection.availableCharacters.map((character) => {
      const selected = selection.selectedCharacters.filter((candidate) => candidate.characterId === character.characterId);
      const ownPreference = selected.some((candidate) => candidate.playerId === playerId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `${style.characterCard} ${themes[character.characterClass] ?? style.characterThemeFallback}`;
      if (ownPreference) button.classList.add(style.characterCardPreferred);
      button.disabled = !canChoose || this.#selectionPending;
      button.setAttribute("aria-pressed", String(ownPreference));

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
      if (isRevealing) {
        availability.textContent = selection.selectedCharacters.find((candidate) => candidate.characterId === character.characterId)?.nickname ?? "Assigned";
      } else if (ownPreference) {
        availability.textContent = "Your preference";
      } else if (canChoose) {
        availability.textContent = "Choose character";
      } else {
        availability.textContent = "Waiting";
      }
      button.append(characterClass, name, stats, availability);
      if (selected.length > 0) {
        const count = document.createElement("span");
        count.className = style.characterCount;
        count.textContent = String(selected.length);
        count.setAttribute("aria-label", `Chosen by ${selected.length} players`);
        button.append(count);
      }
      if (canChoose) {
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
    const playerId = this.#playerId;
    if (playerId === null) return;

    this.#selectionPending = true;
    this.#setText("#selectionFeedback", `Selecting ${characterName}...`);
    if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
    try {
      const result = await this.sendGameAction({
        phase: "Setup",
        kind: "CharacterSelection",
        playerId,
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

  async #readyForNextPhase (isChoosing: boolean) {
    const playerId = this.#playerId;
    if (playerId === null || this.#selectionPending) return;
    this.#selectionPending = true;
    this.#setText("#selectionFeedback", "Confirming ready...");
    if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
    try {
      const phase = isChoosing
        ? "Setup"
        : "CharacterReveal";
      const kind = isChoosing
        ? "CharacterSelectionReady"
        : "CharacterRevealReady";
      const result = await this.sendGameAction({
        phase,
        kind,
        playerId,
      });
      this.#selectionPending = false;
      if (result.status !== "accepted") {
        this.#setText("#selectionFeedback", result.error?.message ?? "Unable to confirm ready.");
      } else if (this.#lastGameState) {
        this.#renderCharacterSelection(this.#lastGameState);
      }
    } catch (error) {
      this.#selectionPending = false;
      this.#setText(
        "#selectionFeedback",
        error instanceof Error
          ? error.message
          : "Unable to confirm ready.",
      );
      if (this.#lastGameState) this.#renderCharacterSelection(this.#lastGameState);
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
