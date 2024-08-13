import { Flow } from "../rules/gameone.flow";
import { AllPossibleAction, GameoneState } from "../rules/state.types";

export const autoPlayer = (
  state: GameoneState,
  nextAction: (state: GameoneState, action: AllPossibleAction) => GameoneState,
) => {

  let newState = state;
  while (true) {

    const action = getAction(newState);
    if (action) {

      newState = nextAction(
        newState,
        action,
      );

    } else {

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
    {

      const nextAction = (
        state.allowedNextActions as typeof Flow.PhaseFeed.CheckEndGame
      )[0];
      return nextAction === "AssignRating"
        ? {
          phase: "EndGame",
          kind: "AssignRating",
        }
        : {
          phase: "PhaseFeed",
          kind: nextAction,
        };

    }
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
