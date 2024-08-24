import { FormatType, formatTypes } from './models';

export default class Utils {
  static toSvgString(svgNode: SVGSVGElement): string {
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href');
    return svgString;
  }

  static snapToGrid(n: number, gridSize: number): number {
    const snap = gridSize;
    const n1 = Math.round(n / snap) * snap;
    return n1;
  }

  static snapToAngle(x1: number, y1: number, x2: number, y2: number) {
    const snap = Math.PI / 4; // 45 degrees
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const snapangle = Math.round(angle / snap) * snap;
    const x = x1 + dist * Math.cos(snapangle);
    const y = y1 + dist * Math.sin(snapangle);
    return { x: x, y: y, a: snapangle };
  }

  static downloadFile(url: string, name?: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('visibility', 'hidden');
    link.download = name || 'new white-board';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static svgToBase64(
    svgString: string,
    width: number,
    height: number,
    format: formatTypes = FormatType.Png
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      const img = new Image();
      img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL(`image/${format}`);
        resolve(base64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    });
  }

  static getSvgPathFromStroke(points: number[][], closed = false): string {
    const len = points.length;

    if (len < 2) {
      return '';
    }

    let a = points[0];
    let b = points[1];

    if (len === 2) {
      return `M${precise(a)}L${precise(b)}`;
    }

    let result = '';

    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i];
      b = points[i + 1];
      result += average(a, b);
    }

    if (closed) {
      // If closed, draw a curve from the last point to the first
      return `M${average(points[0], points[1])}Q${precise(points[1])}${average(
        points[1],
        points[2]
      )}T${result}${average(points[len - 1], points[0])}${average(points[0], points[1])}Z`;
    } else {
      return `M${precise(points[0])}Q${precise(points[1])}${average(points[1], points[2])}${
        points.length > 3 ? 'T' : ''
      }${result}L${precise(points[len - 1])}`;
    }
  }
}

function precise(A: number[]) {
  return `${A[0].toFixed(4)},${A[1].toFixed(4)} `;
}

function average(A: number[], B: number[]) {
  return `${((A[0] + B[0]) / 2).toFixed(4)},${((A[1] + B[1]) / 2).toFixed(4)} `;
}
