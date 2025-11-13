import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';
import { ElementsService } from '../elements/elements.service';
import { ElementType, defaultElementStyle, LineCap, LineJoin } from '../types';
import { RectangleElement } from '../elements/rectangle-element';
import { EllipseElement } from '../elements/ellipse-element';
import { LineElement } from '../elements/line-element';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let mockElementsService: jest.Mocked<ElementsService>;
  let localStorageMock: { [key: string]: string };

  const CLIPBOARD_KEY = 'whiteboard-clipboard';

  const createMockRectangle = (id: string, x = 100, y = 100): RectangleElement => ({
    id,
    type: ElementType.Rectangle,
    x,
    y,
    width: 100,
    height: 50,
    rx: 5,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: true,
    style: { ...defaultElementStyle },
  });

  const createMockEllipse = (id: string, x = 100, y = 100): EllipseElement => ({
    id,
    type: ElementType.Ellipse,
    x,
    y,
    cx: x + 50,
    cy: y + 25,
    rx: 50,
    ry: 25,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: true,
    style: { ...defaultElementStyle },
  });

  const createMockLine = (id: string, x = 100, y = 100): LineElement => ({
    id,
    type: ElementType.Line,
    x,
    y,
    x1: x,
    y1: y,
    x2: x + 100,
    y2: y + 100,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: true,
    style: { ...defaultElementStyle },
  });

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });

    // Mock ElementsService
    mockElementsService = {
      addElements: jest.fn(),
    } as unknown as jest.Mocked<ElementsService>;

    TestBed.configureTestingModule({
      providers: [ClipboardService, { provide: ElementsService, useValue: mockElementsService }],
    });

    service = TestBed.inject(ClipboardService);

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {
      // No-op
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Core Clipboard Operations', () => {
    describe('copy', () => {
      it('should copy elements to localStorage', () => {
        const elements = [createMockRectangle('elem1', 100, 100), createMockEllipse('elem2', 200, 200)];

        service.copy(elements);

        expect(localStorage.setItem).toHaveBeenCalledWith(CLIPBOARD_KEY, expect.any(String));

        const storedData = JSON.parse(localStorageMock[CLIPBOARD_KEY]);
        expect(storedData.elements).toEqual(elements);
        expect(storedData.timestamp).toBeGreaterThan(0);
      });

      it('should not copy when elements array is empty', () => {
        service.copy([]);

        expect(localStorage.setItem).not.toHaveBeenCalled();
      });

      it('should handle localStorage errors gracefully', () => {
        const elements = [createMockRectangle('elem1')];
        jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
          throw new Error('Storage full');
        });

        expect(() => service.copy(elements)).not.toThrow();
        expect(console.error).toHaveBeenCalledWith('Failed to copy elements to clipboard:', expect.any(Error));
      });

      it('should update timestamp on each copy operation', () => {
        const elements = [createMockRectangle('elem1')];

        service.copy(elements);
        const firstTimestamp = JSON.parse(localStorageMock[CLIPBOARD_KEY]).timestamp;

        // Small delay to ensure different timestamp
        jest.advanceTimersByTime(10);

        service.copy(elements);
        const secondTimestamp = JSON.parse(localStorageMock[CLIPBOARD_KEY]).timestamp;

        expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
      });

      it('should overwrite previous clipboard data', () => {
        const firstElements = [createMockRectangle('elem1')];
        const secondElements = [createMockEllipse('elem2')];

        service.copy(firstElements);
        service.copy(secondElements);

        const storedData = JSON.parse(localStorageMock[CLIPBOARD_KEY]);
        expect(storedData.elements).toEqual(secondElements);
        expect(storedData.elements).not.toEqual(firstElements);
      });
    });

    describe('cut', () => {
      it('should copy elements to clipboard', () => {
        const elements = [createMockRectangle('elem1'), createMockEllipse('elem2')];

        service.cut(elements);

        expect(localStorage.setItem).toHaveBeenCalledWith(CLIPBOARD_KEY, expect.any(String));

        const storedData = JSON.parse(localStorageMock[CLIPBOARD_KEY]);
        expect(storedData.elements).toEqual(elements);
      });

      it('should not delete elements (deletion handled by caller)', () => {
        const elements = [createMockRectangle('elem1')];

        service.cut(elements);

        // Cut should only copy, not interact with ElementsService
        expect(mockElementsService.addElements).not.toHaveBeenCalled();
      });

      it('should handle empty array', () => {
        service.cut([]);

        expect(localStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('paste', () => {
      it('should paste elements with offset', () => {
        const originalElements = [createMockRectangle('elem1', 100, 100), createMockEllipse('elem2', 200, 200)];

        service.copy(originalElements);
        const pastedElements = service.paste();

        expect(mockElementsService.addElements).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: ElementType.Rectangle,
              x: 120, // 100 + 20 offset
              y: 120,
            }),
            expect.objectContaining({
              type: ElementType.Ellipse,
              x: 220, // 200 + 20 offset
              y: 220,
            }),
          ])
        );

        expect(pastedElements).toHaveLength(2);
      });

      it('should generate new IDs for pasted elements', () => {
        const originalElements = [createMockRectangle('elem1')];

        service.copy(originalElements);
        const pastedElements = service.paste();

        expect(pastedElements[0].id).not.toBe('elem1');
        expect(pastedElements[0].id).toContain('elem1_copy_');
      });

      it('should return empty array when clipboard is empty', () => {
        const pastedElements = service.paste();

        expect(pastedElements).toEqual([]);
        expect(mockElementsService.addElements).not.toHaveBeenCalled();
      });

      it('should handle corrupted clipboard data', () => {
        localStorageMock[CLIPBOARD_KEY] = 'invalid json';

        const pastedElements = service.paste();

        expect(pastedElements).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      });

      it('should preserve element properties', () => {
        const originalElement = createMockRectangle('elem1', 100, 100);
        originalElement.style.strokeColor = '#FF0000';
        originalElement.style.strokeWidth = 5;

        service.copy([originalElement]);
        const pastedElements = service.paste();

        expect(pastedElements[0].style.strokeColor).toBe('#FF0000');
        expect(pastedElements[0].style.strokeWidth).toBe(5);
      });
    });

    describe('clear', () => {
      it('should remove clipboard data from localStorage', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);

        service.clear();

        expect(localStorage.removeItem).toHaveBeenCalledWith(CLIPBOARD_KEY);
        expect(localStorageMock[CLIPBOARD_KEY]).toBeUndefined();
      });

      it('should handle errors gracefully', () => {
        jest.spyOn(localStorage, 'removeItem').mockImplementation(() => {
          throw new Error('Access denied');
        });

        expect(() => service.clear()).not.toThrow();
        expect(console.error).toHaveBeenCalledWith('Failed to clear clipboard:', expect.any(Error));
      });
    });

    describe('hasData', () => {
      it('should return true when clipboard has elements', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);

        expect(service.hasData()).toBe(true);
      });

      it('should return false when clipboard is empty', () => {
        expect(service.hasData()).toBe(false);
      });

      it('should return false after clearing clipboard', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);
        service.clear();

        expect(service.hasData()).toBe(false);
      });

      it('should return false when clipboard has empty elements array', () => {
        localStorageMock[CLIPBOARD_KEY] = JSON.stringify({
          elements: [],
          timestamp: Date.now(),
        });

        expect(service.hasData()).toBe(false);
      });

      it('should handle corrupted data', () => {
        localStorageMock[CLIPBOARD_KEY] = 'invalid json';

        expect(service.hasData()).toBe(false);
      });
    });

    describe('getData', () => {
      it('should return clipboard data', () => {
        const elements = [createMockRectangle('elem1'), createMockEllipse('elem2')];
        service.copy(elements);

        const data = service.getData();

        expect(data).not.toBeNull();
        expect(data?.elements).toEqual(elements);
        expect(data?.timestamp).toBeGreaterThan(0);
      });

      it('should return null when no data exists', () => {
        const data = service.getData();

        expect(data).toBeNull();
      });

      it('should handle corrupted JSON data', () => {
        localStorageMock[CLIPBOARD_KEY] = 'invalid json';

        const data = service.getData();

        expect(data).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Failed to read clipboard data:', expect.any(Error));
      });

      it('should handle localStorage access errors', () => {
        jest.spyOn(localStorage, 'getItem').mockImplementation(() => {
          throw new Error('Access denied');
        });

        const data = service.getData();

        expect(data).toBeNull();
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Duplication Operations', () => {
    describe('duplicateElements', () => {
      it('should duplicate elements with default offset', () => {
        const originalElements = [createMockRectangle('elem1', 100, 100)];

        const duplicated = service.duplicateElements(originalElements);

        expect(mockElementsService.addElements).toHaveBeenCalled();
        expect(duplicated).toHaveLength(1);
        expect(duplicated[0].x).toBe(120); // 100 + 20
        expect(duplicated[0].y).toBe(120); // 100 + 20
      });

      it('should duplicate elements with custom offset', () => {
        const originalElements = [createMockRectangle('elem1', 100, 100)];

        const duplicated = service.duplicateElements(originalElements, 50, 30);

        expect(duplicated[0].x).toBe(150); // 100 + 50
        expect(duplicated[0].y).toBe(130); // 100 + 30
      });

      it('should generate unique IDs for duplicated elements', () => {
        const originalElements = [createMockRectangle('elem1'), createMockEllipse('elem2')];

        const duplicated = service.duplicateElements(originalElements);

        expect(duplicated[0].id).not.toBe('elem1');
        expect(duplicated[1].id).not.toBe('elem2');
        expect(duplicated[0].id).toContain('_copy_');
        expect(duplicated[1].id).toContain('_copy_');
      });

      it('should return empty array for empty input', () => {
        const duplicated = service.duplicateElements([]);

        expect(duplicated).toEqual([]);
        expect(mockElementsService.addElements).not.toHaveBeenCalled();
      });

      it('should preserve all element properties', () => {
        const originalElement = createMockRectangle('elem1', 100, 100);
        originalElement.style.strokeColor = '#00FF00';
        originalElement.style.fill = '#FFFF00';

        const duplicated = service.duplicateElements([originalElement]);

        expect(duplicated[0].type).toBe(ElementType.Rectangle);
        expect(duplicated[0].style.strokeColor).toBe('#00FF00');
        expect(duplicated[0].style.fill).toBe('#FFFF00');
      });

      it('should handle negative offsets', () => {
        const originalElements = [createMockRectangle('elem1', 100, 100)];

        const duplicated = service.duplicateElements(originalElements, -10, -20);

        expect(duplicated[0].x).toBe(90);
        expect(duplicated[0].y).toBe(80);
      });
    });

    describe('createDuplicates', () => {
      it('should create duplicates without adding to data store', () => {
        const originalElements = [createMockRectangle('elem1', 100, 100)];

        const duplicates = service.createDuplicates(originalElements);

        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].x).toBe(120);
        expect(duplicates[0].y).toBe(120);
        expect(mockElementsService.addElements).not.toHaveBeenCalled();
      });

      it('should create duplicates with custom offset', () => {
        const originalElements = [createMockRectangle('elem1', 100, 100)];

        const duplicates = service.createDuplicates(originalElements, 30, 40);

        expect(duplicates[0].x).toBe(130);
        expect(duplicates[0].y).toBe(140);
      });

      it('should generate unique IDs', () => {
        const originalElements = [createMockRectangle('elem1')];

        const duplicates = service.createDuplicates(originalElements);

        expect(duplicates[0].id).not.toBe('elem1');
        expect(duplicates[0].id).toContain('_copy_');
      });

      it('should handle multiple elements', () => {
        const originalElements = [
          createMockRectangle('elem1', 100, 100),
          createMockEllipse('elem2', 200, 200),
          createMockLine('elem3', 300, 300),
        ];

        const duplicates = service.createDuplicates(originalElements, 10, 10);

        expect(duplicates).toHaveLength(3);
        expect(duplicates[0].x).toBe(110);
        expect(duplicates[1].x).toBe(210);
        expect(duplicates[2].x).toBe(310);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('getClipboardInfo', () => {
      it('should return element count and timestamp', () => {
        const elements = [createMockRectangle('elem1'), createMockEllipse('elem2')];
        service.copy(elements);

        const info = service.getClipboardInfo();

        expect(info).not.toBeNull();
        expect(info?.elementCount).toBe(2);
        expect(info?.timestamp).toBeGreaterThan(0);
      });

      it('should return null when clipboard is empty', () => {
        const info = service.getClipboardInfo();

        expect(info).toBeNull();
      });

      it('should update when clipboard data changes', () => {
        service.copy([createMockRectangle('elem1')]);
        const info1 = service.getClipboardInfo();

        service.copy([createMockEllipse('elem2'), createMockLine('elem3')]);
        const info2 = service.getClipboardInfo();

        expect(info1?.elementCount).toBe(1);
        expect(info2?.elementCount).toBe(2);
      });
    });

    describe('isDataFresh', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should return true for fresh data', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);

        expect(service.isDataFresh()).toBe(true);
      });

      it('should return false for stale data with default age', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);

        // Advance time by 6 minutes (default is 5 minutes)
        jest.advanceTimersByTime(6 * 60 * 1000);

        expect(service.isDataFresh()).toBe(false);
      });

      it('should respect custom max age', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);

        // Advance time by 2 minutes
        jest.advanceTimersByTime(2 * 60 * 1000);

        expect(service.isDataFresh(3 * 60 * 1000)).toBe(true); // 3 min max age
        expect(service.isDataFresh(1 * 60 * 1000)).toBe(false); // 1 min max age
      });

      it('should return false when no data exists', () => {
        expect(service.isDataFresh()).toBe(false);
      });

      it('should return true at exact boundary', () => {
        const elements = [createMockRectangle('elem1')];
        service.copy(elements);

        // Advance time by exactly 5 minutes
        jest.advanceTimersByTime(5 * 60 * 1000);

        expect(service.isDataFresh()).toBe(true);
      });
    });

    describe('getClipboardElementTypes', () => {
      it('should return unique element types', () => {
        const elements = [createMockRectangle('elem1'), createMockEllipse('elem2'), createMockRectangle('elem3')];
        service.copy(elements);

        const types = service.getClipboardElementTypes();

        expect(types).toHaveLength(2);
        expect(types).toContain(ElementType.Rectangle);
        expect(types).toContain(ElementType.Ellipse);
      });

      it('should return empty array when clipboard is empty', () => {
        const types = service.getClipboardElementTypes();

        expect(types).toEqual([]);
      });

      it('should handle single element type', () => {
        const elements = [createMockLine('elem1'), createMockLine('elem2')];
        service.copy(elements);

        const types = service.getClipboardElementTypes();

        expect(types).toEqual([ElementType.Line]);
      });

      it('should handle all element types', () => {
        const elements = [
          createMockRectangle('elem1'),
          createMockEllipse('elem2'),
          createMockLine('elem3'),
          createMockRectangle('elem4'), // Using Rectangle for Arrow
          createMockRectangle('elem5'), // Using Rectangle for Text
          createMockLine('elem6'), // Using Line for Pen
        ];
        service.copy(elements);

        const types = service.getClipboardElementTypes();

        // Should have at least Rectangle, Ellipse, and Line types
        expect(types.length).toBeGreaterThanOrEqual(2);
        expect(types).toContain(ElementType.Rectangle);
        expect(types).toContain(ElementType.Ellipse);
        expect(types).toContain(ElementType.Line);
      });
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle copy-paste workflow', () => {
      const elements = [createMockRectangle('elem1', 50, 50)];

      service.copy(elements);
      expect(service.hasData()).toBe(true);

      const pasted = service.paste();
      expect(pasted).toHaveLength(1);
      expect(pasted[0].x).toBe(70); // 50 + 20
      expect(pasted[0].y).toBe(70);
    });

    it('should handle cut-paste workflow', () => {
      const elements = [createMockEllipse('elem1', 100, 100)];

      service.cut(elements);
      expect(service.hasData()).toBe(true);

      const pasted = service.paste();
      expect(pasted).toHaveLength(1);
      expect(mockElementsService.addElements).toHaveBeenCalled();
    });

    it('should handle multiple paste operations', () => {
      const elements = [createMockRectangle('elem1')];
      service.copy(elements);

      const pasted1 = service.paste();
      const pasted2 = service.paste();

      expect(pasted1).toHaveLength(1);
      expect(pasted2).toHaveLength(1);
      expect(mockElementsService.addElements).toHaveBeenCalledTimes(2);
    });

    it('should handle complex element with all properties', () => {
      const complexElement: RectangleElement = {
        id: 'complex1',
        type: ElementType.Rectangle,
        x: 100,
        y: 200,
        width: 150,
        height: 80,
        rx: 10,
        rotation: 0,
        opacity: 80,
        zIndex: 1,
        selectAfterDraw: true,
        style: {
          strokeColor: '#FF0000',
          strokeWidth: 3,
          fill: '#00FF00',
          dasharray: '5,5',
          dashoffset: 0,
          lineCap: LineCap.Round,
          lineJoin: LineJoin.Round,
        },
      };

      service.copy([complexElement]);
      const pasted = service.paste();

      expect(pasted[0].type).toBe(ElementType.Rectangle);
      expect(pasted[0].x).toBe(120);
      expect(pasted[0].y).toBe(220);
      const pastedRect = pasted[0] as RectangleElement;
      expect(pastedRect.style).toEqual(complexElement.style);
      expect(pastedRect.width).toBe(complexElement.width);
      expect(pastedRect.height).toBe(complexElement.height);
    });

    it('should maintain clipboard data across service methods', () => {
      const elements = [createMockLine('elem1')];

      service.copy(elements);
      expect(service.hasData()).toBe(true);

      const info = service.getClipboardInfo();
      expect(info?.elementCount).toBe(1);

      const types = service.getClipboardElementTypes();
      expect(types).toContain(ElementType.Line);

      const data = service.getData();
      expect(data?.elements).toEqual(elements);
    });

    it('should handle zero offsets in duplication', () => {
      const elements = [createMockRectangle('elem1', 100, 100)];

      const duplicated = service.duplicateElements(elements, 0, 0);

      expect(duplicated[0].x).toBe(100);
      expect(duplicated[0].y).toBe(100);
      expect(duplicated[0].id).not.toBe('elem1');
    });

    it('should ensure unique IDs across multiple duplication operations', () => {
      const elements = [createMockRectangle('elem1')];

      const dup1 = service.createDuplicates(elements);
      const dup2 = service.createDuplicates(elements);
      const dup3 = service.createDuplicates(elements);

      expect(dup1[0].id).not.toBe(dup2[0].id);
      expect(dup1[0].id).not.toBe(dup3[0].id);
      expect(dup2[0].id).not.toBe(dup3[0].id);
    });
  });
});
