import { Flow } from "../gameone.flow";
import { CheckEndGameAction, GameoneState, StateReducer } from "../state.types";

/**
 * La partita finisce se il Boss è stato ucciso o se tutti i giocatori sono morti
 * @returns
 */
export const CheckEndGameReducer: StateReducer<CheckEndGameAction> = (
  state,
  action,
) => {
  const newState: Partial<GameoneState> = {
    previousAction: action.kind,
    phase: "PhaseFeed",
  };
  const isBossDead = state.boss?.life === 0;
  const allPlayersDead = state.charactersByPlayers.every(
    (character) => character.character.life <= 0,
  );
  if (isBossDead || allPlayersDead) {
    // partita finita
    newState.allowedNextActions = Flow.PhaseFeed.CheckEndGame.filter(
      (act) => act === "AssignRating",
    );
    newState.phase = "EndGame";
  } else {
  }
  return newState;
};
