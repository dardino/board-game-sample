import { shuffleArray } from "src/tools/arrays";
import { Flow } from "../gameone.flow";
import {
  GameoneState,
  SetPlayngOrderAction,
  StateReducer,
} from "../state.types";

//#region SetPlayngOrder
export const SetPlayngOrderReducer: StateReducer<SetPlayngOrderAction> = (
  state,
  action,
) => {
  return {
    players: shuffleArray(state.players),
    allowedNextActions: Flow.Setup.SetPlayngOrder,
    previousAction: action.kind,
  } satisfies Partial<GameoneState>;
};
//#endregion SetPlayngOrder
