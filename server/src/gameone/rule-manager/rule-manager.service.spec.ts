import { GameDto } from "@entities/game.dto/game.dto";
import { GAME_MESSAGES } from "@entities/game.dto/game.messages";
import { PlayerDto } from "@entities/player.dto/player.dto";
import { Test, TestingModule } from "@nestjs/testing";
import { SystemPlayerService } from "src/system-player/system-player.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";
import { GameOneRuleService } from "./rule-manager.service";

describe("GameOneRuleService tests", () => {
  let service: GameOneRuleService;
  const addDelayedActionMock = jest.fn().mockImplementation(() => true);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameOneRuleService,
        {
          provide: SystemPlayerService,
          useValue: {
            addDelayedAction: addDelayedActionMock,
          },
        },
      ],
    }).compile();

    service = module.get<GameOneRuleService>(GameOneRuleService);
  });

  it("RuleManagerService should be defined", () => {
    expect(service).toBeDefined();
  });

  it("RuleManagerService should start a game", async () => {
    addDelayedActionMock.mockClear();
    const player = new PlayerDto(1, "Prova", false);
    const game = await GameDto.createGame("Test Game", player);
    expect(game.startedAt).toBe(null);
    const result = await service.start(game);
    expect(result).toBe(replacePlaceholders(GAME_MESSAGES, "GAME_STARTED", {}));
    expect(game.startedAt).toBeInstanceOf(Date);
    expect(addDelayedActionMock).toHaveBeenCalledWith(game.gameId, {
      action: "PlayerTurn_End",
      playerId: -1,
      runAt: game.gameState?.nextTournDeadline,
    });
  });
});
