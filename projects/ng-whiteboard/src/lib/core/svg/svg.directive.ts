import { Directive, ElementRef, HostListener } from '@angular/core';
import { SvgService } from './svg.service';

@Directive({
  selector: '[svg]',
})
export class SvgDirective {
  lastX!: number;
  lastY!: number;

  constructor(private elementRef: ElementRef<SVGSVGElement>, private svgService: SvgService) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 1 && e.button !== 5) return;

    this.elementRef.nativeElement.setPointerCapture(e.pointerId);
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
    if (e.button !== 0 && e.button !== 1 && e.button !== 2 && e.button !== 5) return;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    if (this.elementRef.nativeElement.hasPointerCapture(e.pointerId)) {
      this.elementRef.nativeElement?.releasePointerCapture(e.pointerId);
    }

    const info = e;
    this.svgService.onPointerUp(info);
  }
}
