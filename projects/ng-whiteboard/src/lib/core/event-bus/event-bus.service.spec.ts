import { TestBed } from '@angular/core/testing';
import { WhiteboardEvent, WhiteboardEventPayloads } from '../types';
import { EventBusService } from './event-bus.service';

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventBusService],
    });
    service = TestBed.inject(EventBusService);
  });

  it('should emit and listen to events with payload', (done) => {
    const testEvent = WhiteboardEvent.ElementsAdded;
    const testPayload = { elementIds: ['test-id'] };

    service.listen().subscribe((event) => {
      expect(event.type).toBe(testEvent);
      expect(event.payload).toEqual(testPayload);
      done();
    });

    service.emit(testEvent, testPayload as unknown as WhiteboardEventPayloads[typeof testEvent]);
  });

  it('should emit and listen to events without payload', (done) => {
    const testEvent = WhiteboardEvent.Clear;

    service.listen().subscribe((event) => {
      expect(event.type).toBe(testEvent);
      expect(event.payload).toBeUndefined();
      done();
    });

    service.emit(testEvent);
  });

  it('should filter events by type using on', (done) => {
    const testEvent1 = WhiteboardEvent.DrawStart;
    const testEvent2 = WhiteboardEvent.DrawEnd;
    const testPayload = { x: 10, y: 20 };

    service.on(testEvent1).subscribe((payload: unknown) => {
      expect(payload).toEqual(testPayload);
      done();
    });

    service.emit(testEvent2, { x: 99, y: 99 } as never);
    service.emit(testEvent1, testPayload as never);
  });

  it('should complete event stream when destroyed', (done) => {
    const subscription = service.listen().subscribe({
      complete: () => {
        expect(true).toBeTruthy();
        done();
      },
    });

    service.destroy();
    subscription.unsubscribe();
  });

  it('should handle multiple subscribers to the same event type', () => {
    const testEvent = WhiteboardEvent.ToolChange;
    const testPayload = { tool: 'select' };
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();

    service.on(testEvent).subscribe(subscriber1);
    service.on(testEvent).subscribe(subscriber2);

    service.emit(testEvent, testPayload as never);

    expect(subscriber1).toHaveBeenCalledWith(testPayload);
    expect(subscriber2).toHaveBeenCalledWith(testPayload);
  });

  describe('Signal-based API', () => {
    it('should update event signal when event is emitted', () => {
      const testEvent = WhiteboardEvent.ElementsAdded;
      const testPayload = { elementIds: ['test-id'] };

      const eventSignal = service.getEventSignal(testEvent);
      expect(eventSignal()).toBeUndefined();

      service.emit(testEvent, testPayload as unknown as WhiteboardEventPayloads[typeof testEvent]);

      expect(eventSignal()).toEqual(testPayload);
    });

    it('should update lastEvent signal when any event is emitted', () => {
      const testEvent1 = WhiteboardEvent.DrawStart;
      const testPayload1 = { x: 10, y: 20 };
      const testEvent2 = WhiteboardEvent.DrawEnd;
      const testPayload2 = { x: 50, y: 60 };

      expect(service.lastEvent()).toBeUndefined();

      service.emit(testEvent1, testPayload1 as never);
      let lastEvent = service.lastEvent();
      expect(lastEvent?.type).toBe(testEvent1);
      expect(lastEvent?.payload).toEqual(testPayload1);

      service.emit(testEvent2, testPayload2 as never);
      lastEvent = service.lastEvent();
      expect(lastEvent?.type).toBe(testEvent2);
      expect(lastEvent?.payload).toEqual(testPayload2);
    });

    it('should provide read-only access to event signals', () => {
      const eventSignal = service.getEventSignal(WhiteboardEvent.Ready);

      // Attempting to call .set() should not be available on the returned signal
      expect(eventSignal).toBeDefined();
      expect(typeof eventSignal).toBe('function');
    });

    it('should return all events signal', () => {
      const allEventsSignal = service.getAllEventsSignal();
      expect(allEventsSignal).toBeDefined();
      expect(typeof allEventsSignal).toBe('function');
    });

    it('should emit event with timestamp', () => {
      const testEvent = WhiteboardEvent.Save;
      const beforeTime = Date.now();

      service.emit(testEvent);

      const lastEvent = service.lastEvent();
      expect(lastEvent?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(lastEvent?.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should apply default debounce config for ElementsAdded', (done) => {
      const testEvent = WhiteboardEvent.ElementsAdded;
      const payloads = [{ elementIds: ['id1'] }, { elementIds: ['id2'] }, { elementIds: ['id3'] }];

      const results: WhiteboardEventPayloads[typeof testEvent][] = [];

      service.on(testEvent).subscribe((payload) => {
        results.push(payload);
        if (results.length === 1) {
          // Should only receive the last payload after debounce
          expect(payload).toEqual({ elementIds: ['id3'] });
          done();
        }
      });

      payloads.forEach((payload) => {
        service.emit(testEvent, payload as never);
      });

      jest.advanceTimersByTime(100);
    });

    it('should apply custom debounce config', (done) => {
      const testEvent = WhiteboardEvent.ElementsUpdated;
      const payload1 = { elementIds: ['id1'] };
      const payload2 = { elementIds: ['id2'] };

      const results: WhiteboardEventPayloads[typeof testEvent][] = [];

      service.on(testEvent, { debounceTime: 50 }).subscribe((payload) => {
        results.push(payload);
        if (results.length === 1) {
          expect(payload).toEqual(payload2);
          done();
        }
      });

      service.emit(testEvent, payload1 as never);
      service.emit(testEvent, payload2 as never);

      jest.advanceTimersByTime(50);
    });

    it('should apply distinctUntilChanged with custom comparator', (done) => {
      const testEvent = WhiteboardEvent.ElementsUpdated;
      const payload1 = { elementIds: ['id1'] };
      const payload2 = { elementIds: ['id1'] }; // Same value
      const payload3 = { elementIds: ['id2'] }; // Different value

      const results: WhiteboardEventPayloads[typeof testEvent][] = [];

      const comparator = (
        a: WhiteboardEventPayloads[typeof testEvent],
        b: WhiteboardEventPayloads[typeof testEvent]
      ) => {
        return JSON.stringify(a) === JSON.stringify(b);
      };

      service
        .on(testEvent, {
          debounceTime: 0,
          distinctUntilChanged: true,
          comparator,
        })
        .subscribe((payload) => {
          results.push(payload);
        });

      service.emit(testEvent, payload1 as never);
      jest.advanceTimersByTime(10);

      service.emit(testEvent, payload2 as never);
      jest.advanceTimersByTime(10);

      service.emit(testEvent, payload3 as never);
      jest.advanceTimersByTime(10);

      // Should only receive payload1 and payload3 (payload2 filtered out as duplicate)
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(payload1);
      expect(results[1]).toEqual(payload3);
      done();
    });

    it('should not apply debounce when debounceTime is 0', (done) => {
      const testEvent = WhiteboardEvent.ElementsUpdated;
      const payload = { elementIds: ['id1'] };

      service.on(testEvent, { debounceTime: 0 }).subscribe((receivedPayload) => {
        expect(receivedPayload).toEqual(payload);
        done();
      });

      service.emit(testEvent, payload as never);

      // Should be immediate, no need to advance timers
    });
  });

  describe('listenToMultiple', () => {
    it('should listen to multiple event types', (done) => {
      const events = [WhiteboardEvent.DrawStart, WhiteboardEvent.DrawEnd];
      const payload1 = { x: 10, y: 20 };
      const payload2 = { x: 50, y: 60 };

      const results: Array<{ type: WhiteboardEvent; payload: unknown }> = [];

      service.listenToMultiple(events).subscribe((event) => {
        results.push(event);

        if (results.length === 2) {
          expect(results[0].type).toBe(WhiteboardEvent.DrawStart);
          expect(results[0].payload).toEqual(payload1);
          expect(results[1].type).toBe(WhiteboardEvent.DrawEnd);
          expect(results[1].payload).toEqual(payload2);
          done();
        }
      });

      service.emit(WhiteboardEvent.DrawStart, payload1 as never);
      service.emit(WhiteboardEvent.DrawEnd, payload2 as never);
    });

    it('should filter out events not in the list', (done) => {
      const events = [WhiteboardEvent.DrawStart];
      const payload = { x: 10, y: 20 };

      let callCount = 0;

      service.listenToMultiple(events).subscribe((event) => {
        callCount++;
        expect(event.type).toBe(WhiteboardEvent.DrawStart);
        expect(event.payload).toEqual(payload);
      });

      service.emit(WhiteboardEvent.DrawStart, payload as never);
      service.emit(WhiteboardEvent.DrawEnd, { x: 99, y: 99 } as never);
      service.emit(WhiteboardEvent.Drawing, { x: 88, y: 88 } as never);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });

    it('should include timestamp in listenToMultiple events', (done) => {
      const events = [WhiteboardEvent.Undo, WhiteboardEvent.Redo];

      service.listenToMultiple(events).subscribe((event) => {
        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe('number');
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      service.emit(WhiteboardEvent.Undo);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call destroy when ngOnDestroy is called', () => {
      const destroySpy = jest.spyOn(service, 'destroy');

      service.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should complete all subscriptions on ngOnDestroy', (done) => {
      const subscription = service.listen().subscribe({
        complete: () => {
          expect(true).toBeTruthy();
          done();
        },
      });

      service.ngOnDestroy();
      subscription.unsubscribe();
    });
  });

  describe('Edge Cases', () => {
    it('should handle emitting event with undefined payload', () => {
      const testEvent = WhiteboardEvent.Clear;

      expect(() => {
        service.emit(testEvent);
      }).not.toThrow();

      const lastEvent = service.lastEvent();
      expect(lastEvent?.type).toBe(testEvent);
      expect(lastEvent?.payload).toBeUndefined();
    });

    it('should handle rapid sequential emissions', (done) => {
      jest.useRealTimers(); // Use real timers for this test
      const testEvent = WhiteboardEvent.ZoomChange; // Use an event without default debounce
      const payloads = Array.from({ length: 10 }, (_, i) => ({ zoom: i }));

      const receivedPayloads: unknown[] = [];

      service.on(testEvent).subscribe((payload) => {
        receivedPayloads.push(payload);

        // Once we've received all payloads, check and complete
        if (receivedPayloads.length === payloads.length) {
          expect(receivedPayloads.length).toBe(10);
          done();
        }
      });

      payloads.forEach((payload) => {
        service.emit(testEvent, payload as never);
      });
    });

    it('should maintain separate signal state for different event types', () => {
      const event1 = WhiteboardEvent.ZoomChange;
      const event2 = WhiteboardEvent.ConfigChange;
      const payload1 = { zoom: 1.5 };
      const payload2 = { config: {} };

      service.emit(event1, payload1 as never);
      service.emit(event2, payload2 as never);

      const signal1 = service.getEventSignal(event1);
      const signal2 = service.getEventSignal(event2);

      expect(signal1()).toEqual(payload1);
      expect(signal2()).toEqual(payload2);
    });

    it('should not throw when listening after destroy', () => {
      service.destroy();

      expect(() => {
        service.listen().subscribe(() => {
          // Should not receive any events
        });
      }).not.toThrow();
    });
  });
});
