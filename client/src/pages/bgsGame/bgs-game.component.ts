import { GameDto } from "@dto/matchmaking/game.dto";
import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { BgsComponentTypeStatic } from "../../helpers/components";
import { matchPath, navigate } from "../../routes/navigation";
import { GameService } from "../../services/game/game.service";
import { Registration } from "../../services/registration/registration.service";
import style from "./bgs-game.module.css";
import template from "./bgs-game.template.html?raw";

export const BgsGameComponent: BgsComponentTypeStatic = class BgsGameComponent extends HTMLElement {

  public static readonly tagName = "bgs-game";

  #joinPromise: Promise<number> | null = null;

  #leavePromise: Promise<void> | null = null;

  #isJoined = false;

  #navigatingToGame = false;

  #eventSource: EventSource | null = null;

  #gameState: GameDto | null = null;

  get #button () {
    return this.querySelector("#cancelJoiningButton") as HTMLButtonElement;
  }

  get #startButton () {
    return this.querySelector("#startGameButton") as HTMLButtonElement;
  }

  public static register () {
    customElements.define(
      BgsGameComponent.tagName,
      BgsGameComponent,
    );
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.classList.add(style.game);
    this.render();

    const gameId = parseInt(matchPath(
      "/game/:id",
      location.pathname,
    )?.params.id ?? "NaN");
    if (isNaN(gameId)) {
      navigate("/games");
    }
    GameService.Initialize(gameId);
  }

  get #joiningDialog () {
    return this.querySelector("#joining") as HTMLDialogElement;
  }

  get #joiningDialogPhase () {
    return this.querySelector("#joiningDialogPhase") as HTMLParagraphElement;
  }

  get #joinedPlayersList () {
    return this.querySelector("#joinedPlayersList") as HTMLUListElement;
  }


  async render () {
    //
  }

  async #connect () {
    this.#joiningDialog.showModal();
    this.#joiningDialogPhase.textContent = "Connecting to server...";
    this.#joinPromise = GameService.ConnectToGame().then((joinedGameId) => {
      this.#isJoined = true;
      return joinedGameId;
    });
    try {
      await this.#joinPromise;
    } catch (error) {
      console.error("Error connecting to game:", error);
      navigate("/games");
      return;
    }
    this.#eventSource = new EventSource(`/api/mm/events?gameId=${encodeURIComponent(GameService.GameId)}`);
    this.#eventSource.onmessage = this.#handleGameEvent;
    this.#eventSource.onerror = this.#handleEventError;
  }

  connectedCallback () {
    this.#button.addEventListener(
      "click",
      this.#cancelJoining,
    );
    this.#startButton.addEventListener("click", this.#startGame);
    window.addEventListener("beforeunload", this.#handleBeforeUnload);
    window.addEventListener("pagehide", this.#handlePageHide);
    this.#connect();
  }

  disconnectedCallback () {
    this.#button.removeEventListener(
      "click",
      this.#cancelJoining,
    );
    this.#startButton.removeEventListener("click", this.#startGame);
    window.removeEventListener("beforeunload", this.#handleBeforeUnload);
    window.removeEventListener("pagehide", this.#handlePageHide);
    this.#closeEvents();
    if (!this.#navigatingToGame) void this.#leaveGame();
  }

  #handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!this.#isJoined) return;
    event.preventDefault();
    event.returnValue = "";
  };

  #handlePageHide = () => {
    this.#closeEvents();
    void this.#leaveGame(true);
  };

  #handleGameEvent = (message: MessageEvent<string>) => {
    try {
      const event = JSON.parse(message.data) as GameEvent;
      if (event.type === "game-updated" && event.game.gameId === GameService.GameId) {
        if (event.game.elapsed !== null) {
          this.#navigatingToGame = true;
          this.#closeEvents();
          navigate(
            "/game/:id/in-progress",
            { id: event.game.gameId.toString() },
          );
        } else {
          this.#renderGameState(event.game);
        }
      } else if (event.type === "game-removed" && event.gameId === GameService.GameId) {
        this.#isJoined = false;
        this.#closeEvents();
        navigate("/games");
      }
    } catch (error) {
      console.error("Unable to process game event:", error);
    }
  };

  #handleEventError = () => {
    this.#joiningDialogPhase.textContent = "Connection lost. Reconnecting to live updates...";
  };

  #renderGameState (game: GameDto) {
    this.#gameState = game;
    this.#joiningDialogPhase.textContent = game.elapsed === null
      ? `Waiting for other players... (${game.joinedPlayers}/${game.playersMin}-${game.playersMax})`
      : "The game has started.";
    const isStarted = game.elapsed !== null;
    this.#startButton.hidden = game.createdBy !== Registration.NickName || isStarted;
    this.#startButton.disabled = isStarted || game.joinedPlayers < game.playersMin;
    this.#joinedPlayersList.replaceChildren(...game.players.map((nickname) => {
      const player = document.createElement("li");
      player.textContent = nickname;
      return player;
    }));
  }

  #closeEvents () {
    this.#eventSource?.close();
    this.#eventSource = null;
  }

  #leaveGame (keepalive = false): Promise<void> {
    if (!this.#leavePromise) {
      this.#leavePromise = this.#leaveAfterConnect(keepalive);
    }
    return this.#leavePromise;
  }

  async #leaveAfterConnect (keepalive: boolean) {
    if (this.#joinPromise) {
      try {
        await this.#joinPromise;
      } catch {
        return;
      }
    }
    if (!this.#isJoined) return;

    try {
      await GameService.Disconnect(keepalive);
      this.#isJoined = false;
    } catch (error) {
      console.error("Error disconnecting from game:", error);
    }
  }

  #cancelJoining = async () => {
    await this.#leaveGame();
    navigate("/games");
  };

  #startGame = async () => {
    if (
      !this.#gameState ||
      this.#gameState.createdBy !== Registration.NickName ||
      this.#gameState.elapsed !== null ||
      this.#gameState.joinedPlayers < this.#gameState.playersMin
    ) return;

    this.#startButton.disabled = true;
    try {
      await GameService.StartGame();
    } catch (error) {
      console.error("Error starting game:", error);
      this.#startButton.disabled = false;
    }
  };

};
