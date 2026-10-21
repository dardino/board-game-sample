import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

@Injectable()
export class LobbyEventsService {

  #events = new Subject<GameEvent>();

  #gameStateUpdates = new Subject<number>();

  get events$ (): Observable<GameEvent> {
    return this.#events.asObservable();
  }

  publish (event: GameEvent) {
    this.#events.next(event);
  }

  get gameStateUpdates$ (): Observable<number> {
    return this.#gameStateUpdates.asObservable();
  }

  publishGameStateUpdate (gameId: number) {
    this.#gameStateUpdates.next(gameId);
  }

}
