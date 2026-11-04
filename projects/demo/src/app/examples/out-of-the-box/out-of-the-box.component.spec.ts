import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutOfTheBoxComponent } from './out-of-the-box.component';
import { NgWhiteboardComponent } from 'ng-whiteboard';

describe('OutOfTheBoxComponent', () => {
  let component: OutOfTheBoxComponent;
  let fixture: ComponentFixture<OutOfTheBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgWhiteboardComponent, OutOfTheBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OutOfTheBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
