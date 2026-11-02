import { Directive, HostListener, ElementRef, OnDestroy, inject } from '@angular/core';
import { SvgService } from './svg.service';
import { PointerInfo } from '../types';
import { MOUSE_BUTTON } from '../constants';
import { ZoomService } from '../viewport/zoom.service';
import { PanService } from '../viewport/pan.service';
import { ConfigService } from '../config/config.service';
import { GestureFrame, GestureTracker } from './gesture-tracker';

const TOUCH = 'touch';
/** Finger-distance jitter below this per-frame scale change is a pure pan, so it never emits a ZoomChange. */
const PINCH_DEAD_ZONE = 1e-3;

@Directive({
  selector: '[svg]',
  standalone: true,
})
export class SvgDirective implements OnDestroy {
  private elementRef = inject(ElementRef);
  private zoomService = inject(ZoomService);
  private panService = inject(PanService);
  private configService = inject(ConfigService);
  private gestureTracker = new GestureTracker();
  /** The touch pointer currently forwarded to the svg service as a normal single-pointer interaction. */
  private singleTouchId: number | null = null;
  private holdingConfigEvents = false;
  lastX!: number;
  lastY!: number;

  private lastClickTime = 0;
  private lastClickX = 0;
  private lastClickY = 0;
  private readonly DOUBLE_CLICK_THRESHOLD = 300;
  private readonly DOUBLE_CLICK_DISTANCE = 10;

  constructor(private svgService: SvgService) {}

  ngOnDestroy(): void {
    this.releaseConfigEvents();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== MOUSE_BUTTON.RIGHT) {
      event.preventDefault();
    }

    if (event.currentTarget) {
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    }

    if (event.button === MOUSE_BUTTON.RIGHT) return;

    if (event.pointerType === TOUCH) {
      const { x, y } = this.getPointerPosition(event);
      const result = this.gestureTracker.down(event.pointerId, x, y);
      if (result === 'start-gesture') {
        this.singleTouchId = null;
        this.svgService.cancelInteraction();
        return;
      }
      if (result === 'ignore') return;
      this.singleTouchId = event.pointerId;
    }

    const currentTime = Date.now();
    const currentX = event.clientX;
    const currentY = event.clientY;

    if (
      this.lastClickTime &&
      currentTime - this.lastClickTime < this.DOUBLE_CLICK_THRESHOLD &&
      Math.abs(currentX - this.lastClickX) < this.DOUBLE_CLICK_DISTANCE &&
      Math.abs(currentY - this.lastClickY) < this.DOUBLE_CLICK_DISTANCE
    ) {
      const pointerInfo = this.createPointerInfo(event);
      pointerInfo.isDoubleClick = true;
      this.svgService.onPointerDown(pointerInfo);
      this.lastClickTime = 0;
      return;
    }

    this.lastClickTime = currentTime;
    this.lastClickX = currentX;
    this.lastClickY = currentY;

    const pointerInfo = this.createPointerInfo(event);
    this.svgService.onPointerDown(pointerInfo);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerType === TOUCH) {
      const { x, y } = this.getPointerPosition(event);
      const frame = this.gestureTracker.move(event.pointerId, x, y);
      if (frame && this.configService.getConfig().drawingEnabled) this.applyGesture(frame);
      if (this.gestureTracker.isGesturing || event.pointerId !== this.singleTouchId) return;
    }

    if (event.clientX === this.lastX && event.clientY === this.lastY) return;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    if (event.buttons & 2) return;
    const pointerInfo = this.createPointerInfo(event);
    this.svgService.onPointerMove(pointerInfo);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    if (event.currentTarget && (event.currentTarget as Element).hasPointerCapture(event.pointerId)) {
      (event.currentTarget as Element).releasePointerCapture(event.pointerId);
    }

    if (event.pointerType === TOUCH && !this.releaseTouch(event.pointerId)) return;

    if (event.button === MOUSE_BUTTON.RIGHT) return;
    const pointerInfo = this.createPointerInfo(event);
    this.svgService.onPointerUp(pointerInfo);
  }

  @HostListener('pointercancel', ['$event'])
  @HostListener('pointerleave', ['$event'])
  onPointerCancel(event: PointerEvent): void {
    if (event.currentTarget && (event.currentTarget as Element).hasPointerCapture(event.pointerId)) {
      (event.currentTarget as Element).releasePointerCapture(event.pointerId);
    }
    if (event.pointerType === TOUCH && !this.releaseTouch(event.pointerId)) return;
    this.svgService.onPointerCancel(this.createPointerInfo(event));
  }

  /** Forget a touch pointer; true when it was the forwarded single pointer and should reach the svg service. */
  private releaseTouch(pointerId: number): boolean {
    const result = this.gestureTracker.up(pointerId);
    if (result === 'end-gesture') this.releaseConfigEvents();
    const isSingle = result === 'single' && pointerId === this.singleTouchId;
    if (pointerId === this.singleTouchId) this.singleTouchId = null;
    return isSingle;
  }

  /**
   * Zoom about the previous midpoint, then pan by its movement, so the content under the fingers follows it.
   * Config events are held until the gesture ends, so consumers get one ZoomChange/ConfigChange per gesture.
   */
  private applyGesture({ scale, dx, dy, centerX, centerY }: GestureFrame): void {
    if (!this.holdingConfigEvents) {
      this.holdingConfigEvents = true;
      this.configService.holdEvents();
    }
    if (Math.abs(scale - 1) >= PINCH_DEAD_ZONE) {
      this.zoomService.zoomAtPoint(this.zoomService.getZoomLevel() * scale, centerX - dx, centerY - dy);
    }
    const zoom = this.zoomService.getZoomLevel();
    this.panService.pan(dx / zoom, dy / zoom);
  }

  private releaseConfigEvents(): void {
    if (!this.holdingConfigEvents) return;
    this.holdingConfigEvents = false;
    this.configService.releaseEvents();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.svgService.onWheel(event);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    this.svgService.onKeyDown(event);
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.svgService.onKeyUp(event);
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.svgService.onDragOver(event);
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.svgService.onDrop(event);
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: PointerEvent): void {
    event.preventDefault();
    const pointerInfo = this.createPointerInfo(event);
    const containerBounds = (event.currentTarget as SVGElement).getBoundingClientRect();

    const relativePosition = this.getPointerPosition(event);
    const adjustedPointerInfo = {
      ...pointerInfo,
      clientX: containerBounds.left + relativePosition.x,
      clientY: containerBounds.top + relativePosition.y,
    };

    this.svgService.onContextMenu(adjustedPointerInfo, containerBounds);
  }

  private createPointerInfo(event: PointerEvent): PointerInfo {
    const { x, y } = this.getPointerPosition(event);
    return {
      x,
      y,

      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      movementX: event.movementX,
      movementY: event.movementY,

      pressure: event.pressure,
      tangentialPressure: event.tangentialPressure,
      tiltX: event.tiltX,
      tiltY: event.tiltY,
      twist: event.twist,

      width: event.width,
      height: event.height,

      pointerType: event.pointerType,
      pointerId: event.pointerId,
      isPrimary: event.isPrimary,

      button: event.button as -1 | 0 | 1 | 2 | 3 | 4,
      buttons: event.buttons,

      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,

      eventType: event.type,

      timeStamp: event.timeStamp,

      target: event.target,
    };
  }

  private getPointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return { x, y };
  }
}
