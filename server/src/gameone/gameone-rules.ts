import { autoPlayer } from "./autoplayer/autoplayer.middle";
import { CharacterSelectionReducer } from "./rules/1_Setup/characterSelection.reducer";
import { DrawBossReducer } from "./rules/1_Setup/drawBoss.reducer";
import { GoToPlayerTurnReducer } from "./rules/1_Setup/gotoPlayerTurn.reducer";
import { PlaceFirstTileReducer } from "./rules/1_Setup/placeFirstTile.reducer";
import { SetPlayersReducer } from "./rules/1_Setup/setPlayers.reducer";
import { SetPlayngOrderReducer } from "./rules/1_Setup/setPlayingOrder.reducer";
import { ShuffleTilesReducer } from "./rules/1_Setup/shuffleDeck.reducer";
import { AwakeReducer } from "./rules/2_PlayerActions/awake.reducer";
import { FightReducer } from "./rules/2_PlayerActions/fight.reducer";
import { MoveReducer } from "./rules/2_PlayerActions/move.reducer";
import { PassReducer } from "./rules/2_PlayerActions/pass.reducer";
import { PickATileReducer } from "./rules/2_PlayerActions/pickATile.reducer";
import { PlaceTileReducer } from "./rules/2_PlayerActions/placeTIle.reducer";
import { CheckEndGameReducer } from "./rules/3_PhaseFeed/checkEndGame.reducer";
import { MoveNextEnemyReducer } from "./rules/3_PhaseFeed/moveNextEnemy.reducer";
import { AssignRatingReducer } from "./rules/4_EndGame/assignRating.reducer";
import {
  AllPossibleAction,
  AllPossibleActionKind,
  GameoneState,
  StateReducer,
} from "./rules/state.types";

// #region PHASE: "PlayerTurn"

// #endregion PHASE: "PlayerTurn"
type InferActionByKind<Kind extends AllPossibleActionKind> =
  AllPossibleAction & { kind: Kind };
const allActionsMap: {
  [key in AllPossibleActionKind]: StateReducer<InferActionByKind<key>>;
} = {
  // 1 Setup
  SetPlayers: SetPlayersReducer,
  ShuffleTiles: ShuffleTilesReducer,
  PlaceFirstTile: PlaceFirstTileReducer,
  DrawBoss: DrawBossReducer,
  SetPlayngOrder: SetPlayngOrderReducer,
  CharacterSelection: CharacterSelectionReducer,
  GoToPlayerTurn: GoToPlayerTurnReducer,
  // 2 Player Turn
  Move: MoveReducer,
  PickATile: PickATileReducer,
  PlaceTile: PlaceTileReducer,
  Awake: AwakeReducer,
  Fight: FightReducer,
  Pass: PassReducer,
  // 3 Phase Feed
  CheckEndGame: CheckEndGameReducer,
  MoveNextEnemy: MoveNextEnemyReducer,
  // 4 End Game
  AssignRating: AssignRatingReducer,
};

export const GameOneMatchManager = (
  gameState: GameoneState,
  action: AllPossibleAction,
): GameoneState => {

  const newGameState = applyAction(
    gameState,
    action,
  );
  return autoPlayer(
    newGameState,
    applyAction,
  );

};

export function applyAction (
  gameState: GameoneState,
  action: AllPossibleAction,
): GameoneState {

  if (!gameState.allowedNextActions.includes(action.kind)) {

    throw new Error("Non è possibile eseguire questa azione!");

  }
  const reducer = allActionsMap[action.kind] as StateReducer<AllPossibleAction>;
  const partialGameState = reducer(
    gameState,
    action,
  );
  const newGameState: GameoneState = {
    ...gameState,
    ...partialGameState,
  };
  return newGameState;

}
