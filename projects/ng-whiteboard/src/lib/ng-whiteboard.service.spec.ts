import { TestBed } from '@angular/core/testing';
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
});
