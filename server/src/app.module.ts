/* eslint-disable @typescript-eslint/no-extraneous-class */
import { Module } from "@nestjs/common";
import { MatchMakingController } from "./controllers/matchmaking.controller";
import { MeController } from "./controllers/me.controller";
import { GameOneRuleService } from "./gameone/rule-manager/rule-manager.service";
import { MeService } from "./me/me.service";
import { GamesServices } from "./services/game/games.service";
import { GameStateGateway } from "./services/game/game-state.gateway";
import { LobbyEventsService } from "./services/game/lobby-events.service";
import { PlayersService } from "./services/players/players.service";


@Module({
  imports: [],
  controllers: [
    MeController,
    MatchMakingController,
  ],
  providers: [
    MeService,
    PlayersService,
    GamesServices,
    GameStateGateway,
    LobbyEventsService,
    GameOneRuleService,
  ],
})
export class AppModule { }
