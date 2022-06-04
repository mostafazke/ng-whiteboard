import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhiteboardEditorComponent } from './whiteboard-editor.component';

describe('WhiteboardEditorComponent', () => {
  let component: WhiteboardEditorComponent;
  let fixture: ComponentFixture<WhiteboardEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WhiteboardEditorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhiteboardEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
