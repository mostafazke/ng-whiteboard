import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { icons, IconName } from './icons';

@Component({
  selector: 'ng-icon',
  standalone: true,
  template: `<span [innerHTML]="svg"></span>`,
  encapsulation: ViewEncapsulation.Emulated,
})
export class IconComponent implements OnChanges {
  @Input() name!: IconName;
  svg: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    const rawSvg = icons[this.name] || '';
    this.svg = this.sanitizer.bypassSecurityTrustHtml(rawSvg);
  }
}
