import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { SvgService } from './svg.service';
import { PointerInfo } from '../types';
import { MOUSE_BUTTON } from '../constants';

@Directive({
  selector: '[svg]',
  standalone: true,
})
export class SvgDirective {
  private elementRef = inject(ElementRef);
  lastX!: number;
  lastY!: number;

  private lastClickTime = 0;
  private lastClickX = 0;
  private lastClickY = 0;
  private readonly DOUBLE_CLICK_THRESHOLD = 300;
  private readonly DOUBLE_CLICK_DISTANCE = 10;

  constructor(private svgService: SvgService) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== MOUSE_BUTTON.RIGHT) {
      event.preventDefault();
    }

    if (event.currentTarget) {
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    }

    if (event.button === MOUSE_BUTTON.RIGHT) return;

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

    if (event.button === MOUSE_BUTTON.RIGHT) return;
    const pointerInfo = this.createPointerInfo(event);
    this.svgService.onPointerUp(pointerInfo);
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
