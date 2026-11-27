import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { icons, IconName } from './icons';

@Component({
  selector: 'ng-icon',
  standalone: true,
  template: `
    @if (path) {
      <svg viewBox="-0.1 -0.1 1.2 1.2" width="24" height="24" fill="none" stroke="currentColor">
        <path [attr.d]="path" vector-effect="non-scaling-stroke" stroke-width="2" />
      </svg>
    } @else {
      <span [innerHTML]="svg"></span>
    }
  `,
})
export class IconComponent implements OnChanges {
  @Input() name!: IconName;
  /** A normalized shape path in the unit square; rendered instead of `name` when set. */
  @Input() path?: string;
  svg: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    this.svg = this.name ? this.sanitizer.bypassSecurityTrustHtml(icons[this.name]) : '';
  }
}
