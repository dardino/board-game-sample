import { Flow } from "../gameone.flow";
import { SetPlayersAction, StateReducer } from "../state.types";

//#region SetPlayers
export const SetPlayersReducer: StateReducer<SetPlayersAction> = (
  _state,
  action,
) => {
  return {
    players: action.players,
    previousAction: action.kind,
    allowedNextActions: Flow.Setup.SetPlayers,
  };
};
//#endregion SetPlayers
