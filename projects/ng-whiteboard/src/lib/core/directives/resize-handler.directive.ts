import { ChangeDetectorRef, Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../api/api.service';

@Directive({
  selector: '[resizeHandler]',
  standalone: true,
})
export class ResizeHandlerDirective implements OnInit, OnDestroy {
  private resizeObserver!: ResizeObserver;

  constructor(private elementRef: ElementRef, private apiService: ApiService, private _cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.resizeObserver = new ResizeObserver(([entry]) => {
      if (entry.target === this.elementRef.nativeElement) {
        const { fullScreen, center } = this.apiService.getConfig();

        setTimeout(() => {
          if (fullScreen) {
            this.apiService.fullScreen();
          }
          if (center && !fullScreen) {
            this.apiService.centerCanvas();
          }
          this._cd.detectChanges();
        }, 0);
      }
    });
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }
}
