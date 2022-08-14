import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprehensiveComponent } from './comprehensive.component';

describe('ComprehensiveComponent', () => {
  let component: ComprehensiveComponent;
  let fixture: ComponentFixture<ComprehensiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComprehensiveComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprehensiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
