import { CHARACTERS } from "@/gameone/gameone-contents";
import { Flow } from "../gameone.flow";
import {
  CharacterSelectionAction,
  GameoneState,
  StateReducer,
} from "../state.types";

function buildCharacters ({
  characterId,
  characterName,
  playerId,
}: CharacterSelectionAction): GameoneState["charactersByPlayers"][number] {

  const character = CHARACTERS.find((char) => char.characterId === characterId);
  if (!character) throw new Error("Non ho trovato un personaggio con questo id: " + characterId);
  return {
    playerId,
    character: {
      ...character,
      characterName,
      life: character.startingLife,
      energy: character.startingEnergy,
    },
  };

}

export const CharacterSelectionReducer: StateReducer<
  CharacterSelectionAction
> = (state, action) => {
  if (!state.players.includes(action.playerId)) {
    throw new Error("Il giocatore non appartiene a questa partita.");
  }
  if (state.charactersByPlayers.some((selection) => selection.playerId === action.playerId)) {
    throw new Error("Il giocatore ha già scelto un personaggio.");
  }
  if (state.charactersByPlayers.some((selection) => selection.character.characterId === action.characterId)) {
    throw new Error("Il personaggio è già stato scelto.");
  }

  const charactersByPlayers = [
    ...state.charactersByPlayers,
    buildCharacters(action),
  ];
  const allPlayersSelected = state.players.every((playerId) => {
    return charactersByPlayers.some((selection) => selection.playerId === playerId);
  });

  return {
    charactersByPlayers,
    allowedNextActions: allPlayersSelected
      ? Flow.Setup.CharacterSelection
      : ["CharacterSelection"],
    previousAction: action.kind,
  };

};
