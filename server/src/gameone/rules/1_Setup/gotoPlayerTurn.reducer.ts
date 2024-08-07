import { Flow } from "../gameone.flow";
import { GoToPlayerTurnAction, StateReducer } from "../state.types";

export const GoToPlayerTurnReducer: StateReducer<GoToPlayerTurnAction> = (
  _state,
  action,
) => {
  return {
    phase: "PlayerTurn",
    previousAction: action.kind,
    allowedNextActions: Flow.Setup.GoToPlayerTurn,
    currentPlayerIndex: 0,
    currentPlayerPerformedActions: [],
  };
};
