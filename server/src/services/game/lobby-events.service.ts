import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

@Injectable()
export class LobbyEventsService {

  #events = new Subject<GameEvent>();

  get events$ (): Observable<GameEvent> {
    return this.#events.asObservable();
  }

  publish (event: GameEvent) {
    this.#events.next(event);
  }

}
