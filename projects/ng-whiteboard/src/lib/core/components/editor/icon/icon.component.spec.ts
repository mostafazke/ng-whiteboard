import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the named icon', () => {
    fixture.componentRef.setInput('name', 'Pen');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('renders a normalized path in the unit square when path is set', () => {
    fixture.componentRef.setInput('path', 'M0 0 L1 1 Z');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('svg')?.getAttribute('viewBox')).toBe('-0.1 -0.1 1.2 1.2');
    const path = root.querySelector('svg path[d="M0 0 L1 1 Z"]');
    expect(path?.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    expect(path?.getAttribute('stroke-width')).toBe('2');
  });
});
