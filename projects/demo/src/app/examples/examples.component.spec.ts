import { SharedModule } from './../shared/shared.module';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamplesComponent } from './examples.component';
import { NgWhiteboardModule } from 'ng-whiteboard';
import { MinimalComponent } from './minimal/minimal.component';
import { BasicComponent } from './basic/basic.component';
import { ComprehensiveComponent } from './comprehensive/comprehensive.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ExamplesComponent', () => {
  let component: ExamplesComponent;
  let fixture: ComponentFixture<ExamplesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamplesComponent, MinimalComponent, BasicComponent, ComprehensiveComponent],
      imports: [SharedModule, NgWhiteboardModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
