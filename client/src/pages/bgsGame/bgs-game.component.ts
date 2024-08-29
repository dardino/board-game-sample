import { BgsComponentTypeStatic } from "../../helpers/components";
import { pooling } from "../../helpers/pooling";
import { matchPath, navigate } from "../../routes/navigation";
import { GameService } from "../../services/game/game.service";
import { MatchMakingService } from "../../services/games/matchmaking.service";
import style from "./bgs-game.module.css";
import template from "./bgs-game.template.html?raw";

export const BgsGameComponent: BgsComponentTypeStatic = class BgsGameComponent extends HTMLElement {

  public static readonly tagName = "bgs-game";

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

    const gameId = parseInt(matchPath("/game/:id", location.pathname)?.params.id ?? "NaN");
    if (isNaN(gameId)) {
      navigate("/games");
    }

    GameService.Initialize(gameId);
    this.#connect();
  }

  get #joiningDialog () {
    return this.querySelector("#joining") as HTMLDialogElement;
  }

  get #joiningDialogPhase () {
    return this.querySelector("#joiningDialogPhase") as HTMLParagraphElement;
  }


  async render () {
    //
  }

  async #connect () {
    this.#joiningDialog.showModal();
    this.#joiningDialogPhase.textContent = "Connecting to server...";
    await GameService.ConnectToGame();
    this.#joiningDialogPhase.textContent = "Waiting for other players...";
    await pooling(async () => {
      const game = await MatchMakingService.getGame(GameService.GameId);
      if (!game) {
        return false;
      }
      this.#joiningDialogPhase.textContent = `Waiting for other players... (${game.joinedPlayers}/${game.playersMin}-${game.playersMax})`;
      return true;
    }, 1000);
  }

};
