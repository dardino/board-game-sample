import { Test, TestingModule } from '@nestjs/testing';
import { SystemPlayerService } from './system-player.service';

describe('SystemPlayerService', () => {
  let service: SystemPlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemPlayerService],
    }).compile();

    service = module.get<SystemPlayerService>(SystemPlayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
