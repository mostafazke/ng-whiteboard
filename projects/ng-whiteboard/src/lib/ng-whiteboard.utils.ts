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

  static getSvgPathFromStroke(points: number[][], closed = true): string {
    const len = points.length;

    if (len < 4) {
      return ``;
    }

    let a = points[0];
    let b = points[1];
    const c = points[2];

    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${(
      (b[0] + c[0]) /
      2
    ).toFixed(2)},${((b[1] + c[1]) / 2).toFixed(2)} T`;

    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i];
      b = points[i + 1];
      result += `${((a[0] + b[0]) / 2).toFixed(2)},${((a[1] + b[1]) / 2).toFixed(2)} `;
    }

    if (closed) {
      result += 'Z';
    }

    return result;
  }
}
