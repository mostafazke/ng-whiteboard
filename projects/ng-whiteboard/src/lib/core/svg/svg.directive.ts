import { Directive, ElementRef, HostListener } from '@angular/core';
import { SvgService } from './svg.service';
import { PointerInfo } from '../types/types';

@Directive({
  selector: '[svg]',
})
export class SvgDirective {
  pointer?: PointerInfo;

  constructor(private elementRef: ElementRef<SVGSVGElement>, private svgService: SvgService) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 1 && e.button !== 5) return;

    e.stopPropagation();
    this.elementRef.nativeElement.setPointerCapture(e.pointerId);
    const info = this.svgService.getPointerInfo(e);
    this.svgService.onPointerDown(info);
    this.pointer = info;
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    if (this.pointer && e.pointerId !== this.pointer.pointerId) return;

    const info = this.svgService.getPointerInfo(e);

    if (this.elementRef.nativeElement.hasPointerCapture(e.pointerId)) {
      // this.svgService.onDragShape(info);
    }

    this.svgService.onPointerMove(info);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(e: PointerEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    // const isDoubleClick = inputs.isDoubleClick()
    const info = this.svgService.getPointerInfo(e);

    if (this.elementRef.nativeElement.hasPointerCapture(e.pointerId)) {
      this.elementRef.nativeElement.releasePointerCapture(e.pointerId);
    }

    // if (isDoubleClick && !(info.altKey || info.metaKey)) {
    //   this.svgService.onDoubleClickShape?.(info, e)
    // }

    // this.svgService.onReleaseShape(info);
    this.svgService.onPointerUp?.(info);
  }
}
