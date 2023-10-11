import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinimalComponent } from './minimal.component';
import { NgWhiteboardModule } from 'ng-whiteboard';

describe('MinimalComponent', () => {
  let component: MinimalComponent;
  let fixture: ComponentFixture<MinimalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MinimalComponent],
      imports: [NgWhiteboardModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MinimalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
