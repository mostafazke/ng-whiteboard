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

  static downloadFile(url: string, name?: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('visibility', 'hidden');
    link.download = name || 'new white-board';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async svgToBase64(
    svgString: string,
    width: number,
    height: number,
    format: formatTypes = FormatType.Png
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;

    await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL(`image/${format}`);
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => {
        reject(err);
      };
    });

    return canvas.toDataURL(`image/${format}`);
  }
}
