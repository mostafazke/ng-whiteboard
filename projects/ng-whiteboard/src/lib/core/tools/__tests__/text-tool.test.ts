import { ApiService } from '../../api/api.service';
import { LineCap, LineJoin, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { TextTool } from '../text-tool';
import { ElementType } from '../../types';
import { createMockWhiteboardConfig, createMockPointerInfo } from '../../testing';

interface MockCanvas {
  parentElement: {
    querySelector: jest.Mock;
    appendChild: jest.Mock;
    getBoundingClientRect: jest.Mock;
    removeChild: jest.Mock;
  };
  getBoundingClientRect: jest.Mock;
}

describe('TextTool', () => {
  let textTool: TextTool;
  let apiService: ApiService;
  let config: WhiteboardConfig;
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    config = createMockWhiteboardConfig({
      snapToGrid: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Round,
      lineJoin: LineJoin.Round,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
      gridSize: 10,
      fill: 'none',
      fontFamily: 'Arial',
      fontSize: 16,
      zoom: 1,
      fullScreen: true,
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    });

    let createdTextarea: HTMLTextAreaElement | null = null;

    mockCanvas = {
      parentElement: {
        querySelector: jest.fn(() => createdTextarea),
        appendChild: jest.fn((element) => {
          createdTextarea = element;
        }),
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        removeChild: jest.fn(),
      },
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
    };

    apiService = {
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(config),
      getCanvas: jest.fn().mockReturnValue(mockCanvas),
      getElements: jest.fn().mockReturnValue([]),
      addElements: jest.fn(),
      updateElements: jest.fn(),
      removeElements: jest.fn(),
      getNextZIndex: jest.fn().mockReturnValue(1),
      getActiveLayerId: jest.fn().mockReturnValue('layer-1'),
      elementExists: jest.fn().mockReturnValue(false),
    } as unknown as ApiService;

    textTool = new TextTool(apiService);
    textTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(textTool.type).toBe(ToolType.Text);
  });
  it('should handle pointer down and create a new text element', () => {
    const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    jest.spyOn(apiService, 'getElements').mockReturnValue([]);

    textTool.handlePointerDown(mockEvent);

    expect(mockCanvas.parentElement.appendChild).toHaveBeenCalled();
    expect(apiService.addElements).not.toHaveBeenCalled();
  });

  it('should handle pointer down and edit an existing text element', () => {
    const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    const existingTextElement = { id: '1', type: ElementType.Text, x: 100, y: 200, text: 'Hello' } as WhiteboardElement;
    jest.spyOn(apiService, 'getElements').mockReturnValue([existingTextElement]);

    textTool.handlePointerDown(mockEvent);

    expect(mockCanvas.parentElement.appendChild).toHaveBeenCalled();
    // updateElements IS called because handleTextInput is called after creating the textarea
    expect(apiService.updateElements).toHaveBeenCalled();
  });

  it('should handle pointer up and focus on the text input', () => {
    const mockInput = { addEventListener: jest.fn(), focus: jest.fn() };
    textTool['textInput'] = mockInput as unknown as HTMLTextAreaElement;

    textTool.handlePointerUp();

    expect(mockInput.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(mockInput.focus).toHaveBeenCalled();
  });

  it('should handle text input and update the text element', () => {
    const mockInput = { value: 'Updated Text', style: { width: '' } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTextElement = { id: '1', text: '' } as any;
    textTool['textInput'] = mockInput as unknown as HTMLTextAreaElement;
    textTool['textElement'] = mockTextElement;

    textTool['handleTextInput'](mockInput as unknown as HTMLTextAreaElement);

    expect(mockInput.style.width).toBe('12ch');
    expect(mockTextElement.text).toBe('Updated Text');
    expect(apiService.updateElements).toHaveBeenCalledWith([mockTextElement]);
  });

  it('should create a new text element when handlePointerDown is called', () => {
    const mockEvent = createMockPointerInfo({ x: 150, y: 250, eventType: 'pointerdown' });
    jest.spyOn(apiService, 'getElements').mockReturnValue([]);

    textTool.handlePointerDown(mockEvent);

    expect(mockCanvas.parentElement.appendChild).toHaveBeenCalled();
    expect(textTool['textElement']).not.toBeNull();
    expect(textTool['textInput']).not.toBeNull();
  });

  it('should edit an existing text element when handlePointerDown is called', () => {
    const mockEvent = createMockPointerInfo({ x: 150, y: 250, eventType: 'pointerdown' });
    const existingTextElement = {
      id: '2',
      type: ElementType.Text,
      x: 150,
      y: 250,
      text: 'Existing Text',
    } as WhiteboardElement;
    jest.spyOn(apiService, 'getElements').mockReturnValue([existingTextElement]);

    textTool.handlePointerDown(mockEvent);

    expect(mockCanvas.parentElement.appendChild).toHaveBeenCalled();
    expect(textTool['textInput']).not.toBeNull();
  });

  it('should finish text input when handlePointerDown is called while editing', () => {
    const mockEvent = createMockPointerInfo({ x: 150, y: 250, eventType: 'pointerdown' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finishTextInputSpy = jest.spyOn(textTool as any, 'finishTextInput');
    textTool['textInput'] = {} as HTMLTextAreaElement;

    textTool.handlePointerDown(mockEvent);

    expect(finishTextInputSpy).toHaveBeenCalled();
  });

  it('should create a text input with correct styles', () => {
    const mockTextElement = {
      style: { fontFamily: 'Verdana', fontSize: 20, color: '#ff0000', scaleX: 1.5, scaleY: 1.5 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    textTool['textElement'] = mockTextElement;

    textTool['createTextInput'](100, 200, 'Sample Text');

    const input = mockCanvas.parentElement.querySelector('#whiteboard-text-input') as HTMLTextAreaElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('Sample Text');
    expect(input.style.fontFamily).toBe('Verdana');
    expect(input.style.fontSize).toBe('20px');
    // Browsers may convert hex colors to rgb format
    expect(input.style.color).toMatch(/#ff0000|rgb\(255,\s*0,\s*0\)/);
  });

  it('should update text element on text input', () => {
    const mockInput = { value: 'Updated Text', style: { width: '' } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTextElement = { id: '3', text: '' } as any;
    textTool['textInput'] = mockInput as unknown as HTMLTextAreaElement;
    textTool['textElement'] = mockTextElement;

    textTool['handleTextInput'](mockInput as unknown as HTMLTextAreaElement);

    expect(mockInput.style.width).toBe('12ch');
    expect(mockTextElement.text).toBe('Updated Text');
    expect(apiService.updateElements).toHaveBeenCalledWith([mockTextElement]);
  });

  it('should finish text input and add the element if valid', () => {
    const mockInput = { value: 'Valid Text', style: { display: '' }, parentElement: { removeChild: jest.fn() } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTextElement = { id: '4', text: '' } as any;
    textTool['textInput'] = mockInput as unknown as HTMLTextAreaElement;
    textTool['textElement'] = mockTextElement;

    textTool['finishTextInput']();

    expect(apiService.addElements).toHaveBeenCalledWith([mockTextElement]);
    expect(mockInput.parentElement.removeChild).toHaveBeenCalledWith(mockInput);
    expect(textTool['textInput']).toBeNull();
    expect(textTool['textElement']).toBeNull();
  });

  it('should finish text input and remove the element if invalid', () => {
    const mockInput = { value: '', style: { display: '' }, parentElement: { removeChild: jest.fn() } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTextElement = { id: '5', text: '' } as any;
    textTool['textInput'] = mockInput as unknown as HTMLTextAreaElement;
    textTool['textElement'] = mockTextElement;

    textTool['finishTextInput']();

    expect(apiService.removeElements).toHaveBeenCalledWith([mockTextElement]);
    expect(mockInput.parentElement.removeChild).toHaveBeenCalledWith(mockInput);
    expect(textTool['textInput']).toBeNull();
    expect(textTool['textElement']).toBeNull();
  });
});
