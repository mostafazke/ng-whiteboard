import { ElementByType, ElementType, ElementUtil, WhiteboardElement } from '../types';
import { ArrowElementUtil } from './arrow-element';
import { EllipseElementUtil } from './ellipse-element';
import { ImageElementUtil } from './image-element';
import { LineElementUtil } from './line-element';
import { PenElementUtil } from './pen-element';
import { RectangleElementUtil } from './rectangle-element';
import { TextElementUtil } from './text-element';

const elementUtilsMap: Record<ElementType, ElementUtil<WhiteboardElement>> = {
  [ElementType.Arrow]: new ArrowElementUtil(),
  [ElementType.Ellipse]: new EllipseElementUtil(),
  [ElementType.Image]: new ImageElementUtil(),
  [ElementType.Line]: new LineElementUtil(),
  [ElementType.Pen]: new PenElementUtil(),
  [ElementType.Rectangle]: new RectangleElementUtil(),
  [ElementType.Text]: new TextElementUtil(),
} as const;

export function getElementUtil(type: ElementType) {
  return elementUtilsMap[type];
}

// Global active layer provider (set by EditorStateService)
let getActiveLayerId: (() => string) | null = null;

export function setActiveLayerProvider(provider: () => string) {
  getActiveLayerId = provider;
}

export function createElement<T extends ElementType>(
  type: T,
  props: Partial<ElementByType<T>>,
  layerId?: string
): ElementByType<T> {
  const targetLayerId = layerId || (getActiveLayerId ? getActiveLayerId() : '');
  const elementProps = { ...props, layerId: targetLayerId } as Partial<ElementByType<T>>;
  return elementUtilsMap[type].create(elementProps) as ElementByType<T>;
}

export interface LineEndpointInput {
  x: number;
  y: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Compute world-space endpoints for an arrow or line element.
 *
 * The element `<g>` uses the SVG transform `translate(x,y) rotate(rotation)` together
 * with CSS `transform-box: fill-box; transform-origin: center`. In modern browsers this
 * makes the rotation pivot the fill-box center (midpoint of the local geometry) rather
 * than the local origin (0,0). We replicate that here:
 *
 *   world = translate(x,y) * rotate_around_fill_center(rotation) * scale(scaleX,scaleY)
 *
 * Fill-box center in local space: cx = (x1+x2)/2, cy = (y1+y2)/2.
 */
export function getLineWorldEndpoints(el: LineEndpointInput): { sx: number; sy: number; ex: number; ey: number } {
  const scaleX = el.scaleX ?? 1;
  const scaleY = el.scaleY ?? 1;

  const lx1 = el.x1 * scaleX;
  const ly1 = el.y1 * scaleY;
  const lx2 = el.x2 * scaleX;
  const ly2 = el.y2 * scaleY;

  const rot = ((el.rotation ?? 0) * Math.PI) / 180;
  if (rot === 0) {
    return { sx: el.x + lx1, sy: el.y + ly1, ex: el.x + lx2, ey: el.y + ly2 };
  }

  const pivotX = (lx1 + lx2) / 2;
  const pivotY = (ly1 + ly2) / 2;

  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const rx1 = lx1 - pivotX;
  const ry1 = ly1 - pivotY;
  const rx2 = lx2 - pivotX;
  const ry2 = ly2 - pivotY;

  return {
    sx: el.x + pivotX + rx1 * cos - ry1 * sin,
    sy: el.y + pivotY + rx1 * sin + ry1 * cos,
    ex: el.x + pivotX + rx2 * cos - ry2 * sin,
    ey: el.y + pivotY + rx2 * sin + ry2 * cos,
  };
}
