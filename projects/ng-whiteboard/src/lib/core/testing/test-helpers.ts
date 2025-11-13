/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signal, WritableSignal, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { WhiteboardConfig, WhiteboardElement, ToolType, PointerInfo, LineCap, LineJoin, PenType } from '../types';

/**
 * Creates a mock PointerInfo from a partial PointerEvent-like object
 */
export function createMockPointerInfo(partial: Partial<PointerInfo> = {}): PointerInfo {
  const defaults: PointerInfo = {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    movementX: 0,
    movementY: 0,
    pressure: 0.5,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    width: 1,
    height: 1,
    pointerType: 'mouse',
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    eventType: 'pointerdown',
    isDoubleClick: false,
    timeStamp: Date.now(),
    target: null,
  };

  return { ...defaults, ...partial };
}

/**
 * Creates a mock WhiteboardConfig with all required properties
 */
export function createMockWhiteboardConfig(partial: Partial<WhiteboardConfig> = {}): WhiteboardConfig {
  const defaults: WhiteboardConfig = {
    drawingEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 2,
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    dasharray: '',
    dashoffset: 0,
    fill: 'transparent',
    backgroundColor: '#ffffff',
    canvasWidth: 800,
    canvasHeight: 600,
    fullScreen: false,
    center: false,
    zoom: 1,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    snapToGrid: false,
    gridSize: 20,
    enableGrid: false,
    keyboardShortcutsEnabled: true,
    fontFamily: 'Arial',
    fontSize: 16,
    penType: PenType.Pen,
  };

  return { ...defaults, ...partial };
}

/**
 * Creates a writable signal for testing
 */
export function createTestSignal<T>(initialValue: T): WritableSignal<T> {
  return signal(initialValue);
}

/**
 * Creates a read-only signal for testing
 */
export function createReadonlyTestSignal<T>(initialValue: T): Signal<T> {
  return signal(initialValue).asReadonly();
}

/**
 * Type for mock function (compatible with jest.Mock)
 */
export type MockFn<T extends (...args: any[]) => any = any> = T & {
  mockReturnValue: (value: ReturnType<T>) => MockFn<T>;
  mockImplementation: (fn: T) => MockFn<T>;
  mockResolvedValue: (value: any) => MockFn<T>;
  mockRejectedValue: (value: any) => MockFn<T>;
};

/**
 * Creates a mock API Service with all required methods and signals
 * Use this in your tests by calling: const mockApiService = createMockApiService()
 */
export function createMockApiService() {
  const mockElements = createTestSignal<WhiteboardElement[]>([]);
  const mockDraftElements = createTestSignal<WhiteboardElement[]>([]);
  const mockAllElements = createTestSignal<WhiteboardElement[]>([]);
  const mockSelectedElements = createTestSignal<WhiteboardElement[]>([]);
  const mockConfig = createTestSignal<WhiteboardConfig>(createMockWhiteboardConfig());
  const mockElementsCount = createTestSignal<number>(0);
  const mockHasElements = createTestSignal<boolean>(false);
  const mockSelectedTool = createTestSignal<ToolType>(ToolType.Select);

  // We don't use jest.fn() here so this file compiles without jest types
  // Tests will assign jest.fn() to these properties
  const noop: any = (): any => undefined;
  const noopWithReturn = (val: any) => (): any => val;

  return {
    // Signals
    elements: mockElements.asReadonly(),
    draftElements: mockDraftElements.asReadonly(),
    allElements: mockAllElements.asReadonly(),
    selectedElements: mockSelectedElements.asReadonly(),
    config: mockConfig.asReadonly(),
    elementsCount: mockElementsCount.asReadonly(),
    hasElements: mockHasElements.asReadonly(),
    selectedTool: mockSelectedTool.asReadonly(),

    // Element operations
    addElements: noop,
    updateElements: noop,
    removeElements: noop,
    clearElements: noop,
    getElements: noopWithReturn([]),
    getDraftElements: noopWithReturn([]),
    getAllElements: noopWithReturn([]),
    getNextZIndex: noopWithReturn(1),
    elementExists: noopWithReturn(false),
    getElementById: noop,

    // Draft operations
    addDraftElements: noop,
    addToDraft: noop,
    updateDraftElements: noop,
    commitDraft: noop,
    commitDraftElements: noop,
    clearDraft: noop,

    // Selection operations
    selectElements: noop,
    deselectElements: noop,
    clearSelection: noop,
    getSelectedElements: noopWithReturn([]),

    // Tool operations
    setTool: noop,
    getTool: noop,

    // Canvas operations
    centerCanvas: noop,
    fullScreen: noop,
    pan: noop,

    // Cursor operations
    setCursor: noop,
    resetCursor: noop,

    // Zoom operations
    zoomIn: noop,
    zoomOut: noop,
    resetZoom: noop,
    setZoom: noop,

    // History operations
    undo: noop,
    redo: noop,
    pushToUndo: noop,
    canUndo: noopWithReturn(false),
    canRedo: noopWithReturn(false),

    // Config operations
    getConfig: noopWithReturn(createMockWhiteboardConfig()),
    updateConfig: noop,

    // IO operations
    save: noop,
    load: noop,
    exportImage: noop,
    addImage: noop,

    // Layer operations
    getCurrentLayer: noopWithReturn('layer1'),
    getActiveLayerId: noopWithReturn('layer1'),
    setCurrentLayer: noop,

    // Internal signals (for updating in tests)
    _mockElements: mockElements,
    _mockDraftElements: mockDraftElements,
    _mockAllElements: mockAllElements,
    _mockSelectedElements: mockSelectedElements,
    _mockConfig: mockConfig,
    _mockElementsCount: mockElementsCount,
    _mockHasElements: mockHasElements,
    _mockSelectedTool: mockSelectedTool,
  };
}

/**
 * Creates a mock EventBusService with all required methods
 */
export function createMockEventBusService() {
  const noop: any = (): any => undefined;
  const noopObservable = (): Observable<any> => of();

  // Create a simple signal for each event type
  const createEventSignal = (): Signal<any> => signal(undefined).asReadonly();

  return {
    emit: noop,
    listen: noopObservable,
    on: noopObservable,
    listenToMultiple: noopObservable,
    getEventSignal: createEventSignal,
    getAllEventsSignal: (): Signal<any> => signal(undefined).asReadonly(),
    lastEvent: signal(undefined).asReadonly(),
    destroy: noop,
  };
}

/**
 * Creates a mock ConfigService
 */
export function createMockConfigService() {
  const configSignal = createTestSignal<WhiteboardConfig>(createMockWhiteboardConfig());

  const noop: any = (): any => undefined;
  return {
    getConfig: (): WhiteboardConfig => configSignal(),
    updateConfig: noop,
    config: configSignal.asReadonly(),
    _mockConfig: configSignal,
  };
}
