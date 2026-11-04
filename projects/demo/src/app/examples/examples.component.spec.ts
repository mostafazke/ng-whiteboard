import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamplesComponent } from './examples.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';
import { MinimalComponent } from './minimal/minimal.component';
import { OutOfTheBoxComponent } from './out-of-the-box/out-of-the-box.component';
import { CustomEditorComponent } from './custom-editor/custom-editor.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ExamplesComponent', () => {
  let component: ExamplesComponent;
  let fixture: ComponentFixture<ExamplesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NgWhiteboardComponent,
        RouterTestingModule,
        ExamplesComponent,
        MinimalComponent,
        OutOfTheBoxComponent,
        CustomEditorComponent,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
