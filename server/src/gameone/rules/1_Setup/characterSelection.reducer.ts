import { CHARACTERS } from "@/gameone/gameone-contents";
import {
  CharacterSelectionAction,
  GameoneState,
  ResolveCharacterSelectionAction,
  StateReducer,
} from "../state.types";

function buildCharacter ({
  characterId,
  characterName,
  playerId,
}: GameoneState["characterPreferences"][number]): GameoneState["charactersByPlayers"][number] {

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
  if (state.characterSelectionReadyPlayers.includes(action.playerId)) {
    throw new Error("Non puoi modificare la scelta dopo aver premuto ready.");
  }
  if (!CHARACTERS.some((character) => character.characterId === action.characterId)) {
    throw new Error("Non ho trovato un personaggio con questo id: " + action.characterId);
  }

  const preference = {
    playerId: action.playerId,
    characterId: action.characterId,
    characterName: action.characterName,
  };
  let characterPreferences = state.characterPreferences;
  if (characterPreferences.some((entry) => entry.playerId === action.playerId)) {
    characterPreferences = characterPreferences.map((entry) => {
      if (entry.playerId === action.playerId) return preference;
      return entry;
    });
  } else {
    characterPreferences = [...characterPreferences, preference];
  }

  return {
    characterPreferences,
    allowedNextActions: ["CharacterSelection", "CharacterSelectionReady", "ResolveCharacterSelection"],
    previousAction: action.kind,
  };

};

export const ResolveCharacterSelectionReducer: StateReducer<
  ResolveCharacterSelectionAction
> = (state, action) => {
  const preferencesByCharacter = new Map<number, typeof state.characterPreferences>();
  for (const preference of state.characterPreferences) {
    const preferences = preferencesByCharacter.get(preference.characterId) ?? [];
    preferences.push(preference);
    preferencesByCharacter.set(preference.characterId, preferences);
  }

  const assignments = new Map<number, typeof state.characterPreferences[number]>();
  const assignedCharacterIds = new Set<number>();
  for (const [characterId, preferences] of preferencesByCharacter) {
    const winner = preferences[Math.floor(Math.random() * preferences.length)];
    if (!winner) continue;
    assignments.set(winner.playerId, winner);
    assignedCharacterIds.add(characterId);
  }

  const unassignedPlayers = state.players.filter((playerId) => !assignments.has(playerId));
  const availableCharacters = CHARACTERS.filter((character) => !assignedCharacterIds.has(character.characterId));
  for (const playerId of unassignedPlayers) {
    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    const character = availableCharacters.splice(randomIndex, 1)[0];
    if (!character) throw new Error("Non ci sono personaggi disponibili per tutti i giocatori.");
    assignments.set(playerId, {
      playerId,
      characterId: character.characterId,
      characterName: character.characterClass,
    });
  }

  const charactersByPlayers = state.players.map((playerId) => {
    const assignment = assignments.get(playerId);
    if (!assignment) throw new Error("Non è stato possibile assegnare un personaggio al giocatore.");
    return buildCharacter(assignment);
  });

  return {
    charactersByPlayers,
    phase: "CharacterReveal",
    previousAction: action.kind,
    allowedNextActions: ["CharacterRevealReady", "FinishCharacterReveal"],
    characterRevealReadyPlayers: [],
  };
};
