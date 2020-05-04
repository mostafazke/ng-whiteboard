import { TestBed } from '@angular/core/testing';

import { NgWhiteboardService } from './ng-whiteboard.service';

describe('NgWhiteboardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgWhiteboardService = TestBed.inject(NgWhiteboardService);
    expect(service).toBeTruthy();
  });
});
