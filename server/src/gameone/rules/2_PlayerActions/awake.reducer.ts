import { Flow } from "../gameone.flow";
import { AwakeAction, StateReducer } from "../state.types";

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
