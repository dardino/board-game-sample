import { GameDto } from "@dto/matchmaking/game.dto";
import { BgsComponentTypeStatic } from "../../helpers/components";
import { navigate } from "../../routes/navigation";
import { MatchMakingService } from "../../services/games/matchmaking.service";
import style from "./bgs-games.module.css";
import template from "./bgs-games.template.html?raw";

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

  get #gameList () {
    return this.querySelector("#gameList") as HTMLTableElement;
  }

  get #createGameDialog () {
    return this.querySelector("#createGameDialog") as HTMLDialogElement;
  }

  get #progressDialog () {
    return this.querySelector("#progressDialog") as HTMLDialogElement;
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
    this.#createGameButton.addEventListener("click", this.#showCreateGameDialog);
    this.#createGameForm.addEventListener("submit", this.#submitCreateGameForm);

    this.#gameList.parentElement?.classList.add(style.table);
  }

  disconnectedCallback () {
    this.#createGameButton.removeEventListener("click", this.#showCreateGameDialog);
    this.#createGameForm.removeEventListener("submit", this.#submitCreateGameForm);
  }

  async render () {
    const games = await MatchMakingService.getGames();
    this.#games = games ?? [];
    this.#gameList.innerHTML = "";

    this.#games.forEach((row) => {
      const tr = this.#rowTemplate.content.querySelector("tr")?.cloneNode(true) as HTMLTableRowElement;
      tr.setAttribute("type", "dataRow");
      tr.querySelector("td[part=\"id\"]")!.textContent = row.gameId.toString();
      tr.querySelector("td[part=\"description\"]")!.textContent = row.title.toString();
      tr.querySelector("td[part=\"players\"]")!.textContent = `${row.joinedPlayers}/${row.playersMax}`;
      tr.querySelector("td[part=\"joinButton\"]>button")?.addEventListener("click", this.#goToGame);

      this.#gameList.append(tr);
    });
  }

  #goToGame = (event: Event) => {
    const gameId = (event.target as HTMLButtonElement)?.closest("tr")?.querySelector("td[part=\"id\"]")?.textContent ?? null;
    if (!gameId) return;
    navigate("/game/:id", { id: gameId.toString() });
  };

  #showCreateGameDialog = () => {
    this.#createGameDialog.showModal();
  };

  #submitCreateGameForm = async (event: SubmitEvent) => {
    event.preventDefault();
    this.#createGameDialog.close();
    this.#progressDialog.showModal();
    await MatchMakingService.createGame((this.#createGameForm["gameName"] as HTMLInputElement).value);
    await this.render();
    this.#progressDialog.close();
  };

};
