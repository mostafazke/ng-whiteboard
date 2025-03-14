import { ToolType } from '../../types';
import { TextTool } from '../text-tool';

describe('TextTool', () => {
  let textTool: TextTool;
  let mockDataService: any;
  let mockWhiteboardConfig: any;
  let mockCanvas: any;

  beforeEach(() => {
    mockWhiteboardConfig = {
      snapToGrid: false,
      gridSize: 10,
      strokeColor: '#000000',
      strokeWidth: 1,
      lineJoin: 'miter',
      fill: 'none',
      dasharray: '',
      dashoffset: 0,
      fontFamily: 'Arial',
      fontSize: 16,
      zoom: 1,
      elementsTranslation: { x: 0, y: 0 },
    };

    mockCanvas = {
      parentElement: {
        querySelector: jest.fn().mockReturnValue({
          style: {},
          addEventListener: jest.fn(),
          focus: jest.fn(),
          value: '',
        }),
      },
    };

    mockDataService = {
      getCanvasCoordinates: jest.fn().mockReturnValue([100, 200]),
      getCanvas: jest.fn().mockReturnValue(mockCanvas),
      getData: jest.fn().mockReturnValue([]),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      removeElement: jest.fn(),
      hasElement: jest.fn().mockReturnValue(false),
      pushToUndo: jest.fn(),
      getConfig: jest.fn().mockReturnValue(mockWhiteboardConfig),
    };

    textTool = new TextTool(mockDataService);
    textTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(textTool.type).toBe(ToolType.Text);
  });
  it('should create a new text element on pointer down', () => {
    const mockEvent = { offsetX: 50, offsetY: 50 } as PointerEvent;

    textTool.handlePointerDown(mockEvent);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([50, 50]);
    expect(textTool['textElement']).not.toBeNull();
    expect(mockCanvas.parentElement.querySelector).toHaveBeenCalledWith('#textInput');
  });

  it('should finish text input if textInput exists on pointer down', () => {
    const mockEvent = new MouseEvent('pointerdown') as PointerEvent;

    const finishTextInputSpy = jest.spyOn(textTool as any, 'finishTextInput');
    textTool['textInput'] = {} as HTMLInputElement;

    textTool.handlePointerDown(mockEvent);

    expect(finishTextInputSpy).toHaveBeenCalled();
  });

  it('should handle pointer up and focus on text input', () => {
    const mockInput = {
      addEventListener: jest.fn(),
      focus: jest.fn(),
    } as unknown as HTMLInputElement;

    textTool['textInput'] = mockInput;

    textTool.handlePointerUp();

    expect(mockInput.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(mockInput.focus).toHaveBeenCalled();
  });

  it('should create a text input with correct styles', () => {
    const mockInput = mockCanvas.parentElement.querySelector('#textInput') as HTMLInputElement;

    textTool['createTextInput'](100, 200, 'Test');

    expect(mockInput.value).toBe('Test');
    expect(mockInput.style.left).toBe('100px');
    expect(mockInput.style.top).toBe('200px');
    expect(mockInput.style.fontFamily).toBe('Arial');
    expect(mockInput.style.fontSize).toBe('16px');
    expect(mockInput.style.color).toBe('#000000');
    expect(mockInput.style.display).toBe('block');
  });

  it('should handle text input and update text element', () => {
    const mockInput = { value: 'New Text', style: { width: '' } } as HTMLInputElement;
    textTool['textElement'] = { text: '' } as any;

    textTool['handleTextInput'](mockInput);

    expect(mockInput.style.width).toBe('8ch');
    expect(textTool['textElement']!.text).toBe('New Text');
    expect(mockDataService.updateElement).toHaveBeenCalledWith(textTool['textElement']);
  });

  it('should finish text input and add element if valid', () => {
    const mockInput = { value: 'Valid Text', style: { display: '' } } as HTMLInputElement;
    const mockTextElement = { id: '1' } as any;

    textTool['textInput'] = mockInput;
    textTool['textElement'] = mockTextElement;

    textTool['finishTextInput']();

    expect(mockDataService.addElement).toHaveBeenCalledWith(mockTextElement);
    expect(mockDataService.pushToUndo).toHaveBeenCalled();
    expect(mockInput.style.display).toBe('none');
    expect(textTool['textInput']).toBeNull();
    expect(textTool['textElement']).toBeNull();
  });

  it('should finish text input and remove element if invalid', () => {
    const mockInput = { value: '', style: { display: '' } } as HTMLInputElement;
    const mockTextElement = { id: '1' } as any;

    textTool['textInput'] = mockInput;
    textTool['textElement'] = mockTextElement;

    textTool['finishTextInput']();

    expect(mockDataService.removeElement).toHaveBeenCalledWith('1');
    expect(mockInput.style.display).toBe('none');
    expect(textTool['textInput']).toBeNull();
    expect(textTool['textElement']).toBeNull();
  });
});
