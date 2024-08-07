import { ContextIdFactory, REQUEST } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { MeService } from "../me/me.service";
import { PlayersService } from "../players/players.service";
import { MeController } from "./me.controller";

describe("MeController", () => {
  let meController: MeController;

  beforeEach(async () => {
    const contextId = ContextIdFactory.create();
    jest
      .spyOn(ContextIdFactory, "getByRequest")
      .mockImplementation(() => contextId);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [PlayersService, MeService],
    })
      .overrideProvider(REQUEST)
      .useValue({
        cookies: {
          "player.nickname": "test",
        },
      })
      .compile();

    meController = app.get<MeController>(MeController);
    meController = await app.resolve(MeService, contextId);
    expect(meController).not.toBe(undefined);
    expect(meController).not.toBe(null);
  });

  describe("getMe", () => {
    it("should fail if not present", async () => {
      try {
        await meController.getMe();
        fail("this method should fail");
      } catch (err) {
        expect((err as Error).message).toBe(
          "Non esiste un giocatore con il nickname test",
        );
      }
    });
  });
});
