import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { NgWhiteboardModule } from 'ng-whiteboard';
import { SharedModule } from '../shared/shared.module';
import { QuickStartComponent } from './quick-start.component';

describe('QuickStartComponent', () => {
  let component: QuickStartComponent;
  let fixture: ComponentFixture<QuickStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickStartComponent ],
      imports: [
        RouterTestingModule,
        SharedModule,
        NgWhiteboardModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
