import { computed, inject, Injectable, OnDestroy, Signal } from '@angular/core';
import { ArrowElement } from './arrow-element';
import { ConnectionPointsService } from './connection-points.service';
import { ElementsService } from './elements.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { ArrowBinding, ElementType, Point, WhiteboardElement, WhiteboardEvent } from '../types';
import { Subscription } from 'rxjs';

/**
 * Manages the relationships between arrows and the shapes they are bound to.
 *
 * Responsibilities:
 * - Resolve binding endpoints to world coordinates
 * - Update arrow endpoints when bound shapes move or resize
 * - Attach / detach arrow endpoints to/from shapes
 * - Provide reverse-lookup: which arrows are bound to a given shape
 * - Auto-detach bindings when shapes are removed
 */
@Injectable({ providedIn: 'root' })
export class ArrowBindingService implements OnDestroy {
  private connectionPoints = inject(ConnectionPointsService);
  private elementsService = inject(ElementsService);
  private eventBus = inject(EventBusService);
  private subscription: Subscription;

  constructor() {
    // Listen for element removals to auto-detach bindings
    this.subscription = this.eventBus.on(WhiteboardEvent.ElementsRemoved).subscribe((removedElements) => {
      if (!removedElements || !Array.isArray(removedElements) || removedElements.length === 0) return;
      const updates: Array<Partial<ArrowElement> & { id: string }> = [];

      for (const removedEl of removedElements as WhiteboardElement[]) {
        updates.push(...this.detachAllFromElement(removedEl.id));
      }

      if (updates.length > 0) {
        this.elementsService.updateElements(updates as Array<Partial<WhiteboardElement> & { id: string }>);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // ────────────────── Reverse index ──────────────────

  /**
   * Returns all arrow elements that are currently bound to the given element id
   * (at either their start or end).
   */
  getArrowsBoundTo(elementId: string): ArrowElement[] {
    return this.elementsService
      .getElements()
      .filter(
        (el): el is ArrowElement =>
          el.type === ElementType.Arrow &&
          (el.startBinding?.elementId === elementId || el.endBinding?.elementId === elementId)
      );
  }

  /**
   * Computed signal of all arrow elements in the workspace.
   */
  readonly arrows: Signal<ArrowElement[]> = computed(() =>
    this.elementsService.elements().filter((el): el is ArrowElement => el.type === ElementType.Arrow)
  );

  // ────────────────── Binding resolution ──────────────────

  /**
   * Resolve the world-coordinate for one end of an arrow based on its binding.
   *
   * @param binding      - the ArrowBinding at this end (may be null → free point)
   * @param freePoint    - the free (x,y) endpoint if binding is null
   * @param otherEnd     - the other endpoint (for computing direction when using closest-edge)
   */
  resolveEndpoint(binding: ArrowBinding | null, freePoint: Point, otherEnd: Point): Point {
    if (!binding) return freePoint;

    const target = this.elementsService.getElementById(binding.elementId);
    if (!target) return freePoint; // target was deleted

    return this.connectionPoints.resolveBindingPoint(target, binding.pointId, otherEnd, binding.gap);
  }

  // ────────────────── Attach / Detach ──────────────────

  /**
   * Create a binding object for a snap result.
   */
  createBinding(elementId: string, pointId: string | null, gap = 0): ArrowBinding {
    return { elementId, pointId, focus: 0.5, gap };
  }

  /**
   * Attach one end of an arrow to a specific shape.
   * Returns a new partial ArrowElement with updated binding + endpoint.
   */
  attachStart(arrow: ArrowElement, elementId: string, pointId: string | null, gap = 0): Partial<ArrowElement> {
    const binding = this.createBinding(elementId, pointId, gap);
    const otherEnd = { x: arrow.x2 + arrow.x, y: arrow.y2 + arrow.y };
    const point = this.resolveEndpoint(binding, { x: arrow.x1 + arrow.x, y: arrow.y1 + arrow.y }, otherEnd);
    return {
      id: arrow.id,
      startBinding: binding,
      x1: point.x - arrow.x,
      y1: point.y - arrow.y,
    } as Partial<ArrowElement>;
  }

  attachEnd(arrow: ArrowElement, elementId: string, pointId: string | null, gap = 0): Partial<ArrowElement> {
    const binding = this.createBinding(elementId, pointId, gap);
    const otherEnd = { x: arrow.x1 + arrow.x, y: arrow.y1 + arrow.y };
    const point = this.resolveEndpoint(binding, { x: arrow.x2 + arrow.x, y: arrow.y2 + arrow.y }, otherEnd);
    return {
      id: arrow.id,
      endBinding: binding,
      x2: point.x - arrow.x,
      y2: point.y - arrow.y,
    } as Partial<ArrowElement>;
  }

  detachStart(arrow: ArrowElement): Partial<ArrowElement> {
    return { id: arrow.id, startBinding: null } as Partial<ArrowElement>;
  }

  detachEnd(arrow: ArrowElement): Partial<ArrowElement> {
    return { id: arrow.id, endBinding: null } as Partial<ArrowElement>;
  }

  // ────────────────── Bulk updates (shape moved/resized) ──────────────────

  /**
   * Called after one or more shapes have been moved/resized.
   * Recomputes all arrow endpoints that are bound to any of the moved shapes.
   *
   * @param movedIds - set of element IDs that were modified
   * @returns array of arrow updates to apply via `elementsService.updateElements()`
   */
  recomputeBindingsForElements(movedIds: Set<string>): Array<Partial<ArrowElement> & { id: string }> {
    const updates: Array<Partial<ArrowElement> & { id: string }> = [];

    const allElements = this.elementsService.getElements();
    const arrows = allElements.filter((el): el is ArrowElement => el.type === ElementType.Arrow);

    for (const arrow of arrows) {
      let changed = false;
      const update: Partial<ArrowElement> & { id: string } = { id: arrow.id };

      // Check start binding
      if (arrow.startBinding && movedIds.has(arrow.startBinding.elementId)) {
        const otherEnd: Point = { x: arrow.x2 + arrow.x, y: arrow.y2 + arrow.y };
        const newStart = this.resolveEndpoint(
          arrow.startBinding,
          { x: arrow.x1 + arrow.x, y: arrow.y1 + arrow.y },
          otherEnd
        );
        update.x1 = newStart.x - arrow.x;
        update.y1 = newStart.y - arrow.y;
        changed = true;
      }

      // Check end binding
      if (arrow.endBinding && movedIds.has(arrow.endBinding.elementId)) {
        const otherEnd: Point = {
          x: (update.x1 !== undefined ? update.x1 : arrow.x1) + arrow.x,
          y: (update.y1 !== undefined ? update.y1 : arrow.y1) + arrow.y,
        };
        const newEnd = this.resolveEndpoint(
          arrow.endBinding,
          { x: arrow.x2 + arrow.x, y: arrow.y2 + arrow.y },
          otherEnd
        );
        update.x2 = newEnd.x - arrow.x;
        update.y2 = newEnd.y - arrow.y;
        changed = true;
      }

      if (changed) {
        updates.push(update);
      }
    }

    return updates;
  }

  /**
   * When an element is about to be deleted, detach all arrows bound to it.
   * Returns updates to apply before the element is removed.
   */
  detachAllFromElement(elementId: string): Array<Partial<ArrowElement> & { id: string }> {
    const updates: Array<Partial<ArrowElement> & { id: string }> = [];

    const arrows = this.getArrowsBoundTo(elementId);
    for (const arrow of arrows) {
      const update: Partial<ArrowElement> & { id: string } = { id: arrow.id };
      if (arrow.startBinding?.elementId === elementId) {
        update.startBinding = null;
      }
      if (arrow.endBinding?.elementId === elementId) {
        update.endBinding = null;
      }
      updates.push(update);
    }

    return updates;
  }

  /**
   * Check whether the given arrow has any active bindings.
   */
  hasBindings(arrow: ArrowElement): boolean {
    return arrow.startBinding !== null || arrow.endBinding !== null;
  }

  /**
   * Get a human-readable description of bindings (useful for debugging).
   */
  describeBindings(arrow: ArrowElement): string {
    const parts: string[] = [];
    if (arrow.startBinding) {
      parts.push(`start→${arrow.startBinding.elementId}(${arrow.startBinding.pointId ?? 'edge'})`);
    }
    if (arrow.endBinding) {
      parts.push(`end→${arrow.endBinding.elementId}(${arrow.endBinding.pointId ?? 'edge'})`);
    }
    return parts.length > 0 ? parts.join(', ') : 'unbound';
  }
}
