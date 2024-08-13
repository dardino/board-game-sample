import { Flow } from "../gameone.flow";
import { PassAction, StateReducer } from "../state.types";

export const PassReducer: StateReducer<PassAction> = (state, action) => {

  return {
    previousAction: action.kind,
    phase: "PhaseFeed",
    allowedNextActions: Flow.PlayerTurn.Pass.filter((act) => act === "CheckEndGame"),
    tileToPlace: null,
    placeTileAt: null,
    currentPlayerPerformedActions: state.currentPlayerPerformedActions.concat([action.kind]),
  };

};
