import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationComponent } from './documentation.component';
import { SharedModule } from '../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('DocumentationComponent', () => {
  let component: DocumentationComponent;
  let fixture: ComponentFixture<DocumentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentationComponent],
      imports: [RouterTestingModule, SharedModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
