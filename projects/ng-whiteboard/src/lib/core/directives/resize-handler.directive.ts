import { ChangeDetectorRef, Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { DataService } from '../data/data.service';

@Directive({
  selector: '[resizeHandler]',
  standalone: true,
})
export class ResizeHandlerDirective implements OnInit, OnDestroy {
  private resizeObserver!: ResizeObserver;

  constructor(private elementRef: ElementRef, private dataService: DataService, private _cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.resizeObserver = new ResizeObserver(([entry]) => {
      if (entry.target === this.elementRef.nativeElement) {
        const { fullScreen, center } = this.dataService.getConfig();

        if (fullScreen) {
          this.dataService.fullScreen();
        }
        if (center && !fullScreen) {
          this.dataService.centerCanvas();
        }
        this._cd.detectChanges();
      }
    });
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }
}
