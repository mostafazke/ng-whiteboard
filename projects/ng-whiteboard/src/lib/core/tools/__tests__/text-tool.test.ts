import { DataService } from '../../data/data.service';
import { LineCap, LineJoin, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { TextTool } from '../text-tool';
import { ElementType } from '../../types';

describe('TextTool', () => {
  let textTool: TextTool;
  let dataService: DataService;
  let config: WhiteboardConfig;
  let mockCanvas: any;

  beforeEach(() => {
    config = {
      snapToGrid: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Butt,
      lineJoin: LineJoin.Miter,
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
      elementsTranslation: { x: 0, y: 0 },
    } as WhiteboardConfig;

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

    dataService = {
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(config),
      getCanvas: jest.fn().mockReturnValue(mockCanvas),
      getData: jest.fn().mockReturnValue([]),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      removeElements: jest.fn(),
      hasElement: jest.fn().mockReturnValue(false),
      pushToUndo: jest.fn(),
    } as unknown as DataService;

    textTool = new TextTool(dataService);
    textTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(textTool.type).toBe(ToolType.Text);
  });
  it('should handle pointer down and create a new text element', () => {
    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    jest.spyOn(textTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    jest.spyOn(dataService, 'getData').mockReturnValue([]);

    textTool.handlePointerDown(mockEvent);

    expect(textTool.getPointerPosition).toHaveBeenCalledWith(mockEvent);
    expect(mockCanvas.parentElement.querySelector).toHaveBeenCalledWith('#textInput');
    expect(dataService.addElement).not.toHaveBeenCalled();
  });

  it('should handle pointer down and edit an existing text element', () => {
    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    const existingTextElement = { id: '1', type: ElementType.Text, x: 100, y: 200, text: 'Hello' } as WhiteboardElement;
    jest.spyOn(dataService, 'getData').mockReturnValue([existingTextElement]);
    jest.spyOn(dataService, 'hasElement').mockReturnValue(true);

    textTool.handlePointerDown(mockEvent);

    expect(mockCanvas.parentElement.querySelector).toHaveBeenCalledWith('#textInput');
    expect(dataService.updateElement).not.toHaveBeenCalled();
  });

  it('should handle pointer up and focus on the text input', () => {
    const mockInput = { addEventListener: jest.fn(), focus: jest.fn() };
    textTool['textInput'] = mockInput as unknown as HTMLInputElement;

    textTool.handlePointerUp();

    expect(mockInput.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(mockInput.focus).toHaveBeenCalled();
  });

  it('should handle text input and update the text element', () => {
    const mockInput = { value: 'Updated Text', style: { width: '' } };
    const mockTextElement = { id: '1', text: '' };
    textTool['textInput'] = mockInput as unknown as HTMLInputElement;
    textTool['textElement'] = mockTextElement as any;

    textTool['handleTextInput'](mockInput as HTMLInputElement);

    expect(mockInput.style.width).toBe('12ch');
    expect(mockTextElement.text).toBe('Updated Text');
    expect(dataService.updateElement).toHaveBeenCalledWith(mockTextElement);
  });

  it('should create a new text element when handlePointerDown is called', () => {
    const mockEvent = { clientX: 150, clientY: 250 } as PointerEvent;
    jest.spyOn(textTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    jest.spyOn(dataService, 'getData').mockReturnValue([]);

    textTool.handlePointerDown(mockEvent);

    expect(textTool.getPointerPosition).toHaveBeenCalledWith(mockEvent);
    expect(mockCanvas.parentElement.querySelector).toHaveBeenCalledWith('#textInput');
    expect(textTool['textElement']).not.toBeNull();
    expect(textTool['textInput']).not.toBeNull();
  });

  it('should edit an existing text element when handlePointerDown is called', () => {
    const mockEvent = { offsetX: 150, offsetY: 250 } as PointerEvent;
    const existingTextElement = {
      id: '2',
      type: ElementType.Text,
      x: 150,
      y: 250,
      text: 'Existing Text',
    } as WhiteboardElement;
    jest.spyOn(dataService, 'getData').mockReturnValue([existingTextElement]);

    textTool.handlePointerDown(mockEvent);

    expect(mockCanvas.parentElement.querySelector).toHaveBeenCalledWith('#textInput');
    expect(textTool['textInput']).not.toBeNull();
  });

  it('should finish text input when handlePointerDown is called while editing', () => {
    const mockEvent = { clientX: 150, clientY: 250 } as PointerEvent;
    const finishTextInputSpy = jest.spyOn(textTool as any, 'finishTextInput');
    textTool['textInput'] = {} as HTMLInputElement;

    textTool.handlePointerDown(mockEvent);

    expect(finishTextInputSpy).toHaveBeenCalled();
  });

  it('should create a text input with correct styles', () => {
    const mockTextElement = {
      style: { fontFamily: 'Verdana', fontSize: 20, color: '#ff0000', scaleX: 1.5, scaleY: 1.5 },
    };
    textTool['textElement'] = mockTextElement as any;

    textTool['createTextInput'](100, 200, 'Sample Text');

    const input = mockCanvas.parentElement.querySelector('#textInput') as HTMLInputElement;
    expect(input.value).toBe('Sample Text');
    expect(input.style.left).toBe('100px');
    expect(input.style.top).toBe('200px');
    expect(input.style.fontFamily).toBe('Verdana');
    expect(input.style.fontSize).toBe('20px');
    expect(input.style.color).toBe('#ff0000');
    expect(input.style.transform).toBe('scale(1, 1)');
    expect(input.style.display).toBe('block');
  });

  it('should update text element on text input', () => {
    const mockInput = { value: 'Updated Text', style: { width: '' } };
    const mockTextElement = { id: '3', text: '' };
    textTool['textInput'] = mockInput as unknown as HTMLInputElement;
    textTool['textElement'] = mockTextElement as any;

    textTool['handleTextInput'](mockInput as HTMLInputElement);

    expect(mockInput.style.width).toBe('12ch');
    expect(mockTextElement.text).toBe('Updated Text');
    expect(dataService.updateElement).toHaveBeenCalledWith(mockTextElement);
  });

  it('should finish text input and add the element if valid', () => {
    const mockInput = { value: 'Valid Text', style: { display: '' } };
    const mockTextElement = { id: '4', text: '' };
    textTool['textInput'] = mockInput as unknown as HTMLInputElement;
    textTool['textElement'] = mockTextElement as any;

    textTool['finishTextInput']();

    expect(dataService.addElement).toHaveBeenCalledWith(mockTextElement);
    expect(dataService.pushToUndo).toHaveBeenCalled();
    expect(mockInput.style.display).toBe('none');
    expect(textTool['textInput']).toBeNull();
    expect(textTool['textElement']).toBeNull();
  });

  it('should finish text input and remove the element if invalid', () => {
    const mockInput = { value: '', style: { display: '' } };
    const mockTextElement = { id: '5', text: '' };
    textTool['textInput'] = mockInput as unknown as HTMLInputElement;
    textTool['textElement'] = mockTextElement as any;

    textTool['finishTextInput']();

    expect(dataService.removeElements).toHaveBeenCalledWith([mockTextElement.id]);
    expect(mockInput.style.display).toBe('none');
    expect(textTool['textInput']).toBeNull();
    expect(textTool['textElement']).toBeNull();
  });
});
