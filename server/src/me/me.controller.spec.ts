import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { MeService } from './me.service';

describe('MeController', () => {
  let meController: MeController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [MeService],
    }).compile();

    meController = app.get<MeController>(MeController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(meController.getMe()).toBe('Hello World!');
    });
  });

  describe('counter', () => {
    it('il contatore deve incrementare e deve resettarsi', () => {
      // la prima volta che chiamo getCounter il risultato deve essere 0
      expect(meController.getCounter()).toBe(0);
      // la seconda volta che chiamo getCounter il risultato deve essere 1
      expect(meController.getCounter()).toBe(1);
      // questo metodo se funziona deve riportare il counter a 0
      expect(meController.deleteCounter());
      // quindi se lo richiamo deve restituire 0
      expect(meController.getCounter()).toBe(0);
    });
  });
});
