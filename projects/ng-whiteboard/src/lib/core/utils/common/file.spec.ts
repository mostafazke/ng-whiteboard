import { downloadFile, debounce } from './file';

describe('File Utils', () => {
  describe('downloadFile', () => {
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
      jest.spyOn(mockLink, 'click').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create and click download link', () => {
      const url = 'test.png';
      downloadFile(url);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toContain(url);
      expect(mockLink.download).toBe('new white-board');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should use custom filename if provided', () => {
      const url = 'test.png';
      const filename = 'custom.png';
      downloadFile(url, filename);

      expect(mockLink.download).toBe(filename);
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

      jest.advanceTimersByTime(99);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous timer on subsequent calls', () => {
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
