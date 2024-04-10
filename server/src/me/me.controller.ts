import { Controller, Delete, Get } from '@nestjs/common';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  getMe(): string {
    return this.meService.getMe();
  }

  @Get('counter')
  getCounter(): number {
    return this.meService.getCounter();
  }

  @Delete('counter')
  deleteCounter(): void {
    return this.meService.deleteCounter();
  }
}
