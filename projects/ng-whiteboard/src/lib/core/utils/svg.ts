import { FormatType } from '../types';
import getStroke, { StrokeOptions } from 'perfect-freehand';

// Default stroke options for drawing paths
export const defaultStrokeOptions: StrokeOptions = {
  size: 1,
  smoothing: 1,
  thinning: 0,
  streamline: 1,
};

/**
 * Converts an SVG node to a string representation.
 * @param svgNode - The SVG node to convert.
 * @returns The string representation of the SVG node.
 */
export function toSvgString(svgNode: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href');
  return svgString;
}

/**
 * Converts an SVG string to a Base64 encoded image.
 * @param svgString - The SVG string to convert.
 * @param width - The width of the resulting image.
 * @param height - The height of the resulting image.
 * @param format - The format of the resulting image (default is PNG).
 * @returns A promise that resolves to the Base64 encoded image string.
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

/**
 * Calculates the bounding box of a set of points.
 * @param points - An array of points where each point is an array of two numbers [x, y].
 * @returns An object containing the x, y, width, and height of the bounding box.
 */
export function calculateBoundingBox(points: number[][]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((point) => {
    if (point[0] < minX) minX = point[0];
    if (point[1] < minY) minY = point[1];
    if (point[0] > maxX) maxX = point[0];
    if (point[1] > maxY) maxY = point[1];
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculates the SVG path data for a given set of points using stroke options.
 * @param points - An array of points where each point is an array of two numbers [x, y].
 * @param strokeOptions - Options for the stroke (default is defaultStrokeOptions).
 * @returns The SVG path data as a string.
 */
export function calculatePath(points: number[][], size = 1): string {
  const outlinePoints = getStroke(points, { ...defaultStrokeOptions, size });
  const pathData = getSvgPathFromStroke(outlinePoints);

  return pathData;
}

/**
 * Generates SVG path data from a set of stroke points.
 * @param points - An array of points where each point is an array of two numbers [x, y].
 * @param closed - Whether the path should be closed (default is true).
 * @returns The SVG path data as a string.
 */
export function getSvgPathFromStroke(points: number[][], closed = true): string {
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
