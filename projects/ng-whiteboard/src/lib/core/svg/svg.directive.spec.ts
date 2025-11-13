import { SvgDirective } from './svg.directive';
import { SvgService } from './svg.service';
import { TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

interface MockSvgElement {
  getBoundingClientRect: () => { left: number; top: number };
  hasPointerCapture?: (id: number) => boolean;
  releasePointerCapture?: (id: number) => void;
  setPointerCapture?: (id: number) => void;
}

function withCurrentTarget<E extends PointerEvent>(event: E, target: MockSvgElement): E {
  Object.defineProperty(event, 'currentTarget', { value: target });
  return event;
}

@Component({
  template: '<svg svg></svg>',
  standalone: true,
  imports: [SvgDirective],
})
class TestComponent {}

describe('SvgDirective', () => {
  let directive: SvgDirective;
  let svgServiceMock: Partial<SvgService>;
  let debugElement: DebugElement;

  beforeEach(() => {
    svgServiceMock = {
      onPointerDown: jest.fn(),
      onPointerMove: jest.fn(),
      onPointerUp: jest.fn(),
      onContextMenu: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TestComponent, SvgDirective],
      providers: [{ provide: SvgService, useValue: svgServiceMock }],
    });

    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    debugElement = fixture.debugElement.query(By.directive(SvgDirective));
    directive = debugElement.injector.get(SvgDirective);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should call onPointerDown for left button', () => {
    const eventMock = withCurrentTarget(new MouseEvent('pointerdown', { button: 0 }) as PointerEvent, {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setPointerCapture: () => {},
    });
    directive.onPointerDown(eventMock);
    expect(svgServiceMock.onPointerDown).toHaveBeenCalled();
  });

  it('should not call onPointerDown for right button', () => {
    const eventMock = new MouseEvent('pointerdown', { button: 2 }) as PointerEvent;
    directive.onPointerDown(eventMock);
    expect(svgServiceMock.onPointerDown).not.toHaveBeenCalled();
  });

  it('should forward middle button pointerdown to service (service decides to pan)', () => {
    const downEvent = withCurrentTarget(
      new MouseEvent('pointerdown', { button: 1, clientX: 10, clientY: 10 }) as PointerEvent,
      {
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setPointerCapture: () => {},
      }
    );
    directive.onPointerDown(downEvent);
    expect(svgServiceMock.onPointerDown).toHaveBeenCalled();
  });

  it('should call onPointerMove for left button drawing', () => {
    // Simulate left button held (buttons bitmask 1)
    const eventMock = withCurrentTarget(new MouseEvent('pointermove', { buttons: 1 }) as PointerEvent, {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    });
    directive.onPointerMove(eventMock);
    expect(svgServiceMock.onPointerMove).toHaveBeenCalled();
  });

  it('should call onPointerUp for left button', () => {
    const eventMock = withCurrentTarget(new MouseEvent('pointerup', { button: 0 }) as PointerEvent, {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      hasPointerCapture: () => true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      releasePointerCapture: () => {},
    });
    directive.onPointerUp(eventMock);
    expect(svgServiceMock.onPointerUp).toHaveBeenCalled();
  });

  it('should forward middle button up to service (no draw end expected)', () => {
    const upEvent = withCurrentTarget(new MouseEvent('pointerup', { button: 1 }) as PointerEvent, {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      hasPointerCapture: () => true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      releasePointerCapture: () => {},
    });
    directive.onPointerUp(upEvent);
    // Service should get the pointer up (it will decide to end pan)
    expect(svgServiceMock.onPointerUp).toHaveBeenCalled();
  });

  it('should handle context menu with container-relative positioning', () => {
    const containerBounds = { left: 100, top: 50, right: 400, bottom: 300, width: 300, height: 250 };
    const eventMock = withCurrentTarget(
      new MouseEvent('contextmenu', {
        clientX: 250, // Absolute window position
        clientY: 150, // Absolute window position
      }) as PointerEvent,
      {
        getBoundingClientRect: () => containerBounds,
      }
    ) as PointerEvent;

    // Spy on preventDefault to ensure it's called
    const preventDefaultSpy = jest.spyOn(eventMock, 'preventDefault');

    directive.onContextMenu(eventMock);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(svgServiceMock.onContextMenu).toHaveBeenCalled();

    // Verify the adjusted pointer info was passed
    const callArgs = (svgServiceMock.onContextMenu as jest.Mock).mock.calls[0];
    const pointerInfo = callArgs[0];
    const passedContainerBounds = callArgs[1];

    // Check that container-relative coordinates were converted back to container-relative absolute coordinates
    // clientX should be containerBounds.left + relativeX (100 + 150 = 250)
    // clientY should be containerBounds.top + relativeY (50 + 100 = 150)
    expect(pointerInfo.clientX).toBe(250);
    expect(pointerInfo.clientY).toBe(150);
    expect(passedContainerBounds).toEqual(containerBounds);
  });
});
