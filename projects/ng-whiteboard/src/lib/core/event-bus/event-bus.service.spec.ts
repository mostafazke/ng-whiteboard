import { TestBed } from '@angular/core/testing';
import { WhiteboardEvent } from '../types';
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
    const testEvent = 'TEST_EVENT' as WhiteboardEvent;
    const testPayload = { data: 'test' };

    service.listen().subscribe((event) => {
      expect(event.type).toBe(testEvent);
      expect(event.payload).toEqual(testPayload);
      done();
    });

    service.emit(testEvent, testPayload as any);
  });

  it('should emit and listen to events without payload', (done) => {
    const testEvent = 'TEST_EVENT' as WhiteboardEvent;

    service.listen().subscribe((event) => {
      expect(event.type).toBe(testEvent);
      expect(event.payload).toBeUndefined();
      done();
    });

    service.emit(testEvent);
  });

  it('should filter events by type using listenTo', (done) => {
    const testEvent1 = 'TEST_EVENT_1' as WhiteboardEvent;
    const testEvent2 = 'TEST_EVENT_2' as WhiteboardEvent;
    const testPayload = { data: 'test' };

    service.listenTo(testEvent1).subscribe((payload) => {
      expect(payload).toEqual(testPayload);
      done();
    });

    service.emit(testEvent2, { other: 'data' } as any);
    service.emit(testEvent1, testPayload as any);
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
    const testEvent = 'TEST_EVENT' as WhiteboardEvent;
    const testPayload = { data: 'test' };
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();

    service.listenTo(testEvent).subscribe(subscriber1);
    service.listenTo(testEvent).subscribe(subscriber2);

    service.emit(testEvent, testPayload as any);

    expect(subscriber1).toHaveBeenCalledWith(testPayload);
    expect(subscriber2).toHaveBeenCalledWith(testPayload);
  });
});
