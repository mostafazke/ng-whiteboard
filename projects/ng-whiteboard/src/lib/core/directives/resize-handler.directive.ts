import { Directive, ElementRef, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Util } from '../utils/util';
import { DataService } from './../data/data.service';

@Directive({
  selector: '[resizeHandler]',
})
export class ResizeHandlerDirective implements OnInit, OnDestroy {
  private updateBoundsDebounced: () => void;
  private resizeObserver: ResizeObserver | undefined;

  constructor(private elementRef: ElementRef<SVGSVGElement>, private dataService: DataService, private ngZone: NgZone) {
    this.updateBoundsDebounced = Util.debounce(this.updateBounds.bind(this), 100);
  }

  ngOnInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]?.contentRect) {
        this.updateBoundsDebounced();
      }
    });

    this.resizeObserver?.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.updateBoundsDebounced();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateBoundsDebounced();
  }

  updateBounds() {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();

    if (rect) {
      const bounds = {
        minX: rect.left,
        maxX: rect.left + rect.width,
        minY: rect.top,
        maxY: rect.top + rect.height,
        width: rect.width,
        height: rect.height,
      };

      this.dataService.updateBounds(bounds);
    }
  }
}
