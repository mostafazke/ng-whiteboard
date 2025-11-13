import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardConfig } from '../types';

/**
 * Manages canvas panning operations including pan by delta, pan to position,
 * pan constraints, and bounds checking.
 */
@Injectable({ providedIn: 'root' })
export class PanService {
  private readonly DEFAULT_PAN_BOUNDS = { x: -Infinity, y: -Infinity, width: Infinity, height: Infinity };
  private panBounds = this.DEFAULT_PAN_BOUNDS;

  constructor(private configService: ConfigService, private eventBusService: EventBusService) {}

  private getConfig(): WhiteboardConfig {
    return this.configService.getConfig();
  }

  /**
   * Pan the canvas by delta amounts.
   */
  pan(dx: number, dy: number): void {
    const config = this.getConfig();
    const { x, y } = config;

    const newX = x + dx;
    const newY = y + dy;

    // Apply pan constraints
    const constrainedPosition = this.constrainPanPosition(newX, newY);

    this.setCanvasPosition(constrainedPosition.x, constrainedPosition.y);
  }

  /**
   * Pan to specific position.
   */
  panTo(x: number, y: number): void {
    const constrainedPosition = this.constrainPanPosition(x, y);
    this.setCanvasPosition(constrainedPosition.x, constrainedPosition.y);
  }

  private setCanvasPosition(x: number, y: number): void {
    this.configService.updateConfig({ x, y });
  }

  /**
   * Get current pan position.
   */
  getPanPosition(): { x: number; y: number } {
    const config = this.getConfig();
    return { x: config.x, y: config.y };
  }

  /**
   * Reset pan to origin.
   */
  resetPan(): void {
    this.setCanvasPosition(0, 0);
  }

  /**
   * Set pan bounds to constrain panning within specific area.
   */
  setPanBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    this.panBounds = bounds;
  }

  /**
   * Reset pan bounds to unlimited.
   */
  resetPanBounds(): void {
    this.panBounds = this.DEFAULT_PAN_BOUNDS;
  }

  /**
   * Get current pan bounds.
   */
  getPanBounds(): { x: number; y: number; width: number; height: number } {
    return { ...this.panBounds };
  }

  private constrainPanPosition(x: number, y: number): { x: number; y: number } {
    if (this.panBounds === this.DEFAULT_PAN_BOUNDS) {
      return { x, y };
    }

    const constrainedX = Math.max(this.panBounds.x, Math.min(this.panBounds.x + this.panBounds.width, x));

    const constrainedY = Math.max(this.panBounds.y, Math.min(this.panBounds.y + this.panBounds.height, y));

    return { x: constrainedX, y: constrainedY };
  }

  /**
   * Check if position is within pan bounds.
   */
  isPositionWithinBounds(x: number, y: number): boolean {
    if (this.panBounds === this.DEFAULT_PAN_BOUNDS) {
      return true;
    }

    return (
      x >= this.panBounds.x &&
      x <= this.panBounds.x + this.panBounds.width &&
      y >= this.panBounds.y &&
      y <= this.panBounds.y + this.panBounds.height
    );
  }

  /**
   * Get distance to pan bounds from current position.
   */
  getDistanceToBounds(): { left: number; top: number; right: number; bottom: number } {
    const { x, y } = this.getPanPosition();

    if (this.panBounds === this.DEFAULT_PAN_BOUNDS) {
      return { left: Infinity, top: Infinity, right: Infinity, bottom: Infinity };
    }

    return {
      left: x - this.panBounds.x,
      top: y - this.panBounds.y,
      right: this.panBounds.x + this.panBounds.width - x,
      bottom: this.panBounds.y + this.panBounds.height - y,
    };
  }

  /**
   * Pan with easing animation.
   */
  panWithEasing(targetX: number, targetY: number): void {
    this.panTo(targetX, targetY);
  }

  /**
   * Pan by delta with momentum.
   */
  panWithMomentum(dx: number, dy: number): void {
    this.pan(dx, dy);
  }

  /**
   * Extension point for custom pan constraints validation.
   */
  protected validatePanOperation(x: number, y: number, dx: number, dy: number): boolean {
    return this.isPositionWithinBounds(x + dx, y + dy);
  }

  /**
   * Extension point for custom pan acceleration.
   */
  protected applyPanAcceleration(dx: number, dy: number): { dx: number; dy: number } {
    return { dx, dy };
  }

  /**
   * Extension point for pan state change callback.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onPanChange(_oldPosition: { x: number; y: number }, _newPosition: { x: number; y: number }): void {
    // Override in derived classes for custom behavior
  }
}
