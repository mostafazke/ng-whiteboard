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

  it('fits a wide path into the unit square without distortion, centred vertically', () => {
    fixture.componentRef.setInput('path', 'M0 0 L1 1 Z');
    fixture.componentRef.setInput('aspectRatio', 2);
    fixture.detectChanges();
    const path = (fixture.nativeElement as HTMLElement).querySelector('svg path');
    expect(path?.getAttribute('d')).toBe('M0 0 L1 0.5 Z');
    expect(path?.getAttribute('transform')).toBe('translate(0 0.25)');
  });

  it('fits a tall path into the unit square without distortion, centred horizontally', () => {
    fixture.componentRef.setInput('path', 'M0 0 L1 1 Z');
    fixture.componentRef.setInput('aspectRatio', 0.5);
    fixture.detectChanges();
    const path = (fixture.nativeElement as HTMLElement).querySelector('svg path');
    expect(path?.getAttribute('d')).toBe('M0 0 L0.5 1 Z');
    expect(path?.getAttribute('transform')).toBe('translate(0.25 0)');
  });
});
