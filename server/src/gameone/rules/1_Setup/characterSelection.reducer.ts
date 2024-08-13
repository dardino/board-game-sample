import { CHARACTERS } from "src/gameone/gameone-contents";
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
}: CharacterSelectionAction["selectedCharacters"][number]): GameoneState["charactersByPlayers"][number] {

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
> = (_state, action) => {

  return {
    charactersByPlayers: action.selectedCharacters.map(buildCharacters),
    allowedNextActions: Flow.Setup.CharacterSelection,
    previousAction: action.kind,
  };

};
