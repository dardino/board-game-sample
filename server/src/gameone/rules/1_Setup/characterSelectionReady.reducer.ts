import {
  CharacterRevealReadyAction,
  CharacterSelectionReadyAction,
  FinishCharacterRevealAction,
  GameoneState,
  StateReducer,
} from "../state.types";
import { Flow } from "../gameone.flow";

export const CharacterSelectionReadyReducer: StateReducer<
  CharacterSelectionReadyAction
> = (state, action) => {
  if (!state.players.includes(action.playerId)) {
    throw new Error("Il giocatore non appartiene a questa partita.");
  }
  if (state.characterSelectionReadyPlayers.includes(action.playerId)) {
    throw new Error("Hai già premuto ready.");
  }
  return {
    characterSelectionReadyPlayers: [...state.characterSelectionReadyPlayers, action.playerId],
    previousAction: action.kind,
  };
};

export const CharacterRevealReadyReducer: StateReducer<
  CharacterRevealReadyAction
> = (state, action) => {
  if (typeof action.playerId !== "number" || !state.players.includes(action.playerId)) {
    throw new Error("Il giocatore non appartiene a questa partita.");
  }
  if (state.characterRevealReadyPlayers.includes(action.playerId)) {
    throw new Error("Hai già premuto ready.");
  }
  return {
    characterRevealReadyPlayers: [...state.characterRevealReadyPlayers, action.playerId],
    previousAction: action.kind,
  };
};

export const FinishCharacterRevealReducer: StateReducer<
  FinishCharacterRevealAction
> = (_state, action): Partial<GameoneState> => ({
  phase: "Setup",
  previousAction: action.kind,
  allowedNextActions: Flow.CharacterReveal.FinishCharacterReveal,
  characterSelectionReadyPlayers: [],
  characterRevealReadyPlayers: [],
  characterPreferences: [],
});
