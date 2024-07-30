import { GameDto } from "@entities/game.dto/game.dto";
import { GAME_MESSAGES } from "@entities/game.dto/game.messages";
import { GamestateDto } from "@entities/gamestate.dto/gamestate.dto";
import { PlayerDto } from "@entities/player.dto/player.dto";
import { Injectable } from "@nestjs/common";
import { RuleException } from "src/errors/rule";
import { SystemPlayerService } from "src/system-player/system-player.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";

type StartedGame = Omit<GameDto, "gameState" | "startedAt"> & {
  gameState: GamestateDto;
  startedAt: Date;
};

function isGameStarted(game: GameDto): game is StartedGame {
  return game.startedAt != null && game.gameState != null;
}

@Injectable()
export class GameOneRuleService {
  constructor(private systemPlayer: SystemPlayerService) {
    //
  }

  async addPlayer(game: GameDto, player: PlayerDto) {
    return game.connectedPlayers.push(player);
  }

  async start(game: GameDto) {
    if (isGameStarted(game)) {
      throw new RuleException(
        replacePlaceholders(GAME_MESSAGES, "GAME_ALREDY_STARTED", {}),
      );
    }

    game.startedAt = new Date();
    game.gameState = GamestateDto.startNewGame(game.connectedPlayers);

    if (!isGameStarted(game)) {
      throw new RuleException(
        replacePlaceholders(GAME_MESSAGES, "ERROR_STARTING_GAME", {}),
      );
    }

    this.systemPlayer.addDelayedAction(game.gameId, {
      action: "PlayerTurn_End",
      playerId: -1,
      runAt: game.gameState!.nextTournDeadline,
    });

    return replacePlaceholders(GAME_MESSAGES, "GAME_STARTED", {});
  }
}
