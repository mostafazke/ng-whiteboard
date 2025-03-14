import { Component } from '@angular/core';

@Component({
  selector: 'app-quick-start',
  templateUrl: './quick-start.component.html',
})
export class QuickStartComponent {
  libraryImportCode = `import { NgWhiteboardModule } from 'ng-whiteboard';`;
  NgModuleCode = `@NgModule({
imports: [
  // Other imports
  NgWhiteboardModule
],
declarations: [ /* Your components */ ]
})
export class AppModule {}
`;
}
