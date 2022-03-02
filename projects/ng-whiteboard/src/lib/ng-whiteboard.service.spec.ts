import { TestBed } from '@angular/core/testing';

import { NgWhiteboardService } from './ng-whiteboard.service';

describe('NgWhiteboardService', () => {
  let service: NgWhiteboardService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NgWhiteboardService] });
    service = TestBed.inject(NgWhiteboardService);
  });
  it('when erase is called it should fire observable', (done) => {
    let isCalled: boolean;
    service.eraseSvgMethodCalled$.subscribe((res) => {
      isCalled = true;
      done();
    });
    service.erase();
    expect(isCalled).toBeTrue();
  });

  it('when save is called it should fire observable', (done) => {
    let isCalled: boolean;
    service.saveSvgMethodCalled$.subscribe(() => {
      isCalled = true;
      done();
    });
    service.save();
    expect(isCalled).toBeTrue();
  });
  it('when undo is called it should fire observable', (done) => {
    let isCalled: boolean;
    service.undoSvgMethodCalled$.subscribe(() => {
      isCalled = true;
      done();
    });
    service.undo();
    expect(isCalled).toBeTrue();
  });

  it('when redo is called it should fire observable', (done) => {
    let isCalled: boolean;
    service.redoSvgMethodCalled$.subscribe(() => {
      isCalled = true;
      done();
    });
    service.redo();
    expect(isCalled).toBeTrue();
  });

  it('when addImage is called it should fire observable with image url', (done) => {
    let isCalled: boolean;
    service.addImageMethodCalled$.subscribe((img) => {
      isCalled = true;
      done();
    });
    service.addImage('test');
    expect(isCalled).toBeTrue();
  });
});
