import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { QuickStartComponent } from './quick-start.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';

describe('QuickStartComponent', () => {
  let component: QuickStartComponent;
  let fixture: ComponentFixture<QuickStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NgWhiteboardComponent, QuickStartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
