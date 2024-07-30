import { Module } from "@nestjs/common";
import { MatchMakingController } from "./controllers/matchmaking.controller";
import { MeController } from "./controllers/me.controller";
import { GamesServices } from "./game/games.service";
import { RuleManagerService } from './gameone/rule-manager/rule-manager.service';
import { MeService } from "./me/me.service";
import { PlayersService } from "./players/players.service";
import { SystemPlayerService } from './system-player/system-player.service';

@Module({
  imports: [],
  controllers: [MeController, MatchMakingController],
  providers: [MeService, PlayersService, GamesServices, RuleManagerService, SystemPlayerService],
})
export class AppModule { }
