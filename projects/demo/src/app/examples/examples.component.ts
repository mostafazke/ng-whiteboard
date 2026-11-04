import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { MinimalComponent } from './minimal/minimal.component';
import { BuiltinEditorComponent } from './builtin-editor/builtin-editor.component';
import { CustomEditorComponent } from './custom-editor/custom-editor.component';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss'],
  standalone: true,
  imports: [RouterLink, HeaderComponent, MinimalComponent, BuiltinEditorComponent, CustomEditorComponent],
})
export class ExamplesComponent {}
