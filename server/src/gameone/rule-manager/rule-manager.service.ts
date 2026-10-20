import { GameOneMatchManager } from "@/gameone/gameone-rules";
import { Connections } from "@/gameone/gameone-contents";
import { ConnectedTile, GameoneState, AllPossibleAction, getInitialState } from "@/gameone/rules/state.types";
import { PlayerDto } from "@dto/player.dto/player.dto";
import { GameRuleService, GameRuleTransition } from "@/rule-service-types/game-rule-types";
import { Injectable } from "@nestjs/common";

export interface GameOneRuleContext {
  gameId: number;
  players: readonly Pick<PlayerDto, "id">[];
}

type GameOneSnapshotTile = Omit<ConnectedTile, "nodes"> & {
  nodes: Partial<Record<Connections, { x: number;
    y: number; } | null>>;
};

export type GameOneSnapshot = Omit<GameoneState, "onboardTiles"> & {
  onboardTiles: GameOneSnapshotTile[];
};

@Injectable()
export class GameOneRuleService implements GameRuleService<
  GameOneRuleContext,
  GameoneState,
  AllPossibleAction,
  GameOneSnapshot
> {

  readonly gameType = "eldorasia";

  initialize (context: GameOneRuleContext): GameRuleTransition<GameoneState> {
    const state = GameOneMatchManager(getInitialState(), {
      phase: "Setup",
      kind: "SetPlayers",
      players: context.players.map((player) => player.id),
    });
    return {
      state,
      events: [],
    };
  }

  applyAction (
    state: GameoneState,
    action: AllPossibleAction,
    context: GameOneRuleContext,
  ): GameRuleTransition<GameoneState> {
    if (
      "playerId" in action &&
      !context.players.some((player) => player.id === action.playerId)
    ) {
      throw new Error("Il giocatore non appartiene a questa partita.");
    }

    return {
      state: GameOneMatchManager(state, action),
      events: [],
    };
  }

  getSnapshot (state: GameoneState): GameOneSnapshot {
    return {
      ...state,
      onboardTiles: state.onboardTiles.map((tile) => {
        const nodes: GameOneSnapshotTile["nodes"] = {};
        for (const direction of Connections) {
          const node = tile.nodes[direction];
          if (node !== undefined) {
            nodes[direction] = node === null
              ? null
              : { x: node.x,
                y: node.y };
          }
        }
        return {
          ...tile,
          nodes,
        };
      }),
    };
  }

}
