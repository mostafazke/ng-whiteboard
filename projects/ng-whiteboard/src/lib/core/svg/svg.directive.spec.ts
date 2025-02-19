import { SvgDirective } from './svg.directive';
import { SvgService } from './svg.service';

describe('SvgDirective', () => {
  let directive: SvgDirective;
  let svgServiceMock: Partial<SvgService>;

  beforeEach(() => {
    svgServiceMock = {
      onPointerDown: jest.fn(),
      onPointerMove: jest.fn(),
      onPointerUp: jest.fn(),
    };
    directive = new SvgDirective(svgServiceMock as SvgService);
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
