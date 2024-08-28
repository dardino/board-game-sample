import { Flow } from "../gameone.flow";
import { GoToPlayerTurnAction, StateReducer } from "../state.types";


/**
 * Reducer for "GoToPlayerTurn" action.
 *
 * It changes the game phase to "PlayerTurn" and initializes the current player state.
 *
 * @param _state - The current state of the game.
 * @param action - The action to be reduced. It must be a "GoToPlayerTurnAction" object.
 * @returns The new state of the game, with the phase changed to "PlayerTurn" and the current player initialized.
 */
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
