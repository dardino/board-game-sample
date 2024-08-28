import { Flow } from "../gameone.flow";
import { CheckEndGameAction, GameoneState, StateReducer } from "../state.types";

/**
 * La partita finisce se il Boss è stato ucciso o se tutti i giocatori sono morti
 * @returns
 */
export const CheckEndGameReducer: StateReducer<CheckEndGameAction> = (
  oldState,
  action,
) => {

  const newState: Partial<GameoneState> = {
    previousAction: action.kind,
    phase: "PhaseFeed",
  };
  const isBossDead = oldState.boss?.life === 0;
  const allPlayersDead = oldState.charactersByPlayers.every((character) => character.character.life <= 0);
  if (isBossDead || allPlayersDead) {

    // partita finita
    newState.allowedNextActions = Flow.PhaseFeed.CheckEndGame.filter((act) => act === "AssignRating");
    newState.phase = "EndGame";

  } else {

    const enemies = newState.onboardTiles?.map((tile) => tile.enemiesIn).flat() ?? [];
    const nextPlayerIndex = (oldState.currentPlayerIndex + 1) % oldState.players.length;
    if (nextPlayerIndex === 0) {

      // è finito un giro intero, eseguo le operazioni di fine giro
      throw new Error("not implemented");

    }
    if (enemies.length === 0) {

      // go to next player
      newState.phase = "PlayerTurn";
      newState.previousAction = action.kind;
      newState.allowedNextActions = Flow.Setup.GoToPlayerTurn;
      newState.currentPlayerIndex = nextPlayerIndex;
      newState.currentPlayerPerformedActions = [];


    } else {

      // TODO: move enemies
      throw new Error("not implemented");

    }

  }
  return newState;

};
