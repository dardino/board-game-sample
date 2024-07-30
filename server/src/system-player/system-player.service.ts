import { Injectable, Scope } from "@nestjs/common";
import { RuleActionBase } from "src/rule-service-types/game-rule-types";


interface DelayedAction {
  insertedAt: number;
  executeAt: string;
  action: Omit<RuleActionBase<string>, "runAt">;
}

@Injectable({ scope: Scope.DEFAULT })
export class SystemPlayerService {

  /**
   * costruttore della classe
   */
  constructor() {
    // appena viene istanziata questa class lancio un setInterval per eseguire lo scodamento delle azioni
    this.#processAllGamesQueue();
  }

  /**
   * coda delle azioni indicizzata per gameId
   */
  #actionGameQueue: { [key: string]: Array<DelayedAction> } = {};

  /**
   * Aggiunge una azione a "tempo" alla coda delle azioni
   * @param gameId identificativo del game per quando l'azione verrà eseguita
   * @param executeAt indica quando questa azione dovrà essere eseguita
   * @param action azione da eseguire
   */
  addDelayedAction(
    gameId: number,
    action: RuleActionBase<string>,
  ): boolean {
    // mi assicuro che esista una array per questo game ID
    this.#actionGameQueue[gameId.toString()] ??= [];
    const { runAt, ...actionData } = action;
    // aggiungo la action
    this.#actionGameQueue[gameId.toString()].push({
      action: actionData,
      insertedAt: new Date().valueOf(),
      executeAt: action.runAt ?? new Date().toISOString(),
    });
    return true;
  }

  #processing: boolean = false;
  async #processAllGamesQueue() {
    if (this.#processing) return;
    this.#processing = true;
    const games = Object.keys(this.#actionGameQueue);
    await Promise.all(games.map(gameId => this.#processGameQueue(gameId)))
    this.#processing = false;
  }

  async #processGameQueue(gameId: string) {
    const gameActions = this.#actionGameQueue[gameId];

  }
}
