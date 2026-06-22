import { Directive, ElementRef, AfterViewInit, inject } from '@angular/core';
import * as hljs from 'highlight.js';

@Directive({
  selector: 'code[highlight]',
  standalone: true,
})
export class HighlightCodeDirective implements AfterViewInit {
  private readonly elRef = inject(ElementRef);

  ngAfterViewInit() {
    hljs.default.highlightBlock(this.elRef.nativeElement);
  }
}
