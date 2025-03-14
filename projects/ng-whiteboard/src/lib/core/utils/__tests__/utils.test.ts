import { generateId, snapToGrid, snapToAngle, downloadFile, debounce } from '../utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('snapToGrid', () => {
    it('should snap numbers to grid', () => {
      expect(snapToGrid(14, 10)).toBe(10);
      expect(snapToGrid(16, 10)).toBe(20);
      expect(snapToGrid(25, 5)).toBe(25);
    });

    it('should handle zero values', () => {
      expect(snapToGrid(0, 10)).toBe(0);
      expect(snapToGrid(0, 5)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(snapToGrid(-14, 10)).toBe(-10);
      expect(snapToGrid(-16, 10)).toBe(-20);
    });
  });

  describe('snapToAngle', () => {
    it('should snap to 45 degree angles', () => {
      const result = snapToAngle(0, 0, 10, 10);
      expect(result.a).toBeCloseTo(Math.PI / 4);
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(10);
    });

    it('should maintain distance while snapping', () => {
      const result = snapToAngle(0, 0, 5, 8);
      const distance = Math.sqrt(result.x * result.x + result.y * result.y);
      const originalDistance = Math.sqrt(5 * 5 + 8 * 8);
      expect(distance).toBeCloseTo(originalDistance);
    });
  });

  describe('downloadFile', () => {
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
      jest.spyOn(mockLink, 'click').mockImplementation();
    });

    it('should create and trigger download link', () => {
      const testUrl = 'test-url';
      const testName = 'test-name';
      downloadFile(testUrl, testName);

      expect(mockLink.href).toContain(testUrl);
      expect(mockLink.download).toBe(testName);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should use default name when name is not provided', () => {
      downloadFile('test-url');
      expect(mockLink.download).toBe('new white-board');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous timer on multiple calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(99);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test', 123);
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });
  });
});
