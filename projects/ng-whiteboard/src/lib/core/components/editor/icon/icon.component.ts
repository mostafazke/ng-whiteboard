import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { icons, IconName } from './icons';

@Component({
  selector: 'ng-icon',
  standalone: true,
  template: `<span [innerHTML]="svg"></span>`,
})
export class IconComponent implements OnChanges {
  @Input() name!: IconName;
  svg: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    this.svg = this.sanitizer.bypassSecurityTrustHtml(icons[this.name]);
  }
}
