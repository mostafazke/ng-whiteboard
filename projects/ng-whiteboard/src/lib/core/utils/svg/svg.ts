import { FormatType } from '../../types';

/**
 * Converts an SVG node to a string representation.
 */
export function toSvgString(svgNode: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);

  if (!svgString.includes('xmlns:xlink=')) {
    svgString = svgString.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  svgString = svgString.replace(/(?:NS\d+|ns\d+|xmlns):href/g, 'xlink:href');
  return svgString;
}

/**
 * Converts an SVG string to a Base64 encoded image.
 */
export function svgToBase64(
  svgString: string,
  width: number,
  height: number,
  format = FormatType.Png
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const img = new Image();
    
    const encodedSvg = encodeURIComponent(svgString);
    img.src = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

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
