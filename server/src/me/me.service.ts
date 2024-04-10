import { Injectable } from '@nestjs/common';

@Injectable()
export class MeService {
  getMe(): string {
    return 'Hello World!';
  }

  private counter = 0;
  getCounter(): number {
    return this.counter++;
  }
  deleteCounter(): void {
    this.counter = 0;
  }
}
