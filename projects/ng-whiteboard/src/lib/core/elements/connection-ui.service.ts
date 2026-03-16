import { Injectable, signal } from '@angular/core';
import { ConnectionPoint, Point } from '../types';

/**
 * Lightweight signal-based service for communicating arrow-connection UI state
 * from tools (ArrowTool, SelectTool) to the canvas component.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionUIService {
  /** Snap indicator position – shown when cursor is near a connectable shape */
  private readonly _snapIndicator = signal<Point | null>(null);
  readonly snapIndicator = this._snapIndicator.asReadonly();

  /** Connection points currently visible (hovered connectable shapes) */
  private readonly _visibleConnectionPoints = signal<ConnectionPoint[]>([]);
  readonly visibleConnectionPoints = this._visibleConnectionPoints.asReadonly();

  setSnapIndicator(point: Point | null): void {
    this._snapIndicator.set(point);
  }

  setVisibleConnectionPoints(points: ConnectionPoint[]): void {
    this._visibleConnectionPoints.set(points);
  }

  /** Clear all UI hints (called when tool finishes or deactivates) */
  clearAll(): void {
    this._snapIndicator.set(null);
    this._visibleConnectionPoints.set([]);
  }
}
