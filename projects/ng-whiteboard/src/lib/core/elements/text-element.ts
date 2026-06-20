import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultTextElementStyle } from '../types';
import { generateId } from '../utils/common';
import { hitTestBoundingBox } from '../utils/drawing';

interface TextNaturalDimensions {
  naturalWidth: number;
  naturalHeight: number;
  bboxX: number;
  bboxY: number;
}

/**
 * Measures the natural (pre-scale) dimensions of a text element by creating a
 * temporary SVG in the document. Returns null if measurement fails or in SSR.
 */
function measureTextNatural(element: TextElement): TextNaturalDimensions | null {
  try {
    if (typeof document === 'undefined') return null;
    const svgNS = 'http://www.w3.org/2000/svg';
    const fontSize = element.style.fontSize ?? 16;
    const fontFamily = element.style.fontFamily ?? 'Arial';
    const fontStyle = element.style.fontStyle ?? 'normal';
    const fontWeight = String(element.style.fontWeight ?? 'normal');
    const lineHeight = fontSize * 1.2;
    const lines = (element.text ?? '').split('\n');

    const tempSvg = document.createElementNS(svgNS, 'svg') as SVGSVGElement;
    tempSvg.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;';
    document.body.appendChild(tempSvg);

    const tempText = document.createElementNS(svgNS, 'text') as SVGTextElement;
    tempText.setAttribute('text-anchor', 'start');
    tempText.setAttribute('alignment-baseline', 'before-edge');
    tempText.setAttribute('font-size', String(fontSize));
    tempText.setAttribute('font-family', fontFamily);
    tempText.setAttribute('font-style', fontStyle);
    tempText.setAttribute('font-weight', fontWeight);

    lines.forEach((line: string, i: number) => {
      const tspan = document.createElementNS(svgNS, 'tspan') as SVGTSpanElement;
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', i === 0 ? '0' : String(lineHeight));
      tspan.textContent = line.length > 0 ? line : '\u200B';
      tempText.appendChild(tspan);
    });

    tempSvg.appendChild(tempText);
    const bbox = tempText.getBBox();
    document.body.removeChild(tempSvg);

    if (bbox.width === 0 && bbox.height === 0) return null;

    return { naturalWidth: bbox.width, naturalHeight: bbox.height, bboxX: bbox.x, bboxY: bbox.y };
  } catch {
    return null;
  }
}

/**
 * Natural (pre-scale) geometry of a text element, in the element's local coordinate
 * space. `(ox, oy)` is the center of the text's fill-box — the pivot that the renderer
 * scales and rotates around (CSS `transform-box: fill-box; transform-origin: center`).
 */
interface TextNaturalMetrics {
  width: number;
  height: number;
  /** fill-box center, local space (unscaled) */
  ox: number;
  oy: number;
}

/**
 * Resolves the natural (unscaled) text metrics, preferring real font measurement and
 * falling back to font-size estimates when measurement is unavailable (e.g. SSR/tests).
 * getBounds and resize share this so the displayed box and the resize math always agree.
 */
function getNaturalMetrics(element: TextElement): TextNaturalMetrics {
  const fontSize = element.style.fontSize ?? defaultTextElementStyle.fontSize ?? 16;
  const measured = measureTextNatural(element);

  if (measured) {
    return {
      width: measured.naturalWidth,
      height: measured.naturalHeight,
      ox: measured.bboxX + measured.naturalWidth / 2,
      oy: measured.bboxY + measured.naturalHeight / 2,
    };
  }

  const lines = (element.text ?? '').split('\n');
  const maxChars = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = fontSize * 0.6 * maxChars || fontSize;
  const height = fontSize * 1.2 * lines.length || fontSize * 1.2;
  // SVG text origin is at the first baseline; the visual top sits ~0.8*fontSize above it.
  const bboxY = -(fontSize * 0.8);
  return { width, height, ox: width / 2, oy: bboxY + height / 2 };
}

export interface TextElement extends BaseElement {
  type: ElementType.Text;
  text: string;
  selection?: { start: number; end: number };
  scaleX: number;
  scaleY: number;
}
export class TextElementUtil implements ElementUtil<TextElement> {
  create(props: Partial<TextElement>): TextElement {
    return {
      type: ElementType.Text,
      id: generateId(),
      x: 0,
      y: 0,
      text: '',
      rotation: 0,
      opacity: 100,
      zIndex: 1, // Default zIndex, will be overridden by tools
      selectAfterDraw: true, // Text should be selected after drawing by default
      scaleX: 1,
      scaleY: 1,
      ...props,
      style: {
        ...defaultTextElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: TextElement, direction: Direction, dx: number, dy: number): TextElement {
    const MIN_SCALE = 0.1;
    const { width, height } = getNaturalMetrics(element);

    // Scale pivots around the fill-box center, so dragging an edge by `d` (in local
    // space) changes the scale by `d / naturalSize` and shifts the origin so the opposite
    // edge stays anchored. When unclamped that shift is exactly d/2; when the scale is
    // clamped it is derived from the actual scale change instead.
    if (direction.includes(Direction.E) || direction.includes(Direction.W)) {
      const sign = direction.includes(Direction.E) ? 1 : -1;
      const raw = element.scaleX + (sign * dx) / width;
      const newScaleX = Math.max(MIN_SCALE, raw);
      element.x += newScaleX === raw ? dx / 2 : (sign * (newScaleX - element.scaleX) * width) / 2;
      element.scaleX = newScaleX;
    }

    if (direction.includes(Direction.S) || direction.includes(Direction.N)) {
      const sign = direction.includes(Direction.S) ? 1 : -1;
      const raw = element.scaleY + (sign * dy) / height;
      const newScaleY = Math.max(MIN_SCALE, raw);
      element.y += newScaleY === raw ? dy / 2 : (sign * (newScaleY - element.scaleY) * height) / 2;
      element.scaleY = newScaleY;
    }

    return element;
  }

  getBounds(element: TextElement): Bounds {
    const { x, y, scaleX, scaleY } = element;
    const { width: naturalWidth, height: naturalHeight, ox, oy } = getNaturalMetrics(element);

    // Scale is applied around the fill-box center (ox, oy), matching the SVG render.
    const width = naturalWidth * scaleX;
    const height = naturalHeight * scaleY;
    const minX = x + ox - width / 2;
    const minY = y + oy - height / 2;

    return {
      minX,
      minY,
      maxX: minX + width,
      maxY: minY + height,
      width,
      height,
    };
  }

  hitTest(element: TextElement, pointA: Point, pointB: Point, threshold: number): boolean {
    const bounds = this.getBounds(element);
    return hitTestBoundingBox(bounds, pointA, pointB, threshold);
  }
}
