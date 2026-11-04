import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuiltinEditorComponent } from './builtin-editor.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';

describe('BuiltinEditorComponent', () => {
  let component: BuiltinEditorComponent;
  let fixture: ComponentFixture<BuiltinEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgWhiteboardComponent, BuiltinEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BuiltinEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
