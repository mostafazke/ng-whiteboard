import { Directive, ElementRef, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';

export interface ContextMenuEvent {
  x: number;
  y: number;
  originalEvent: MouseEvent;
}

@Directive({
  selector: '[contextMenuCapture]',
  standalone: true,
})
export class ContextMenuDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);

  @Output() contextMenuTriggered = new EventEmitter<ContextMenuEvent>();
  @Output() contextMenuHidden = new EventEmitter<void>();

  private contextMenuListener?: (event: MouseEvent) => void;
  private clickListener?: (event: MouseEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;

  ngOnInit() {
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.removeEventListeners();
  }

  private setupEventListeners() {
    const element = this.elementRef.nativeElement;

    this.contextMenuListener = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      this.contextMenuTriggered.emit({
        x: event.clientX,
        y: event.clientY,
        originalEvent: event,
      });
    };

    this.clickListener = (event: MouseEvent) => {
      if (event.button === 0) {
        this.contextMenuHidden.emit();
      }
    };

    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.contextMenuHidden.emit();
      }
    };

    element.addEventListener('contextmenu', this.contextMenuListener);
    element.addEventListener('click', this.clickListener);
    document.addEventListener('keydown', this.keydownListener);
  }

  private removeEventListeners() {
    const element = this.elementRef.nativeElement;

    if (this.contextMenuListener) {
      element.removeEventListener('contextmenu', this.contextMenuListener);
    }
    if (this.clickListener) {
      element.removeEventListener('click', this.clickListener);
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
  }
}
