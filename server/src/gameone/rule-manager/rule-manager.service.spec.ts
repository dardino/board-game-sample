import { GameDto } from "@entities/game.dto/game.dto";
import { GAME_MESSAGES } from "@entities/game.dto/game.messages";
import { PlayerDto } from "@entities/player.dto/player.dto";
import { Test, TestingModule } from "@nestjs/testing";
import { SystemPlayerService } from "src/system-player/system-player.service";
import { replacePlaceholders } from "src/tools/replacePlaceholders";
import { RuleManagerService } from "./rule-manager.service";

describe("RuleManagerService tests", () => {
  let service: RuleManagerService;
  const addDelayedActionMock = jest.fn().mockImplementation(() => true);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleManagerService,
        {
          provide: SystemPlayerService,
          useValue: {
            addDelayedAction: addDelayedActionMock,
          },
        },
      ],
    }).compile();

    service = module.get<RuleManagerService>(RuleManagerService);
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
    expect(addDelayedActionMock).toHaveBeenCalledWith(
      game.gameId,
      game.gameState?.nextTournDeadline,
      { action: "EndTurn", playerId: -1 },
    );
  });
});
