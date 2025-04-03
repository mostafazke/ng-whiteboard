import { TestBed } from '@angular/core/testing';
import { NgWhiteboardService } from './ng-whiteboard.service';
import { ActionType, WhiteboardAction } from './core/types/actions';
import { ElementType, FormatType, ToolType, WhiteboardElement } from './core/types';
import { PRIORITY_WEIGHTS } from './core/constants';

describe('NgWhiteboardService', () => {
  let service: NgWhiteboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgWhiteboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a new element', () => {
    const element: WhiteboardElement = {
      id: '1',
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    } as WhiteboardElement;
    jest.spyOn(service, 'dispatchWithPriority');
    service.addElement(element);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.AddElement, payload: { element } },
      'normal'
    );
  });

  it('should add an image', () => {
    const image = 'data:image/png;base64,...';
    jest.spyOn(service, 'dispatchWithPriority');
    service.addImage(image, 10, 20);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.AddImage, payload: { image, x: 10, y: 20 } },
      'normal'
    );
  });

  it('should center the canvas', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.centerCanvas();
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.CenterCanvas }, 'normal');
  });

  it('should clear the whiteboard', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.clear();
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.Clear }, 'high');
  });

  it('should dispatch a batch of actions', () => {
    const actions: WhiteboardAction[] = [
      {
        type: ActionType.AddElement,
        payload: {
          element: { id: '1', type: ElementType.Rectangle, x: 0, y: 0, width: 100, height: 100 } as WhiteboardElement,
        },
      },
    ];
    jest.spyOn(service, 'dispatchWithPriority');
    service.dispatchBatch(actions);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.Batch, payload: actions }, 'low');
  });

  it('should make the canvas full screen', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.fullScreen();
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.FullScreen }, 'normal');
  });

  it('should remove elements by IDs', () => {
    const ids = ['1', '2'];
    jest.spyOn(service, 'dispatchWithPriority');
    service.removeElements(ids);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.RemoveElements, payload: { ids } },
      'normal'
    );
  });

  it('should redo the last undone action', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.redo();
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.Redo }, 'high');
  });

  it('should save the current state of the whiteboard', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.save(FormatType.Base64, 'MyBoard');
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.Save, payload: { format: FormatType.Base64, name: 'MyBoard' } },
      'normal'
    );
  });

  it('should select an element', () => {
    const element: WhiteboardElement = {
      id: '1',
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    } as WhiteboardElement;
    jest.spyOn(service, 'dispatchWithPriority');
    service.selectElement(element);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.SelectElement, payload: { element } },
      'normal'
    );
  });

  it('should set the active tool', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.setActiveTool(ToolType.Pen);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.SetActiveTool, payload: { tool: ToolType.Pen } },
      'normal'
    );
  });

  it('should set the canvas dimensions', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.setCanvasDimensions(800, 600);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.SetCanvasDimensions, payload: { width: 800, height: 600 } },
      'normal'
    );
  });

  it('should set the canvas position', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.setCanvasPosition(100, 200);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.SetCanvasPosition, payload: { x: 100, y: 200 } },
      'normal'
    );
  });

  it('should toggle the grid', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.toggleGrid();
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.ToggleGrid }, 'normal');
  });

  it('should undo the last action', () => {
    jest.spyOn(service, 'dispatchWithPriority');
    service.undo();
    expect(service.dispatchWithPriority).toHaveBeenCalledWith({ type: ActionType.Undo }, 'high');
  });

  it('should update an existing element', () => {
    const element: WhiteboardElement = {
      id: '1',
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    } as WhiteboardElement;
    jest.spyOn(service, 'dispatchWithPriority');
    service.updateElement(element);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.UpdateElement, payload: { element } },
      'normal'
    );
  });

  it('should update the selected element', () => {
    const partialElement: Partial<WhiteboardElement> = { x: 10, y: 20 };
    jest.spyOn(service, 'dispatchWithPriority');
    service.updateSelectedElement(partialElement);
    expect(service.dispatchWithPriority).toHaveBeenCalledWith(
      { type: ActionType.UpdateSelectedElement, payload: { partialElement } },
      'normal'
    );
  });

  it('should return correct priority weight', () => {
    const priority = 'high';
    const expectedWeight = PRIORITY_WEIGHTS[priority];
    const result = service['getPriorityWeight'](priority);
    expect(result).toBe(expectedWeight);
  });
});
