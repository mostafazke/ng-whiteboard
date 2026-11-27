import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomShapesComponent } from './custom-shapes.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';

describe('CustomShapesComponent', () => {
  let component: CustomShapesComponent;
  let fixture: ComponentFixture<CustomShapesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgWhiteboardComponent, CustomShapesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomShapesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register the pentagon and cloud shapes', () => {
    expect(component.config.shapes?.map((s) => s.id)).toEqual(['pentagon', 'cloud']);
  });
});
