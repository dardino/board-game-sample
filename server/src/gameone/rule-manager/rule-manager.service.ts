import { PlayerDto } from "@dto/player.dto/player.dto";
import { GAME_MESSAGES } from "@models/game.model/game.messages";
import { GameModel } from "@models/game.model/game.model";
import { GamestateModel } from "@models/gamestate.model/gamestate.model";
import { Injectable } from "@nestjs/common";
import { RuleException } from "src/errors/rule";
import { SystemPlayerService } from "src/system-player/system-player.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";

type StartedGame = Omit<GameModel, "gameState" | "startedAt"> & {
  gameState: GamestateModel;
  startedAt: Date;
};

function isGameStarted (game: GameModel): game is StartedGame {

  return game.startedAt != null && game.gameState != null;

}

@Injectable()
export class GameOneRuleService {

  constructor (private systemPlayer: SystemPlayerService) {
    //
  }

  async addPlayer (game: GameModel, player: PlayerDto) {

    return game.connectedPlayers.push(player);

  }

  async start (game: GameModel) {

    if (isGameStarted(game)) {

      throw new RuleException(replacePlaceholders(
        GAME_MESSAGES,
        "GAME_ALREDY_STARTED",
        {},
      ));

    }

    game.startedAt = new Date();
    game.gameState = GamestateModel.startNewGame(game.connectedPlayers);

    if (!isGameStarted(game)) {

      throw new RuleException(replacePlaceholders(
        GAME_MESSAGES,
        "ERROR_STARTING_GAME",
        {},
      ));

    }

    this.systemPlayer.addDelayedAction(
      game.gameId,
      {
        action: "PlayerTurn_End",
        playerId: -1,
        runAt: game.gameState!.nextTournDeadline,
      },
    );

    return replacePlaceholders(
      GAME_MESSAGES,
      "GAME_STARTED",
      {},
    );

  }

}
