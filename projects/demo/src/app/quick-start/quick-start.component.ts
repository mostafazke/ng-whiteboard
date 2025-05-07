import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/components/header/header.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';

@Component({
  selector: 'app-quick-start',
  templateUrl: './quick-start.component.html',
  standalone: true,
  imports: [HeaderComponent, NgWhiteboardComponent],
})
export class QuickStartComponent {
  libraryImportCode = `import { NgWhiteboardComponent } from 'ng-whiteboard';`;
  NgModuleCode = `@NgModule({
imports: [
  // Other imports
  NgWhiteboardComponent
],
})
export class AppModule {}
`;
  standaloneImportCode = `import { NgWhiteboardComponent } from 'ng-whiteboard';`;
  standaloneComponentCode = `import { Component } from '@angular/core';
import { NgWhiteboardComponent } from 'ng-whiteboard';

@Component({
  selector: 'my-component',
  imports: [NgWhiteboardComponent],
  template: '<ng-whiteboard></ng-whiteboard>',
})
export class MyComponent {}
`;
}
