import { TestBed } from '@angular/core/testing';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { NgWhiteboardService } from './ng-whiteboard.service';

describe('NgWhiteboardService', () => {
  let service: NgWhiteboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NgWhiteboardService] });
    service = TestBed.inject(NgWhiteboardService);
  });

  it('can load instance', () => {
    expect(service).toBeTruthy();
  });

  it('should emit eraseMethodCalled$ on calling erase method', () => {
    // arrange
    const observerSpy = subscribeSpyTo(service.eraseMethodCalled$);
    // act
    service.erase();
    // assert
    expect(observerSpy.receivedNext()).toBe(true);

    observerSpy.unsubscribe();
  });

  it('should emit saveMethodCalled$ on calling save method and the default name is (New board)', () => {
    // arrange
    const observerSpy = subscribeSpyTo(service.saveMethodCalled$);

    // act
    service.save();
    const res = observerSpy.getLastValue();

    // assert
    expect(observerSpy.receivedNext()).toBe(true);
    expect(res?.name).toEqual('New board');

    observerSpy.unsubscribe();
  });

  it('should emit undoMethodCalled$ on calling undo method', () => {
    // arrange
    const observerSpy = subscribeSpyTo(service.undoMethodCalled$);
    // act
    service.undo();
    // assert
    expect(observerSpy.receivedNext()).toBe(true);

    observerSpy.unsubscribe();
  });

  it('should emit redoMethodCalled$ on calling redo method', () => {
    // arrange
    const observerSpy = subscribeSpyTo(service.redoMethodCalled$);
    // act
    service.redo();
    // assert
    expect(observerSpy.receivedNext()).toBe(true);

    observerSpy.unsubscribe();
  });

  it('should emit addImageMethodCalled$ on calling addImage method width image source', () => {
    // arrange
    const imgSrc = 'image src';
    const observerSpy = subscribeSpyTo(service.addImageMethodCalled$);
    // act
    service.addImage(imgSrc);
    const res = observerSpy.getLastValue();

    // assert
    expect(observerSpy.receivedNext()).toBe(true);
    expect(res?.image).toEqual(imgSrc);

    observerSpy.unsubscribe();
  });
});
