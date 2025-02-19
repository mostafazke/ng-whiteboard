import { Directive, HostListener } from '@angular/core';
import { SvgService } from './svg.service';

@Directive({
  selector: '[svg]',
})
export class SvgDirective {
  lastX!: number;
  lastY!: number;

  constructor(private svgService: SvgService) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;

    if (e.currentTarget) {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }

    const info = e;
    this.svgService.onPointerDown(info);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    if (e.clientX === this.lastX && e.clientY === this.lastY) return;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    const info = e;
    this.svgService.onPointerMove(info);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(e: PointerEvent) {
    if (e.button !== 0) return;

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    if (e.currentTarget && (e.currentTarget as Element).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    }

    const info = e;
    this.svgService.onPointerUp(info);
  }
}
