import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { scaleShapePath } from '../../../utils/svg/shape-path';
import { icons, IconName } from './icons';

@Component({
  selector: 'ng-icon',
  standalone: true,
  template: `
    @if (path) {
      <svg viewBox="-0.1 -0.1 1.2 1.2" width="24" height="24" fill="none" stroke="currentColor">
        <path
          [attr.d]="fittedPath"
          [attr.transform]="offset"
          vector-effect="non-scaling-stroke"
          stroke-width="2"
        />
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
  /** Width / height of the shape, so `path` is drawn undistorted. */
  @Input() aspectRatio?: number;
  svg: SafeHtml = '';
  fittedPath?: string;
  offset: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    this.svg = this.name ? this.sanitizer.bypassSecurityTrustHtml(icons[this.name]) : '';
    this.fitPath();
  }

  private fitPath() {
    const ratio = this.aspectRatio && this.aspectRatio > 0 && Number.isFinite(this.aspectRatio) ? this.aspectRatio : 1;
    if (!this.path || ratio === 1) {
      this.fittedPath = this.path;
      this.offset = null;
      return;
    }
    const width = ratio > 1 ? 1 : ratio;
    const height = ratio > 1 ? 1 / ratio : 1;
    this.fittedPath = scaleShapePath(this.path, width, height);
    this.offset = `translate(${(1 - width) / 2} ${(1 - height) / 2})`;
  }
}
