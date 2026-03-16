import { computed, inject, Injectable } from '@angular/core';
import { ApiService } from '../api';
import { ElementType } from '../types';
import { ArrowElement } from './arrow-element';
import { LineElement } from './line-element';
import { getLineWorldEndpoints } from './element.utils';
import { SelectionService } from './selection.service';

export interface EndpointHandle {
  elementId: string;
  end: 'start' | 'end';
  x: number;
  y: number;
  bound: boolean;
  elementType: ElementType;
}

export interface CurveHandle {
  elementId: string;
  x: number;
  y: number;
  isCurved: boolean;
}

@Injectable()
export class HandleService {
  private readonly selectionService = inject(SelectionService);
  private readonly apiService = inject(ApiService);

  /** True when only line-type elements (Arrow, Line) are selected */
  readonly isLineOnlySelection = this.selectionService.isLineOnlySelectionSignal;

  /**
   * Endpoint handles for all selected line-type elements (Arrow / Line).
   * Each entry describes one endpoint in world coordinates.
   */
  readonly lineEndpointHandles = computed<EndpointHandle[]>(() => {
    const ids = this.selectionService.selectedIdsSignal();
    if (ids.length === 0) return [];

    const elements = this.apiService.allElements();
    const handles: EndpointHandle[] = [];

    for (const id of ids) {
      const el = elements.find((e) => e.id === id);
      if (!el) continue;

      if (el.type === ElementType.Arrow) {
        const arrow = el as ArrowElement;
        const { sx, sy, ex, ey } = getLineWorldEndpoints(arrow);
        handles.push({
          elementId: arrow.id,
          end: 'start',
          x: sx,
          y: sy,
          bound: !!arrow.startBinding,
          elementType: ElementType.Arrow,
        });
        handles.push({
          elementId: arrow.id,
          end: 'end',
          x: ex,
          y: ey,
          bound: !!arrow.endBinding,
          elementType: ElementType.Arrow,
        });
      } else if (el.type === ElementType.Line) {
        const line = el as LineElement;
        const { sx, sy, ex, ey } = getLineWorldEndpoints(line);
        handles.push({ elementId: line.id, end: 'start', x: sx, y: sy, bound: false, elementType: ElementType.Line });
        handles.push({ elementId: line.id, end: 'end', x: ex, y: ey, bound: false, elementType: ElementType.Line });
      }
    }

    return handles;
  });

  /**
   * Middle curve handle for selected arrows.
   * Provides a draggable control point for adjusting the curve.
   */
  readonly curveHandles = computed<CurveHandle[]>(() => {
    const ids = this.selectionService.selectedIdsSignal();
    if (ids.length === 0) return [];

    const elements = this.apiService.allElements();
    const handles: CurveHandle[] = [];

    for (const id of ids) {
      const el = elements.find((e) => e.id === id);
      if (!el || el.type !== ElementType.Arrow) continue;

      const arrow = el as ArrowElement;
      const { sx, sy, ex, ey } = getLineWorldEndpoints(arrow);
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;

      if (arrow.pathType?.type === 'quadratic') {
        const rot = ((arrow.rotation ?? 0) * Math.PI) / 180;
        const scaleX = arrow.scaleX ?? 1;
        const scaleY = arrow.scaleY ?? 1;
        let cx = arrow.pathType.cx * scaleX;
        let cy = arrow.pathType.cy * scaleY;
        if (rot !== 0) {
          const pivotX = (arrow.x1 * scaleX + arrow.x2 * scaleX) / 2;
          const pivotY = (arrow.y1 * scaleY + arrow.y2 * scaleY) / 2;
          const dx = cx - pivotX;
          const dy = cy - pivotY;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          cx = pivotX + dx * cos - dy * sin;
          cy = pivotY + dx * sin + dy * cos;
        }
        handles.push({
          elementId: arrow.id,
          x: arrow.x + cx,
          y: arrow.y + cy,
          isCurved: true,
        });
      } else if (arrow.pathType?.type === 'elbow') {
        const scaleX = arrow.scaleX ?? 1;
        const scaleY = arrow.scaleY ?? 1;
        const midRatio = arrow.pathType.midRatio ?? 0.5;
        const localX = arrow.x1 * scaleX + (arrow.x2 - arrow.x1) * scaleX * midRatio;
        const localY = (arrow.y1 * scaleY + arrow.y2 * scaleY) / 2;
        const rot = ((arrow.rotation ?? 0) * Math.PI) / 180;
        let bendX: number, bendY: number;
        if (rot === 0) {
          bendX = arrow.x + localX;
          bendY = arrow.y + localY;
        } else {
          const pivotX = (arrow.x1 * scaleX + arrow.x2 * scaleX) / 2;
          const pivotY = (arrow.y1 * scaleY + arrow.y2 * scaleY) / 2;
          const dx = localX - pivotX;
          const dy = localY - pivotY;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          bendX = arrow.x + pivotX + dx * cos - dy * sin;
          bendY = arrow.y + pivotY + dx * sin + dy * cos;
        }
        handles.push({
          elementId: arrow.id,
          x: bendX,
          y: bendY,
          isCurved: true,
        });
      } else {
        handles.push({
          elementId: arrow.id,
          x: midX,
          y: midY,
          isCurved: false,
        });
      }
    }

    return handles;
  });
}
