import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { WhiteboardEvent, WhiteboardEventPayloads } from '../types';

interface WhiteboardEventPayload<T extends WhiteboardEvent> {
  type: T;
  payload: WhiteboardEventPayloads[T];
}

@Injectable()
export class EventBusService implements OnDestroy {
  private eventSubject = new Subject<WhiteboardEventPayload<WhiteboardEvent>>();

  ngOnDestroy(): void {
    this.destroy();
  }

  /**
   * Emits a whiteboard event with the specified type and payload.
   *
   * @param type - The type of the whiteboard event to emit.
   * @param payload - The payload of the whiteboard event to emit.
   */
  emit<T extends WhiteboardEvent>(type: T, payload?: WhiteboardEventPayloads[T]): void {
    this.eventSubject.next({ type, payload } as WhiteboardEventPayload<T>);
  }

  /**
   * Returns an observable that emits whiteboard events.
   *
   * The observable emits objects with a `type` property that matches a `WhiteboardEvent` type,
   * and a `payload` property that contains the corresponding `WhiteboardEventPayloads` data.
   *
   * Clients can subscribe to this observable to listen for specific whiteboard events.
   */
  listen<T extends WhiteboardEvent>(): Observable<WhiteboardEventPayload<T>> {
    return this.eventSubject.asObservable() as Observable<WhiteboardEventPayload<T>>;
  }

  /**
   * Returns an observable that emits whiteboard events of the specified type.
   *
   * The observable emits objects with a `payload` property that contains the corresponding `WhiteboardEventPayloads` data for the specified event type.
   *
   * Clients can subscribe to this observable to listen for specific whiteboard events.
   *
   * @param eventType - The type of whiteboard event to listen for.
   * @returns An observable that emits the payload of the specified whiteboard event.
   */
  listenTo<T extends WhiteboardEvent>(eventType: T): Observable<WhiteboardEventPayloads[T]> {
    return this.eventSubject.pipe(
      filter((event): event is WhiteboardEventPayload<T> => event.type === eventType),
      map((event) => event.payload)
    );
  }

  destroy(): void {
    this.eventSubject.complete();
  }
}
