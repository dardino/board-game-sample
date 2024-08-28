import { Flow } from "../rules/gameone.flow";
import { AllPossibleAction, AllPossibleActionKind, GameoneState } from "../rules/state.types";

const autoPlayerActionsDone = new Set<AllPossibleActionKind>([]);

export const autoPlayer = (
  state: GameoneState,
  nextAction: (state: GameoneState, action: AllPossibleAction) => GameoneState,
) => {

  let newState = state;
  while (true) {

    const action = getAction(newState);
    if (action) {

      if (autoPlayerActionsDone.has(action.kind)) {

        throw new Error("Recursive action detected!, executed actions: " + Array.from(autoPlayerActionsDone.values()).join(", "));

      }

      autoPlayerActionsDone.add(action.kind);

      newState = nextAction(
        newState,
        action,
      );

    } else {

      autoPlayerActionsDone.clear();
      break;

    }

  }
  return newState;

};

function getAction (state: GameoneState): AllPossibleAction | null {

  switch (state.previousAction) {

    // Setup
    case "SetPlayers":
    case "DrawBoss":
    case "ShuffleTiles":
    case "PlaceFirstTile":
    case "CharacterSelection":
      return {
        phase: "Setup",
        kind: Flow.Setup[state.previousAction][0],
      };
    case "SetPlayngOrder":
      return null;
    case "GoToPlayerTurn":
      return {
        phase: "PlayerTurn",
        kind: "Awake",
        playerId: -1, // unico caso in cui non serve il player id
      };
    // PlayerTurn
    case "Move":
      if (
        state.allowedNextActions.length === 1 &&
        state.allowedNextActions[0] === "PickATile"
      ) {

        return {
          phase: "PlayerTurn",
          kind: "PickATile",
          playerId: state.players[state.currentPlayerIndex],
          position: state.placeTileAt!,
        };

      } else {

        return null;

      }
    case "PickATile":
    case "Awake":
    case "Fight":
    case "PlaceTile":
      return null;
    case "Pass":
      return {
        phase: "PhaseFeed",
        kind: "CheckEndGame",
      };
    // End Game
    case "CheckEndGame":
      return getCheckEndGameAction(state);
    case "MoveNextEnemy":
      return {
        phase: "PhaseFeed",
        kind: "CheckEndGame",
      };
    case "AssignRating":
      return null;

  }
  return null;

}

/**
 * Returns the next action to be performed based on the current game state.
 *
 * @param {GameoneState} state - The current game state.
 * @returns {AllPossibleAction | null} The next action to be performed, or null if no action is available.
 */
function getCheckEndGameAction (state: GameoneState): AllPossibleAction | null {

  const nextAction = (state.allowedNextActions as typeof Flow.PhaseFeed.CheckEndGame)[0];
  switch (nextAction) {

    case "AssignRating":
      return {
        phase: "EndGame",
        kind: "AssignRating",
      };
    case "MoveNextEnemy":
      return {
        phase: "PhaseFeed",
        kind: "MoveNextEnemy",
      };
    case "GoToPlayerTurn":
      return {
        phase: "Setup",
        kind: "GoToPlayerTurn",
      };
    default:
      return null;

  }

}
