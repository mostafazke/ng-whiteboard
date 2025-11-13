import { Injectable, OnDestroy, WritableSignal, signal, untracked } from '@angular/core';
import { Observable, Subject, filter, map, debounceTime, distinctUntilChanged } from 'rxjs';
import { WhiteboardEvent, WhiteboardEventPayloads } from '../types';

interface WhiteboardEventPayload<T extends WhiteboardEvent> {
  type: T;
  payload: WhiteboardEventPayloads[T];
  timestamp: number;
}

interface DebounceConfig<T = unknown> {
  debounceTime: number;
  distinctUntilChanged?: boolean;
  comparator?: (prev: T, curr: T) => boolean;
}

@Injectable({ providedIn: 'root' })
export class EventBusService implements OnDestroy {
  private eventSubject = new Subject<WhiteboardEventPayload<WhiteboardEvent>>();

  private readonly eventSignals: { [K in WhiteboardEvent]: WritableSignal<WhiteboardEventPayloads[K] | undefined> } = {
    [WhiteboardEvent.Ready]: signal<WhiteboardEventPayloads[WhiteboardEvent.Ready] | undefined>(undefined),
    [WhiteboardEvent.Destroyed]: signal<WhiteboardEventPayloads[WhiteboardEvent.Destroyed] | undefined>(undefined),
    [WhiteboardEvent.DrawStart]: signal<WhiteboardEventPayloads[WhiteboardEvent.DrawStart] | undefined>(undefined),
    [WhiteboardEvent.Drawing]: signal<WhiteboardEventPayloads[WhiteboardEvent.Drawing] | undefined>(undefined),
    [WhiteboardEvent.DrawEnd]: signal<WhiteboardEventPayloads[WhiteboardEvent.DrawEnd] | undefined>(undefined),
    [WhiteboardEvent.ElementsAdded]: signal<WhiteboardEventPayloads[WhiteboardEvent.ElementsAdded] | undefined>(
      undefined
    ),
    [WhiteboardEvent.ElementsUpdated]: signal<WhiteboardEventPayloads[WhiteboardEvent.ElementsUpdated] | undefined>(
      undefined
    ),
    [WhiteboardEvent.ElementsSelected]: signal<WhiteboardEventPayloads[WhiteboardEvent.ElementsSelected] | undefined>(
      undefined
    ),
    [WhiteboardEvent.ElementsRemoved]: signal<WhiteboardEventPayloads[WhiteboardEvent.ElementsRemoved] | undefined>(
      undefined
    ),
    [WhiteboardEvent.ElementDoubleClicked]: signal<
      WhiteboardEventPayloads[WhiteboardEvent.ElementDoubleClicked] | undefined
    >(undefined),
    [WhiteboardEvent.Undo]: signal<WhiteboardEventPayloads[WhiteboardEvent.Undo] | undefined>(undefined),
    [WhiteboardEvent.Redo]: signal<WhiteboardEventPayloads[WhiteboardEvent.Redo] | undefined>(undefined),
    [WhiteboardEvent.Clear]: signal<WhiteboardEventPayloads[WhiteboardEvent.Clear] | undefined>(undefined),
    [WhiteboardEvent.DataChange]: signal<WhiteboardEventPayloads[WhiteboardEvent.DataChange] | undefined>(undefined),
    [WhiteboardEvent.Save]: signal<WhiteboardEventPayloads[WhiteboardEvent.Save] | undefined>(undefined),
    [WhiteboardEvent.ImageAdded]: signal<WhiteboardEventPayloads[WhiteboardEvent.ImageAdded] | undefined>(undefined),
    [WhiteboardEvent.ToolChange]: signal<WhiteboardEventPayloads[WhiteboardEvent.ToolChange] | undefined>(undefined),
    [WhiteboardEvent.ConfigChange]: signal<WhiteboardEventPayloads[WhiteboardEvent.ConfigChange] | undefined>(
      undefined
    ),
    [WhiteboardEvent.ZoomChange]: signal<WhiteboardEventPayloads[WhiteboardEvent.ZoomChange] | undefined>(undefined),
  } as const;

  private readonly lastEventInternal = signal<WhiteboardEventPayload<WhiteboardEvent> | undefined>(undefined);
  readonly lastEvent = this.lastEventInternal.asReadonly();

  private readonly defaultDebounceConfigs: Partial<Record<WhiteboardEvent, DebounceConfig>> = {
    [WhiteboardEvent.ElementsAdded]: {
      debounceTime: 100,
      distinctUntilChanged: true,
    },
    [WhiteboardEvent.Drawing]: {
      debounceTime: 16,
      distinctUntilChanged: false,
    },
  };

  ngOnDestroy(): void {
    this.destroy();
  }

  emit<T extends WhiteboardEvent>(type: T, payload?: WhiteboardEventPayloads[T]): void {
    const eventPayload: WhiteboardEventPayload<T> = {
      type,
      payload: payload as WhiteboardEventPayloads[T],
      timestamp: Date.now(),
    };
    this.eventSubject.next(eventPayload);
    untracked(() => {
      (this.eventSignals[type] as WritableSignal<WhiteboardEventPayloads[T] | undefined>).set(eventPayload.payload);
      this.lastEventInternal.set(eventPayload);
    });
  }

  listen(): Observable<WhiteboardEventPayload<WhiteboardEvent>> {
    return this.eventSubject.asObservable();
  }

  getEventSignal<T extends WhiteboardEvent>(eventType: T) {
    return this.eventSignals[eventType].asReadonly();
  }

  getAllEventsSignal() {
    return this.lastEvent;
  }

  on<T extends WhiteboardEvent>(
    eventType: T,
    debounceConfig?: DebounceConfig<WhiteboardEventPayloads[T]>
  ): Observable<WhiteboardEventPayloads[T]> {
    let stream: Observable<WhiteboardEventPayloads[T]> = this.eventSubject.pipe(
      filter((event): event is WhiteboardEventPayload<T> => event.type === eventType),
      map((event) => event.payload as WhiteboardEventPayloads[T])
    );

    const config = debounceConfig || this.defaultDebounceConfigs[eventType];
    if (!config) return stream;

    if (config.debounceTime > 0) {
      stream = stream.pipe(debounceTime(config.debounceTime));
    }

    if (config.distinctUntilChanged) {
      const compareFn = config.comparator as
        | ((a: WhiteboardEventPayloads[T], b: WhiteboardEventPayloads[T]) => boolean)
        | undefined;
      stream = stream.pipe(distinctUntilChanged(compareFn));
    }

    return stream;
  }

  listenToMultiple<T extends WhiteboardEvent>(
    events: T[]
  ): Observable<{ type: T; payload: WhiteboardEventPayloads[T]; timestamp: number }> {
    return this.eventSubject.pipe(
      filter((event): event is WhiteboardEventPayload<T> => events.includes(event.type as T)),
      map((event) => ({
        type: event.type as T,
        payload: event.payload,
        timestamp: event.timestamp,
      }))
    );
  }

  destroy(): void {
    this.eventSubject.complete();
  }
}
