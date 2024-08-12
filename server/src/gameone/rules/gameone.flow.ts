import {
  AllPossibleAction,
  AllPossibleActionKind,
  GamePhases,
} from "./state.types";

type InferKindsByPhase<Phase extends GamePhases> = (AllPossibleAction & {
  phase: Phase;
})["kind"];

/**
 * Descrive azione per azione cosa è possibile fare se l'azione viene risolta.
 * non tutte le azioni indicate possono realmente essere fatte, dipende dallo stato della partita
 * tuttavia non è possibile effettuare azioni differenti da quelle elencate.
 *
 * Per esempio:
 * Se il giocatore ha effettuato un movimento non è detto che ne possa fare altri
 */
export const Flow = {
  Setup: {
    SetPlayers: ["DrawBoss"],
    DrawBoss: ["ShuffleTiles"],
    ShuffleTiles: ["PlaceFirstTile"],
    PlaceFirstTile: ["SetPlayngOrder"],
    SetPlayngOrder: ["CharacterSelection"],
    CharacterSelection: ["GoToPlayerTurn"],
    GoToPlayerTurn: ["Awake"],
  },
  PlayerTurn: {
    Pass: ["CheckEndGame"],
    Awake: ["Move", "Fight", "Pass"],
    Fight: ["Move", "Fight", "Pass"],
    Move: ["Move", "Fight", "PickATile", "Pass"],
    PickATile: ["PlaceTile"],
    PlaceTile: ["Move", "Fight", "Pass"],
  },
  PhaseFeed: {
    CheckEndGame: ["AssignRating", "MoveNextEnemy"],
    MoveNextEnemy: ["CheckEndGame"],
  },
  EndGame: {
    AssignRating: [],
  },
} satisfies {
  [key in GamePhases]: {
    [kind in InferKindsByPhase<key>]: AllPossibleActionKind[];
  };
};

const PlayerActions = Object.keys(Flow.PlayerTurn);
export function isPlayerAction(
  action: AllPossibleActionKind,
): action is InferKindsByPhase<"PlayerTurn"> {
  return PlayerActions.includes(action);
}

export const removeActionFromArray = <T extends GamePhases>(
  availableActions: InferKindsByPhase<T>[],
  action: InferKindsByPhase<T>,
) => {
  const ix = availableActions.indexOf(action);
  if (ix >= 0) availableActions.splice(ix, 1);
};
