import { BOSS_ENEMIES } from "src/gameone/gameone-contents";
import { shuffleArray } from "src/tools/arrays";
import { Flow } from "../gameone.flow";
import { DrawBossAction, StateReducer } from "../state.types";

export const DrawBossReducer: StateReducer<DrawBossAction> = (
  _state,
  action,
) => {
  return {
    boss: shuffleArray(BOSS_ENEMIES)[0],
    previousAction: action.kind,
    allowedNextActions: Flow.Setup.DrawBoss,
  };
};
