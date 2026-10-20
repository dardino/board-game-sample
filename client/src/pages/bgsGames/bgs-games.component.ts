import { GameDto } from "@dto/matchmaking/game.dto";
import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { ResponseError } from "../../api/baseProxy";
import { BgsComponentTypeStatic } from "../../helpers/components";
import { navigate } from "../../routes/navigation";
import { MatchMakingService } from "../../services/games/matchmaking.service";
import { Registration } from "../../services/registration/registration.service";
import style from "./bgs-games.module.css";
import template from "./bgs-games.template.html?raw";

function getErrorMessage (error: unknown): string {
  if (error instanceof ResponseError) {
    const detail = error.body.detail;
    if (
      detail &&
      typeof detail === "object" &&
      "message" in detail &&
      typeof detail.message === "string"
    ) {
      return detail.message;
    }
    return error.body.message ?? error.statusText;
  }
  return error instanceof Error
    ? error.message
    : "Impossibile creare la partita.";
}

export const BgsGamesComponent: BgsComponentTypeStatic = class BgsGamesComponent extends HTMLElement {

  public static readonly tagName = "bgs-games";

  public static register () {
    customElements.define(
      BgsGamesComponent.tagName,
      BgsGamesComponent,
    );
  }

  #rowTemplate: HTMLTemplateElement;

  #games: GameDto[] = [];

  #eventSource: EventSource | null = null;

  get #gameList () {
    return this.querySelector("#gameList") as HTMLTableElement;
  }

  get #createGameDialog () {
    return this.querySelector("#createGameDialog") as HTMLDialogElement;
  }

  get #progressDialog () {
    return this.querySelector("#progressDialog") as HTMLDialogElement;
  }

  get #createGameError () {
    return this.querySelector("#createGameError") as HTMLParagraphElement;
  }

  get #createGameButton () {
    return this.querySelector("#createGameButton") as HTMLButtonElement;
  }

  get #createGameForm () {
    return this.querySelector("#createGameForm") as HTMLFormElement;
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.render();

    this.#rowTemplate = this.querySelector("template#rowTemplate") as HTMLTemplateElement;
  }

  connectedCallback () {
    this.#createGameButton.addEventListener(
      "click",
      this.#showCreateGameDialog,
    );
    this.#createGameForm.addEventListener(
      "submit",
      this.#submitCreateGameForm,
    );
    this.#connectToLobbyEvents();

    this.#gameList.parentElement?.classList.add(style.table);

    Registration.GetMe().then((userInfo) => {
      if (userInfo === null) {
        navigate("/join");
      }
    });
  }

  disconnectedCallback () {
    this.#createGameButton.removeEventListener(
      "click",
      this.#showCreateGameDialog,
    );
    this.#createGameForm.removeEventListener(
      "submit",
      this.#submitCreateGameForm,
    );
    this.#eventSource?.close();
    this.#eventSource = null;
  }

  async render (updatedGames?: GameDto[]) {
    const games = updatedGames ?? await MatchMakingService.getGames();
    this.#games = games ?? [];
    this.#gameList.innerHTML = "";

    this.#games.forEach((row) => {
      const tr = this.#rowTemplate.content.querySelector("tr")?.cloneNode(true) as HTMLTableRowElement;
      tr.setAttribute(
        "type",
        "dataRow",
      );
      tr.querySelector("td[part=\"id\"]")!.textContent = row.gameId.toString();
      tr.querySelector("td[part=\"description\"]")!.textContent = row.title.toString();
      tr.querySelector("td[part=\"players\"]")!.textContent = `${row.joinedPlayers}/${row.playersMax}`;
      tr.querySelector("td[part=\"joinButton\"]>button")?.addEventListener(
        "click",
        this.#goToGame,
      );

      this.#gameList.append(tr);
    });
  }

  #goToGame = (event: Event) => {
    const gameId = (event.target as HTMLButtonElement)?.closest("tr")?.querySelector("td[part=\"id\"]")?.textContent ?? null;
    if (!gameId) return;
    navigate(
      "/game/:id",
      { id: gameId.toString() },
    );
  };

  #connectToLobbyEvents () {
    this.#eventSource = new EventSource("/api/mm/events");
    this.#eventSource.onmessage = this.#handleLobbyEvent;
  }

  #handleLobbyEvent = (message: MessageEvent<string>) => {
    try {
      const event = JSON.parse(message.data) as GameEvent;
      if (event.type === "lobbies-updated") {
        void this.render(event.games);
      }
    } catch (error) {
      console.error("Unable to process lobby event:", error);
    }
  };

  #showCreateGameDialog = () => {
    this.#createGameDialog.showModal();
  };

  #submitCreateGameForm = async (event: SubmitEvent) => {
    event.preventDefault();
    this.#createGameDialog.close();
    this.#createGameError.textContent = "";
    this.#progressDialog.showModal();
    try {
      const gameId = await MatchMakingService.createGame((this.#createGameForm["gameName"] as HTMLInputElement).value);
      this.#progressDialog.close();
      navigate(
        "/game/:id",
        { id: gameId.toString() },
      );
    } catch (error) {
      console.error("Error creating game:", error);
      this.#progressDialog.close();
      this.#createGameError.textContent = getErrorMessage(error);
      this.#createGameDialog.showModal();
    }
  };

};
