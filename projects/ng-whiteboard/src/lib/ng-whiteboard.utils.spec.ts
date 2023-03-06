import Utils from './ng-whiteboard.utils';

describe('ng-whiteboard utils class', () => {
  describe('toSvgString', () => {
    it('should return valid svg element as string', () => {
      const namespaceURI = 'http://www.w3.org/2000/svg';
      const svgNode = document.createElementNS(namespaceURI, 'svg');
      svgNode.setAttribute('fill', '#333');
      const svgString = Utils.toSvgString(svgNode);

      expect(typeof svgString).toBe('string');
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('fill="#333"');
      expect(svgString).toContain(namespaceURI);
    });
  });
  describe('snapToGrid', () => {
    const gridSize = 40;
    it('should return snaped number', () => {
      const n = 30;
      // const n = Math.floor(Math.random() * gridSize) + 1;

      const snapedNum = Utils.snapToGrid(n, gridSize);
      expect(typeof snapedNum).toBe('number');
      expect(snapedNum).toBe(gridSize);
      // expect(snapedNum).toBe(n > gridSize / 2 ? gridSize : 0);
    });
    it('should return zero if number less than half of the gridSize', () => {
      const n = gridSize / 2 - 1;
      const snapedNum = Utils.snapToGrid(n, gridSize);
      expect(snapedNum).toBe(0);
    });
  });

  describe('downloadFile', () => {
    it('should trigger download file', () => {
      // Arrange
      const link = document.createElement('a');
      link.click = jest.fn();
      jest.spyOn(document, 'createElement').mockImplementation(() => link);

      // Act
      const fileLink = 'https://mostafazke.github.io/ng-whiteboard/new-svg';
      const fileName = 'new-svg.png';
      Utils.downloadFile(fileLink, fileName);

      // Assert
      expect(link.download).toBe(fileName);
      expect(link.href).toBe(fileLink);
      expect(link.click).toHaveBeenCalledTimes(1);
    });
    it('should have the dafault name if not provided', () => {
      // Arrange
      const link = document.createElement('a');
      link.click = jest.fn();
      jest.spyOn(document, 'createElement').mockImplementation(() => link);

      // Act
      const fileLink = 'https://mostafazke.github.io/ng-whiteboard/new-svg';
      Utils.downloadFile(fileLink);

      // Assert
      expect(link.download).toBe('new white-board');
    });
  });

  describe('svgString2Image', () => {
    it('should convert an SVG string to a base64 image', async () => {
      // Arrange
      const canvas = document.createElement('canvas');
      canvas.getContext = jest.fn().mockReturnValue({
        clearRect: jest.fn(),
        drawImage: jest.fn(),
      });
      jest.spyOn(document, 'createElement').mockImplementation(() => canvas);
      const svgString = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>';
      const width = 100;
      const height = 100;
      // Act
      Utils.svgToBase64(svgString, width, height).then((base64) => {
        //assert
        expect(base64).toContain('data:image/png;base64');
      });
    });

    it('should reject the promise if the SVG string is invalid', async () => {
      const svgString =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="red"</svg>';
      const width = 100;
      const height = 100;
      Utils.svgToBase64(svgString, width, height).catch((error) => {
        //assert
        expect(error).toBeDefined();
      });
    });

    it('should reject the promise if the image fails to load', async () => {
      const svgString =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="red"/></svg>';
      const width = 100;
      const height = 100;
      jest.spyOn(Image.prototype, 'onload', 'get').mockImplementation(() => undefined);
      jest.spyOn(Image.prototype, 'onerror', 'get').mockImplementation(() => new Error('Failed to load image'));
      Utils.svgToBase64(svgString, width, height).catch((error) => {
        //assert
        expect(error).toBe('Failed to load image');
      });
    });
  });
});
