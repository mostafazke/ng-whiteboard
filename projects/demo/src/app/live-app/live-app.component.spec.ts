import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveAppComponent } from './live-app.component';

describe('LiveAppComponent', () => {
  let component: LiveAppComponent;
  let fixture: ComponentFixture<LiveAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveAppComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
