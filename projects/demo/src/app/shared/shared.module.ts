import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { RouterModule } from '@angular/router';
import { HighlightCodeDirective } from './directives/highlight.directive';
import { NgxColorsModule } from 'ngx-colors';

@NgModule({
  declarations: [HeaderComponent, HighlightCodeDirective],
  imports: [CommonModule, RouterModule, NgxColorsModule],
  exports: [HeaderComponent, HighlightCodeDirective, NgxColorsModule],
})
export class SharedModule {}
