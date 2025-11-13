import {
  createMockPointerInfo,
  createMockWhiteboardConfig,
  createTestSignal,
  createReadonlyTestSignal,
  createMockApiService,
  createMockEventBusService,
  createMockConfigService,
} from './test-helpers';
import { ToolType, LineCap, LineJoin, PenType } from '../types';

describe('Test Helpers', () => {
  describe('createMockPointerInfo', () => {
    it('should create pointer info with default values', () => {
      const pointerInfo = createMockPointerInfo();

      expect(pointerInfo).toBeTruthy();
      expect(pointerInfo.x).toBe(0);
      expect(pointerInfo.y).toBe(0);
      expect(pointerInfo.pressure).toBe(0.5);
      expect(pointerInfo.pointerType).toBe('mouse');
      expect(pointerInfo.isPrimary).toBe(true);
    });

    it('should merge partial values with defaults', () => {
      const pointerInfo = createMockPointerInfo({
        x: 100,
        y: 200,
        pressure: 0.8,
      });

      expect(pointerInfo.x).toBe(100);
      expect(pointerInfo.y).toBe(200);
      expect(pointerInfo.pressure).toBe(0.8);
      expect(pointerInfo.pointerType).toBe('mouse'); // Default value
    });

    it('should handle all coordinate properties', () => {
      const pointerInfo = createMockPointerInfo({
        x: 10,
        y: 20,
        clientX: 30,
        clientY: 40,
        pageX: 50,
        pageY: 60,
      });

      expect(pointerInfo.x).toBe(10);
      expect(pointerInfo.y).toBe(20);
      expect(pointerInfo.clientX).toBe(30);
      expect(pointerInfo.clientY).toBe(40);
      expect(pointerInfo.pageX).toBe(50);
      expect(pointerInfo.pageY).toBe(60);
    });

    it('should handle movement properties', () => {
      const pointerInfo = createMockPointerInfo({
        movementX: 5,
        movementY: 10,
      });

      expect(pointerInfo.movementX).toBe(5);
      expect(pointerInfo.movementY).toBe(10);
    });

    it('should handle pressure and tilt properties', () => {
      const pointerInfo = createMockPointerInfo({
        pressure: 0.9,
        tangentialPressure: 0.1,
        tiltX: 15,
        tiltY: 20,
        twist: 45,
      });

      expect(pointerInfo.pressure).toBe(0.9);
      expect(pointerInfo.tangentialPressure).toBe(0.1);
      expect(pointerInfo.tiltX).toBe(15);
      expect(pointerInfo.tiltY).toBe(20);
      expect(pointerInfo.twist).toBe(45);
    });

    it('should handle pointer dimensions', () => {
      const pointerInfo = createMockPointerInfo({
        width: 10,
        height: 15,
      });

      expect(pointerInfo.width).toBe(10);
      expect(pointerInfo.height).toBe(15);
    });

    it('should handle pointer type', () => {
      const mouseInfo = createMockPointerInfo({ pointerType: 'mouse' });
      const penInfo = createMockPointerInfo({ pointerType: 'pen' });
      const touchInfo = createMockPointerInfo({ pointerType: 'touch' });

      expect(mouseInfo.pointerType).toBe('mouse');
      expect(penInfo.pointerType).toBe('pen');
      expect(touchInfo.pointerType).toBe('touch');
    });

    it('should handle button states', () => {
      const pointerInfo = createMockPointerInfo({
        button: 1,
        buttons: 2,
      });

      expect(pointerInfo.button).toBe(1);
      expect(pointerInfo.buttons).toBe(2);
    });

    it('should handle modifier keys', () => {
      const pointerInfo = createMockPointerInfo({
        shiftKey: true,
        ctrlKey: true,
        altKey: false,
        metaKey: true,
      });

      expect(pointerInfo.shiftKey).toBe(true);
      expect(pointerInfo.ctrlKey).toBe(true);
      expect(pointerInfo.altKey).toBe(false);
      expect(pointerInfo.metaKey).toBe(true);
    });

    it('should handle event metadata', () => {
      const timestamp = Date.now();
      const pointerInfo = createMockPointerInfo({
        eventType: 'pointermove',
        isDoubleClick: true,
        timeStamp: timestamp,
      });

      expect(pointerInfo.eventType).toBe('pointermove');
      expect(pointerInfo.isDoubleClick).toBe(true);
      expect(pointerInfo.timeStamp).toBe(timestamp);
    });

    it('should handle pointer identification', () => {
      const pointerInfo = createMockPointerInfo({
        pointerId: 42,
        isPrimary: false,
      });

      expect(pointerInfo.pointerId).toBe(42);
      expect(pointerInfo.isPrimary).toBe(false);
    });

    it('should allow target to be set', () => {
      const target = document.createElement('div');
      const pointerInfo = createMockPointerInfo({ target });

      expect(pointerInfo.target).toBe(target);
    });

    it('should handle empty partial object', () => {
      const pointerInfo = createMockPointerInfo({});

      expect(pointerInfo.x).toBe(0);
      expect(pointerInfo.y).toBe(0);
      expect(pointerInfo.pointerType).toBe('mouse');
    });
  });

  describe('createMockWhiteboardConfig', () => {
    it('should create config with default values', () => {
      const config = createMockWhiteboardConfig();

      expect(config).toBeTruthy();
      expect(config.drawingEnabled).toBe(true);
      expect(config.strokeColor).toBe('#000000');
      expect(config.strokeWidth).toBe(2);
      expect(config.backgroundColor).toBe('#ffffff');
    });

    it('should merge partial values with defaults', () => {
      const config = createMockWhiteboardConfig({
        strokeColor: '#ff0000',
        strokeWidth: 5,
      });

      expect(config.strokeColor).toBe('#ff0000');
      expect(config.strokeWidth).toBe(5);
      expect(config.backgroundColor).toBe('#ffffff'); // Default
    });

    it('should handle drawing properties', () => {
      const config = createMockWhiteboardConfig({
        drawingEnabled: false,
        strokeColor: '#123456',
        strokeWidth: 10,
      });

      expect(config.drawingEnabled).toBe(false);
      expect(config.strokeColor).toBe('#123456');
      expect(config.strokeWidth).toBe(10);
    });

    it('should handle line style properties', () => {
      const config = createMockWhiteboardConfig({
        lineCap: LineCap.Round,
        lineJoin: LineJoin.Bevel,
        dasharray: '5,5',
        dashoffset: 2,
      });

      expect(config.lineCap).toBe(LineCap.Round);
      expect(config.lineJoin).toBe(LineJoin.Bevel);
      expect(config.dasharray).toBe('5,5');
      expect(config.dashoffset).toBe(2);
    });

    it('should handle fill and background colors', () => {
      const config = createMockWhiteboardConfig({
        fill: '#00ff00',
        backgroundColor: '#cccccc',
      });

      expect(config.fill).toBe('#00ff00');
      expect(config.backgroundColor).toBe('#cccccc');
    });

    it('should handle canvas dimensions', () => {
      const config = createMockWhiteboardConfig({
        canvasWidth: 1024,
        canvasHeight: 768,
      });

      expect(config.canvasWidth).toBe(1024);
      expect(config.canvasHeight).toBe(768);
    });

    it('should handle canvas positioning', () => {
      const config = createMockWhiteboardConfig({
        fullScreen: true,
        center: true,
        canvasX: 100,
        canvasY: 200,
      });

      expect(config.fullScreen).toBe(true);
      expect(config.center).toBe(true);
      expect(config.canvasX).toBe(100);
      expect(config.canvasY).toBe(200);
    });

    it('should handle zoom and pan', () => {
      const config = createMockWhiteboardConfig({
        zoom: 1.5,
        x: 50,
        y: 75,
      });

      expect(config.zoom).toBe(1.5);
      expect(config.x).toBe(50);
      expect(config.y).toBe(75);
    });

    it('should handle grid properties', () => {
      const config = createMockWhiteboardConfig({
        enableGrid: true,
        gridSize: 25,
        snapToGrid: true,
      });

      expect(config.enableGrid).toBe(true);
      expect(config.gridSize).toBe(25);
      expect(config.snapToGrid).toBe(true);
    });

    it('should handle text properties', () => {
      const config = createMockWhiteboardConfig({
        fontFamily: 'Helvetica',
        fontSize: 20,
      });

      expect(config.fontFamily).toBe('Helvetica');
      expect(config.fontSize).toBe(20);
    });

    it('should handle keyboard shortcuts', () => {
      const config = createMockWhiteboardConfig({
        keyboardShortcutsEnabled: false,
      });

      expect(config.keyboardShortcutsEnabled).toBe(false);
    });

    it('should handle pen type', () => {
      const config = createMockWhiteboardConfig({
        penType: PenType.Marker,
      });

      expect(config.penType).toBe(PenType.Marker);
    });

    it('should handle empty partial object', () => {
      const config = createMockWhiteboardConfig({});

      expect(config.drawingEnabled).toBe(true);
      expect(config.strokeColor).toBe('#000000');
    });

    it('should create independent config objects', () => {
      const config1 = createMockWhiteboardConfig({ strokeColor: '#111111' });
      const config2 = createMockWhiteboardConfig({ strokeColor: '#222222' });

      expect(config1.strokeColor).not.toBe(config2.strokeColor);
    });
  });

  describe('createTestSignal', () => {
    it('should create a writable signal', () => {
      const signal = createTestSignal(42);

      expect(signal()).toBe(42);
    });

    it('should allow setting new values', () => {
      const signal = createTestSignal('initial');

      signal.set('updated');
      expect(signal()).toBe('updated');
    });

    it('should allow updating values', () => {
      const signal = createTestSignal(10);

      signal.update((val) => val + 5);
      expect(signal()).toBe(15);
    });

    it('should handle different types', () => {
      const numberSignal = createTestSignal(42);
      const stringSignal = createTestSignal('text');
      const booleanSignal = createTestSignal(true);
      const objectSignal = createTestSignal({ key: 'value' });

      expect(numberSignal()).toBe(42);
      expect(stringSignal()).toBe('text');
      expect(booleanSignal()).toBe(true);
      expect(objectSignal()).toEqual({ key: 'value' });
    });

    it('should handle null and undefined', () => {
      const nullSignal = createTestSignal(null);
      const undefinedSignal = createTestSignal(undefined);

      expect(nullSignal()).toBeNull();
      expect(undefinedSignal()).toBeUndefined();
    });

    it('should handle arrays', () => {
      const signal = createTestSignal([1, 2, 3]);

      expect(signal()).toEqual([1, 2, 3]);
      signal.set([4, 5, 6]);
      expect(signal()).toEqual([4, 5, 6]);
    });

    it('should be reactive', () => {
      const signal = createTestSignal(1);
      let readValue = signal();

      signal.set(2);
      readValue = signal();

      expect(readValue).toBe(2);
    });
  });

  describe('createReadonlyTestSignal', () => {
    it('should create a readonly signal', () => {
      const signal = createReadonlyTestSignal(42);

      expect(signal()).toBe(42);
    });

    it('should not have set or update methods', () => {
      const signal = createReadonlyTestSignal('readonly');

      expect((signal as any).set).toBeUndefined();
      expect((signal as any).update).toBeUndefined();
    });

    it('should handle different types', () => {
      const numberSignal = createReadonlyTestSignal(100);
      const stringSignal = createReadonlyTestSignal('readonly');
      const booleanSignal = createReadonlyTestSignal(false);

      expect(numberSignal()).toBe(100);
      expect(stringSignal()).toBe('readonly');
      expect(booleanSignal()).toBe(false);
    });

    it('should handle complex objects', () => {
      const signal = createReadonlyTestSignal({ nested: { value: 42 } });

      expect(signal()).toEqual({ nested: { value: 42 } });
    });
  });

  describe('createMockApiService', () => {
    it('should create a mock API service', () => {
      const mockApi = createMockApiService();

      expect(mockApi).toBeTruthy();
    });

    it('should have all required signal properties', () => {
      const mockApi = createMockApiService();

      expect(mockApi.elements).toBeTruthy();
      expect(mockApi.draftElements).toBeTruthy();
      expect(mockApi.allElements).toBeTruthy();
      expect(mockApi.selectedElements).toBeTruthy();
      expect(mockApi.config).toBeTruthy();
      expect(mockApi.elementsCount).toBeTruthy();
      expect(mockApi.hasElements).toBeTruthy();
      expect(mockApi.selectedTool).toBeTruthy();
    });

    it('should have signals that are callable', () => {
      const mockApi = createMockApiService();

      expect(typeof mockApi.elements).toBe('function');
      expect(typeof mockApi.config).toBe('function');
      expect(typeof mockApi.selectedTool).toBe('function');
    });

    it('should have default signal values', () => {
      const mockApi = createMockApiService();

      expect(mockApi.elements()).toEqual([]);
      expect(mockApi.draftElements()).toEqual([]);
      expect(mockApi.selectedElements()).toEqual([]);
      expect(mockApi.elementsCount()).toBe(0);
      expect(mockApi.hasElements()).toBe(false);
      expect(mockApi.selectedTool()).toBe(ToolType.Select);
    });

    it('should have config signal with default values', () => {
      const mockApi = createMockApiService();
      const config = mockApi.config();

      expect(config.strokeColor).toBe('#000000');
      expect(config.strokeWidth).toBe(2);
      expect(config.drawingEnabled).toBe(true);
    });

    it('should have all element operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.addElements).toBeDefined();
      expect(mockApi.updateElements).toBeDefined();
      expect(mockApi.removeElements).toBeDefined();
      expect(mockApi.clearElements).toBeDefined();
      expect(mockApi.getElements).toBeDefined();
      expect(mockApi.getElementById).toBeDefined();
    });

    it('should have all draft operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.addDraftElements).toBeDefined();
      expect(mockApi.addToDraft).toBeDefined();
      expect(mockApi.updateDraftElements).toBeDefined();
      expect(mockApi.commitDraft).toBeDefined();
      expect(mockApi.clearDraft).toBeDefined();
    });

    it('should have all selection operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.selectElements).toBeDefined();
      expect(mockApi.deselectElements).toBeDefined();
      expect(mockApi.clearSelection).toBeDefined();
      expect(mockApi.getSelectedElements).toBeDefined();
    });

    it('should have tool operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.setTool).toBeDefined();
      expect(mockApi.getTool).toBeDefined();
    });

    it('should have canvas operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.centerCanvas).toBeDefined();
      expect(mockApi.fullScreen).toBeDefined();
      expect(mockApi.pan).toBeDefined();
    });

    it('should have zoom operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.zoomIn).toBeDefined();
      expect(mockApi.zoomOut).toBeDefined();
      expect(mockApi.resetZoom).toBeDefined();
      expect(mockApi.setZoom).toBeDefined();
    });

    it('should have history operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.undo).toBeDefined();
      expect(mockApi.redo).toBeDefined();
      expect(mockApi.pushToUndo).toBeDefined();
      expect(mockApi.canUndo).toBeDefined();
      expect(mockApi.canRedo).toBeDefined();
    });

    it('should have IO operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.save).toBeDefined();
      expect(mockApi.load).toBeDefined();
      expect(mockApi.exportImage).toBeDefined();
      expect(mockApi.addImage).toBeDefined();
    });

    it('should have internal writable signals for testing', () => {
      const mockApi = createMockApiService();

      expect(mockApi._mockElements).toBeDefined();
      expect(mockApi._mockConfig).toBeDefined();
      expect(mockApi._mockSelectedTool).toBeDefined();
    });

    it('should allow updating internal signals', () => {
      const mockApi = createMockApiService();

      mockApi._mockElementsCount.set(5);
      expect(mockApi.elementsCount()).toBe(5);

      mockApi._mockHasElements.set(true);
      expect(mockApi.hasElements()).toBe(true);
    });

    it('should return default values from methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.getElements()).toEqual([]);
      expect(mockApi.getSelectedElements()).toEqual([]);
      expect(mockApi.canUndo()).toBe(false);
      expect(mockApi.canRedo()).toBe(false);
      expect(mockApi.getNextZIndex()).toBe(1);
    });

    it('should have layer operation methods', () => {
      const mockApi = createMockApiService();

      expect(mockApi.getCurrentLayer).toBeDefined();
      expect(mockApi.getActiveLayerId).toBeDefined();
      expect(mockApi.setCurrentLayer).toBeDefined();
    });

    it('should return default layer ID', () => {
      const mockApi = createMockApiService();

      expect(mockApi.getCurrentLayer()).toBe('layer1');
      expect(mockApi.getActiveLayerId()).toBe('layer1');
    });
  });

  describe('createMockEventBusService', () => {
    it('should create a mock event bus service', () => {
      const mockEventBus = createMockEventBusService();

      expect(mockEventBus).toBeTruthy();
    });

    it('should have all required methods', () => {
      const mockEventBus = createMockEventBusService();

      expect(mockEventBus.emit).toBeDefined();
      expect(mockEventBus.listen).toBeDefined();
      expect(mockEventBus.on).toBeDefined();
      expect(mockEventBus.listenToMultiple).toBeDefined();
      expect(mockEventBus.getEventSignal).toBeDefined();
      expect(mockEventBus.getAllEventsSignal).toBeDefined();
      expect(mockEventBus.destroy).toBeDefined();
    });

    it('should have lastEvent signal', () => {
      const mockEventBus = createMockEventBusService();

      expect(mockEventBus.lastEvent).toBeDefined();
      expect(typeof mockEventBus.lastEvent).toBe('function');
    });

    it('should return observables from stream methods', () => {
      const mockEventBus = createMockEventBusService();

      const listen$ = mockEventBus.listen();
      const on$ = mockEventBus.on();
      const multiple$ = mockEventBus.listenToMultiple();

      expect(listen$).toBeTruthy();
      expect(on$).toBeTruthy();
      expect(multiple$).toBeTruthy();
    });

    it('should have callable signal methods', () => {
      const mockEventBus = createMockEventBusService();

      const signal = mockEventBus.getEventSignal();
      const allSignal = mockEventBus.getAllEventsSignal();

      expect(typeof signal).toBe('function');
      expect(typeof allSignal).toBe('function');
    });

    it('should return undefined from signal methods by default', () => {
      const mockEventBus = createMockEventBusService();

      const signal = mockEventBus.getEventSignal();
      const allSignal = mockEventBus.getAllEventsSignal();
      const lastEvent = mockEventBus.lastEvent();

      expect(signal()).toBeUndefined();
      expect(allSignal()).toBeUndefined();
      expect(lastEvent).toBeUndefined();
    });

    it('should have noop methods that do not throw', () => {
      const mockEventBus = createMockEventBusService();

      expect(() => mockEventBus.emit('test', {})).not.toThrow();
      expect(() => mockEventBus.destroy()).not.toThrow();
    });
  });

  describe('createMockConfigService', () => {
    it('should create a mock config service', () => {
      const mockConfig = createMockConfigService();

      expect(mockConfig).toBeTruthy();
    });

    it('should have required methods', () => {
      const mockConfig = createMockConfigService();

      expect(mockConfig.getConfig).toBeDefined();
      expect(mockConfig.updateConfig).toBeDefined();
      expect(mockConfig.config).toBeDefined();
    });

    it('should have config signal', () => {
      const mockConfig = createMockConfigService();

      expect(mockConfig.config).toBeDefined();
      expect(typeof mockConfig.config).toBe('function');
    });

    it('should return default config', () => {
      const mockConfig = createMockConfigService();
      const config = mockConfig.getConfig();

      expect(config.strokeColor).toBe('#000000');
      expect(config.strokeWidth).toBe(2);
      expect(config.drawingEnabled).toBe(true);
    });

    it('should have writable signal for testing', () => {
      const mockConfig = createMockConfigService();

      expect(mockConfig._mockConfig).toBeDefined();
    });

    it('should allow updating config via internal signal', () => {
      const mockConfig = createMockConfigService();

      const newConfig = createMockWhiteboardConfig({ strokeColor: '#ff0000' });
      mockConfig._mockConfig.set(newConfig);

      expect(mockConfig.config().strokeColor).toBe('#ff0000');
      expect(mockConfig.getConfig().strokeColor).toBe('#ff0000');
    });

    it('should have synchronized config signal and getter', () => {
      const mockConfig = createMockConfigService();

      const signalValue = mockConfig.config();
      const getterValue = mockConfig.getConfig();

      expect(signalValue).toEqual(getterValue);
    });

    it('should not throw when calling updateConfig', () => {
      const mockConfig = createMockConfigService();

      expect(() => mockConfig.updateConfig({ strokeColor: '#blue' })).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a test scenario', () => {
      const mockApi = createMockApiService();
      const mockEventBus = createMockEventBusService();
      const mockConfig = createMockConfigService();

      // Simulate test setup
      mockApi._mockElementsCount.set(3);
      mockConfig._mockConfig.set(createMockWhiteboardConfig({ strokeWidth: 10 }));

      // Verify state
      expect(mockApi.elementsCount()).toBe(3);
      expect(mockConfig.getConfig().strokeWidth).toBe(10);
    });

    it('should create independent mock instances', () => {
      const mockApi1 = createMockApiService();
      const mockApi2 = createMockApiService();

      mockApi1._mockElementsCount.set(5);
      mockApi2._mockElementsCount.set(10);

      expect(mockApi1.elementsCount()).toBe(5);
      expect(mockApi2.elementsCount()).toBe(10);
    });

    it('should handle pointer info with config', () => {
      const pointerInfo = createMockPointerInfo({ x: 100, y: 200 });
      const config = createMockWhiteboardConfig({ strokeWidth: 5 });

      expect(pointerInfo.x).toBe(100);
      expect(config.strokeWidth).toBe(5);
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper types for signals', () => {
      const numberSignal = createTestSignal(42);
      const stringSignal = createTestSignal('text');

      // These should be type-safe in TypeScript
      numberSignal.set(100);
      stringSignal.set('new text');

      expect(numberSignal()).toBe(100);
      expect(stringSignal()).toBe('new text');
    });

    it('should maintain proper types for readonly signals', () => {
      const signal = createReadonlyTestSignal<number>(42);

      expect(signal()).toBe(42);
    });

    it('should maintain proper types for config', () => {
      const config = createMockWhiteboardConfig({
        strokeWidth: 5,
        strokeColor: '#fff',
      });

      expect(typeof config.strokeWidth).toBe('number');
      expect(typeof config.strokeColor).toBe('string');
      expect(typeof config.drawingEnabled).toBe('boolean');
    });
  });
});
