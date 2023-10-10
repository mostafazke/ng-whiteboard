import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicComponent } from './basic.component';
import { NgWhiteboardModule } from 'ng-whiteboard';

describe('BasicComponent', () => {
  let component: BasicComponent;
  let fixture: ComponentFixture<BasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BasicComponent],
      imports: [NgWhiteboardModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
