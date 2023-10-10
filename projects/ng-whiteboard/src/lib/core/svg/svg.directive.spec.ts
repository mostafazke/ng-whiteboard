import { SvgDirective } from './svg.directive';
import { SvgService } from './svg.service';
import { ElementRef } from '@angular/core';

describe('SvgDirective', () => {
  let directive: SvgDirective;
  let elementRefMock: ElementRef<Partial<SVGSVGElement>>;
  let svgServiceMock: Partial<SvgService>;

  beforeEach(() => {
    elementRefMock = {
      nativeElement: {
        setPointerCapture: jest.fn(),
        hasPointerCapture: jest.fn(),
        releasePointerCapture: jest.fn(),
      },
    };
    svgServiceMock = {
      onPointerDown: jest.fn(),
      onPointerMove: jest.fn(),
      onPointerUp: jest.fn(),
    };
    directive = new SvgDirective(elementRefMock as ElementRef, svgServiceMock as SvgService);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should call onPointerDown when pointerdown event is triggered', () => {
    const eventMock = new MouseEvent('pointerdown') as PointerEvent;

    directive.onPointerDown(eventMock);

    expect(svgServiceMock.onPointerDown).toHaveBeenCalledWith(eventMock);
  });

  it('should call onPointerMove when pointermove event is triggered', () => {
    const eventMock = new MouseEvent('pointermove') as PointerEvent;

    directive.onPointerMove(eventMock);

    expect(svgServiceMock.onPointerMove).toHaveBeenCalledWith(eventMock);
  });

  it('should call onPointerUp when pointerup event is triggered', () => {
    const eventMock = new MouseEvent('pointerup') as PointerEvent;

    directive.onPointerUp(eventMock);

    expect(svgServiceMock.onPointerUp).toHaveBeenCalledWith(eventMock);
  });
});
