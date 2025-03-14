import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { NgWhiteboardService } from '../../ng-whiteboard.service';
import { DataService } from '../data/data.service';
import { WhiteboardAction, ActionType, FormatType } from '../types';
import { ActionHandlerService } from './action-handler.service';

describe('ActionHandlerService', () => {
  let service: ActionHandlerService;
  let dataService: DataService;
  let whiteboardService: NgWhiteboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActionHandlerService,
        {
          provide: DataService,
          useValue: {
            undo: jest.fn(),
            redo: jest.fn(),
            clear: jest.fn(),
            updateSelectedElement: jest.fn(),
            save: jest.fn(),
            toggleGrid: jest.fn(),
            addImage: jest.fn(),
          },
        },
        {
          provide: NgWhiteboardService,
          useValue: {
            actions$: new BehaviorSubject<WhiteboardAction[]>([]),
          },
        },
      ],
    });

    service = TestBed.inject(ActionHandlerService);
    dataService = TestBed.inject(DataService);
    whiteboardService = TestBed.inject(NgWhiteboardService);
  });

  it('should handle UpdateSelectedElement action', () => {
    const action: WhiteboardAction = {
      type: ActionType.UpdateSelectedElement,
      payload: { partialElement: { id: '1', width: 100 } },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.updateSelectedElement).toHaveBeenCalledWith({ id: '1', width: 100 });
  });

  it('should handle Save action with format and name', () => {
    const action: WhiteboardAction = {
      type: ActionType.Save,
      payload: { format: FormatType.Png, name: 'test-image' },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.save).toHaveBeenCalledWith('png', 'test-image');
  });

  it('should handle ToggleGrid action', () => {
    const action: WhiteboardAction = {
      type: ActionType.ToggleGrid,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.toggleGrid).toHaveBeenCalled();
  });

  it('should handle AddImage action', () => {
    const imageData = { image: 'test.jpg', width: 100, height: 100 };
    const action: WhiteboardAction = {
      type: ActionType.AddImage,
      payload: imageData,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.addImage).toHaveBeenCalledWith(imageData);
  });

  it('should handle Batch actions', () => {
    const batchActions: WhiteboardAction[] = [{ type: ActionType.Clear }, { type: ActionType.ToggleGrid }];
    const action: WhiteboardAction = {
      type: ActionType.Batch,
      payload: batchActions,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.clear).toHaveBeenCalled();
    expect(dataService.toggleGrid).toHaveBeenCalled();
  });

  it('should not process empty action arrays', () => {
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([]);
    expect(dataService.undo).not.toHaveBeenCalled();
    expect(dataService.redo).not.toHaveBeenCalled();
    expect(dataService.clear).not.toHaveBeenCalled();
  });

  it('should process multiple actions in sequence', () => {
    const actions: WhiteboardAction[] = [
      { type: ActionType.Clear },
      { type: ActionType.Undo },
      { type: ActionType.Redo },
    ];
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next(actions);
    expect(dataService.clear).toHaveBeenCalled();
    expect(dataService.undo).toHaveBeenCalled();
    expect(dataService.redo).toHaveBeenCalled();
  });
});
