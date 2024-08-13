import { Flow } from "../gameone.flow";
import { AwakeAction, StateReducer } from "../state.types";

/**
 * Attiva il giocatore di turno
 * @param state stato attuale da cui capire chi è di turno
 * @returns
 */
export const AwakeReducer: StateReducer<AwakeAction> = (state) => {

  let nextPlayer =
    state.previousAction === "GoToPlayerTurn"
      ? 0
      : state.currentPlayerIndex + 1;
  if (nextPlayer >= state.players.length) nextPlayer = 0;

  return {
    previousAction: "Awake",
    currentPlayerIndex: nextPlayer,
    currentPlayerPerformedActions: ["Awake"],
    allowedNextActions: Flow.PlayerTurn.Awake,
  };

};
