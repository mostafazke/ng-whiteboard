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
  describe('snapToAngle', () => {
    test('should return snaped angle', () => {
      // Arrange
      const x1 = 0;
      const y1 = 0;
      const x2 = 1;
      const y2 = 0;
      const expected = {
        x: 1,
        y: 0,
        a: 0,
      };

      // Act
      const result = Utils.snapToAngle(x1, y1, x2, y2);

      // Assert
      expect(result).toEqual(expected);
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
    it('should convert an SVG string to a png base64 image', async () => {
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
  });

  describe('getSvgPathFromStroke', () => {
    it('should return an empty string if less than 4 points are provided', () => {
      // Arrange
      const points = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      // Act
      const result = Utils.getSvgPathFromStroke(points);
      // Assert
      expect(result).toBe('');
    });
    it('should return the correct SVG path string for open stroke', () => {
      // Arrange
      const points = [
        [0, 0],
        [2, 2],
        [4, 4],
        [6, 6],
      ];
      // Act
      const result = Utils.getSvgPathFromStroke(points, false);
      // Assert
      expect(result).toBe('M0.00,0.00 Q2.00,2.00 3.00,3.00 T5.00,5.00 ');
    });

    it('should return the correct SVG path string for closed stroke', () => {
      // Arrange
      const points = [
        [0, 0],
        [2, 2],
        [4, 4],
        [6, 6],
      ];
      // Act
      const result = Utils.getSvgPathFromStroke(points, true);
      // Assert
      expect(result).toBe('M0.00,0.00 Q2.00,2.00 3.00,3.00 T5.00,5.00 Z');
    });
  });
});
