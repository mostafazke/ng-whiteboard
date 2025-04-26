import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { NgWhiteboardService } from '../../ng-whiteboard.service';
import { DataService } from '../data/data.service';
import { WhiteboardAction, ActionType, FormatType, ElementType, ToolType } from '../types';
import { ActionHandlerService } from './action-handler.service';
import { RectangleElement } from '../elements';

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
            updateSelectedElements: jest.fn(),
            save: jest.fn(),
            toggleGrid: jest.fn(),
            addImage: jest.fn(),
            addElements: jest.fn(),
            updateElements: jest.fn(),
            removeElements: jest.fn(),
            selectElements: jest.fn(),
            setActiveTool: jest.fn(),
            setCanvasDimensions: jest.fn(),
            setCanvasPosition: jest.fn(),
            updateGridTranslation: jest.fn(),
            updateElementsTranslation: jest.fn(),
            fullScreen: jest.fn(),
            centerCanvas: jest.fn(),
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

  it('should handle Undo action', () => {
    const action: WhiteboardAction = { type: ActionType.Undo };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.undo).toHaveBeenCalled();
  });

  it('should handle Redo action', () => {
    const action: WhiteboardAction = { type: ActionType.Redo };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.redo).toHaveBeenCalled();
  });

  it('should handle Clear action', () => {
    const action: WhiteboardAction = { type: ActionType.Clear };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.clear).toHaveBeenCalled();
  });

  it('should handle UpdateSelectedElements action', () => {
    const action: WhiteboardAction = {
      type: ActionType.UpdateSelectedElements,
      payload: { partialElement: { id: '1', width: 100 } },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.updateSelectedElements).toHaveBeenCalledWith({ id: '1', width: 100 });
  });

  it('should handle Save action with format and name', () => {
    const action: WhiteboardAction = {
      type: ActionType.Save,
      payload: { format: FormatType.Png, name: 'test-image' },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.save).toHaveBeenCalledWith('png', 'test-image');
  });

  it('should handle AddElement action', () => {
    const element: RectangleElement = {
      id: '1',
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rx: 5,
      style: {
        strokeColor: '#000',
        strokeWidth: 1,
      },
      rotation: 0,
      opacity: 1,
    };
    const action: WhiteboardAction = {
      type: ActionType.AddElement,
      payload: { element },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.addElements).toHaveBeenCalledWith(element);
  });

  it('should handle UpdateElement action', () => {
    const element: RectangleElement = {
      id: '1',
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rx: 5,
      style: {
        strokeColor: '#000',
        strokeWidth: 1,
      },
      rotation: 0,
      opacity: 1,
    };
    const action: WhiteboardAction = {
      type: ActionType.UpdateElement,
      payload: { element },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.updateElements).toHaveBeenCalledWith(element);
  });

  it('should handle RemoveElements action', () => {
    const ids = ['1', '2'];
    const action: WhiteboardAction = {
      type: ActionType.RemoveElements,
      payload: { ids },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.removeElements).toHaveBeenCalledWith(ids);
  });

  it('should handle SelectElements action', () => {
    const elements: RectangleElement[] = [
      {
        id: '1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rx: 5,
        style: {
          strokeColor: '#000',
          strokeWidth: 1,
        },
        rotation: 0,
        opacity: 1,
      },
    ];
    const action: WhiteboardAction = {
      type: ActionType.SelectElements,
      payload: { elementsOrIds: elements },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.selectElements).toHaveBeenCalledWith(elements);
  });

  it('should handle SetActiveTool action', () => {
    const tool = ToolType.Rectangle;
    const action: WhiteboardAction = {
      type: ActionType.SetActiveTool,
      payload: { tool },
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.setActiveTool).toHaveBeenCalledWith(tool);
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

  it('should handle SetCanvasDimensions action', () => {
    const dimensions = { width: 800, height: 600 };
    const action: WhiteboardAction = {
      type: ActionType.SetCanvasDimensions,
      payload: dimensions,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.setCanvasDimensions).toHaveBeenCalledWith(dimensions.width, dimensions.height);
  });

  it('should handle SetCanvasPosition action', () => {
    const position = { x: 100, y: 200 };
    const action: WhiteboardAction = {
      type: ActionType.SetCanvasPosition,
      payload: position,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.setCanvasPosition).toHaveBeenCalledWith(position.x, position.y);
  });

  it('should handle UpdateGridTranslation action', () => {
    const translation = { dx: 10, dy: 20 };
    const action: WhiteboardAction = {
      type: ActionType.UpdateGridTranslation,
      payload: translation,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.updateGridTranslation).toHaveBeenCalledWith(translation.dx, translation.dy);
  });

  it('should handle UpdateElementsTranslation action', () => {
    const translation = { dx: 15, dy: 25 };
    const action: WhiteboardAction = {
      type: ActionType.UpdateElementsTranslation,
      payload: translation,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.updateElementsTranslation).toHaveBeenCalledWith(translation.dx, translation.dy);
  });

  it('should handle FullScreen action', () => {
    const action: WhiteboardAction = {
      type: ActionType.FullScreen,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.fullScreen).toHaveBeenCalled();
  });

  it('should handle CenterCanvas action', () => {
    const action: WhiteboardAction = {
      type: ActionType.CenterCanvas,
    };
    (whiteboardService.actions$ as BehaviorSubject<WhiteboardAction[]>).next([action]);
    expect(dataService.centerCanvas).toHaveBeenCalled();
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
