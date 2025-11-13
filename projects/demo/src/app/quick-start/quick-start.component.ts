import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';

@Component({
  selector: 'app-quick-start',
  templateUrl: './quick-start.component.html',
  styleUrls: ['./quick-start.component.scss'],
  standalone: true,
  imports: [HeaderComponent, NgWhiteboardComponent, RouterModule],
})
export class QuickStartComponent {
  libraryImportCode = `import { NgWhiteboardComponent } from 'ng-whiteboard';`;
  NgModuleCode = `@NgModule({
  imports: [
    // Other imports
    NgWhiteboardComponent
  ],
})
export class AppModule {}`;

  standaloneComponentCode = `import { Component } from '@angular/core';
import { NgWhiteboardComponent } from 'ng-whiteboard';

@Component({
  selector: 'my-component',
  standalone: true,
  imports: [NgWhiteboardComponent],
  template: '<ng-whiteboard></ng-whiteboard>',
})
export class MyComponent {}`;
}
