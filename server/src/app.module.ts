import { Module } from '@nestjs/common';
import { MeController } from './me/me.controller';
import { MeService } from './me/me.service';
import { PlayersService } from './players/players.service';

@Module({
  imports: [],
  controllers: [MeController],
  providers: [MeService, PlayersService],
})
export class AppModule {}
