import { SvgDirective } from './svg.directive';
import { SvgService } from './svg.service';
import { TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ZoomService } from '../viewport/zoom.service';
import { PanService } from '../viewport/pan.service';
import { NgWhiteboardComponent } from '../../ng-whiteboard.component';
import { ApiService } from '../api/api.service';
import { HistoryService } from '../history/history.service';
import { ToolType } from '../types';
import { ConfigService } from '../config/config.service';
import { getCanvasCoordinates } from '../utils/geometry/coordinate';

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
  let zoomServiceMock: { getZoomLevel: jest.Mock; zoomAtPoint: jest.Mock };
  let panServiceMock: { pan: jest.Mock };

  beforeEach(() => {
    svgServiceMock = {
      onPointerDown: jest.fn(),
      onPointerMove: jest.fn(),
      onPointerUp: jest.fn(),
      onPointerCancel: jest.fn(),
      onContextMenu: jest.fn(),
      cancelInteraction: jest.fn(),
    };
    zoomServiceMock = { getZoomLevel: jest.fn().mockReturnValue(2), zoomAtPoint: jest.fn() };
    panServiceMock = { pan: jest.fn() };

    TestBed.configureTestingModule({
      imports: [TestComponent, SvgDirective],
      providers: [
        { provide: SvgService, useValue: svgServiceMock },
        { provide: ZoomService, useValue: zoomServiceMock },
        { provide: PanService, useValue: panServiceMock },
      ],
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

  it('should forward pointercancel / pointerleave to onPointerCancel', () => {
    const eventMock = withCurrentTarget(new MouseEvent('pointercancel') as PointerEvent, {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      hasPointerCapture: () => true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      releasePointerCapture: () => {},
    });
    directive.onPointerCancel(eventMock);
    expect(svgServiceMock.onPointerCancel).toHaveBeenCalled();
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

  describe('multi-touch gestures', () => {
    const rect: MockSvgElement = {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      hasPointerCapture: () => true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      releasePointerCapture: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setPointerCapture: () => {},
    };

    function pointer(type: string, init: PointerEventInit): PointerEvent {
      const event = new MouseEvent(type, init) as PointerEvent;
      Object.defineProperty(event, 'pointerId', { value: init.pointerId });
      Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'touch' });
      return withCurrentTarget(event, rect);
    }

    const down = (id: number, x: number, y: number) =>
      directive.onPointerDown(pointer('pointerdown', { pointerId: id, clientX: x, clientY: y, button: 0, buttons: 1 }));
    const move = (id: number, x: number, y: number) =>
      directive.onPointerMove(
        pointer('pointermove', { pointerId: id, clientX: x, clientY: y, button: -1, buttons: 1 })
      );
    const up = (id: number, x = 0, y = 0) =>
      directive.onPointerUp(pointer('pointerup', { pointerId: id, clientX: x, clientY: y, button: 0, buttons: 0 }));
    const leave = (id: number) =>
      directive.onPointerCancel(pointer('pointerleave', { pointerId: id, button: 0, buttons: 0 }));

    it('mouse input unaffected', () => {
      const mouse = (type: string, init: PointerEventInit) => pointer(type, { ...init, pointerType: 'mouse' });

      directive.onPointerDown(mouse('pointerdown', { pointerId: 1, clientX: 5, clientY: 5, button: 0, buttons: 1 }));
      directive.onPointerDown(mouse('pointerdown', { pointerId: 2, clientX: 50, clientY: 50, button: 0, buttons: 1 }));
      directive.onPointerMove(mouse('pointermove', { pointerId: 1, clientX: 15, clientY: 15, button: -1, buttons: 1 }));
      directive.onPointerUp(mouse('pointerup', { pointerId: 1, clientX: 15, clientY: 15, button: 0 }));

      expect(svgServiceMock.onPointerDown).toHaveBeenCalledTimes(2);
      expect(svgServiceMock.onPointerMove).toHaveBeenCalledTimes(1);
      expect(svgServiceMock.onPointerUp).toHaveBeenCalledTimes(1);
      expect((svgServiceMock.onPointerMove as jest.Mock).mock.calls[0][0]).toMatchObject({ x: 15, y: 15 });
      expect(svgServiceMock.cancelInteraction).not.toHaveBeenCalled();
      expect(zoomServiceMock.zoomAtPoint).not.toHaveBeenCalled();
      expect(panServiceMock.pan).not.toHaveBeenCalled();
    });

    it('single touch is forwarded like before', () => {
      down(1, 5, 5);
      move(1, 15, 15);
      up(1, 15, 15);

      expect(svgServiceMock.onPointerDown).toHaveBeenCalledTimes(1);
      expect(svgServiceMock.onPointerMove).toHaveBeenCalledTimes(1);
      expect(svgServiceMock.onPointerUp).toHaveBeenCalledTimes(1);
    });

    it('second finger cancels the interaction and stops forwarding', () => {
      down(1, 0, 0);
      down(2, 100, 0);

      expect(svgServiceMock.cancelInteraction).toHaveBeenCalledTimes(1);
      expect(svgServiceMock.onPointerDown).toHaveBeenCalledTimes(1);

      move(1, 10, 0);
      up(2);
      up(1);
      leave(1);
      leave(2);

      expect(svgServiceMock.onPointerMove).not.toHaveBeenCalled();
      expect(svgServiceMock.onPointerUp).not.toHaveBeenCalled();
      expect(svgServiceMock.onPointerCancel).not.toHaveBeenCalled();
    });

    it('two-finger drag pans by the midpoint delta in canvas units', () => {
      down(1, 0, 0);
      down(2, 100, 0);
      move(1, 10, 6);

      // midpoint moved (5, 3) screen px at zoom 2 -> (2.5, 1.5) canvas units
      expect(panServiceMock.pan).toHaveBeenCalledWith(2.5, 1.5);
    });

    it('a pure two-finger pan does not zoom', () => {
      // Each finger steps so the pair distance stays exactly 100 (scale === 1)
      down(1, 0, 0);
      down(2, 100, 0);
      move(1, 100, 100);
      move(2, 200, 100);

      expect(zoomServiceMock.zoomAtPoint).not.toHaveBeenCalled();
      expect(panServiceMock.pan).toHaveBeenCalledTimes(2);
    });

    it('pinch zooms around the gesture centre', () => {
      down(1, 100, 100);
      down(2, 200, 100);
      zoomServiceMock.zoomAtPoint.mockImplementation((z: number) => zoomServiceMock.getZoomLevel.mockReturnValue(z));
      move(2, 300, 100);

      // distance 100 -> 200 at zoom 2 -> 4, anchored at the previous midpoint (150, 100);
      // midpoint moved 50px at the new zoom 4 -> 12.5 canvas units
      expect(zoomServiceMock.zoomAtPoint).toHaveBeenCalledWith(4, 150, 100);
      expect(panServiceMock.pan).toHaveBeenCalledWith(12.5, 0);
    });

    it('pinch and two-finger pan do nothing when drawing is disabled (like wheel)', () => {
      TestBed.inject(ConfigService).updateConfig({ drawingEnabled: false });
      down(1, 100, 100);
      down(2, 200, 100);
      move(2, 300, 100);
      move(1, 120, 130);

      expect(zoomServiceMock.zoomAtPoint).not.toHaveBeenCalled();
      expect(panServiceMock.pan).not.toHaveBeenCalled();
    });

    it('a finger leaving mid-gesture is forgotten without cancelling the svg service', () => {
      down(1, 0, 0);
      down(2, 100, 0);
      leave(2);

      expect(svgServiceMock.onPointerCancel).not.toHaveBeenCalled();

      up(1);
      down(3, 50, 50);
      expect(svgServiceMock.onPointerDown).toHaveBeenCalledTimes(2);
    });

    it('single-touch pointercancel still reaches the svg service', () => {
      down(1, 0, 0);
      directive.onPointerCancel(pointer('pointercancel', { pointerId: 1, button: 0, buttons: 0 }));

      expect(svgServiceMock.onPointerCancel).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SvgDirective (integration)', () => {
  let directive: SvgDirective;
  let api: ApiService;
  let history: HistoryService;
  let component: NgWhiteboardComponent;
  let config: ConfigService;

  const rect: MockSvgElement = {
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    hasPointerCapture: () => false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    releasePointerCapture: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setPointerCapture: () => {},
  };

  function touch(type: string, id: number, x: number, y: number): PointerEvent {
    const event = new MouseEvent(type, {
      clientX: x,
      clientY: y,
      button: type === 'pointermove' ? -1 : 0,
      buttons: type === 'pointerup' ? 0 : 1,
    }) as PointerEvent;
    Object.defineProperty(event, 'pointerId', { value: id });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    return withCurrentTarget(event, rect);
  }

  beforeEach(async () => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    await TestBed.configureTestingModule({ imports: [NgWhiteboardComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NgWhiteboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    const svgDebug = fixture.debugElement.query(By.directive(SvgDirective));
    directive = svgDebug.injector.get(SvgDirective);
    api = svgDebug.injector.get(ApiService);
    history = svgDebug.injector.get(HistoryService);
    config = svgDebug.injector.get(ConfigService);
    api.setActiveTool(ToolType.Pen);
  });

  describe('gesture events', () => {
    let zoomChanges: number;
    let configChanges: number;

    beforeEach(() => {
      zoomChanges = 0;
      configChanges = 0;
      component.zoomChange.subscribe(() => zoomChanges++);
      component.configChange.subscribe(() => configChanges++);
    });

    const canvasPointAt = (sx: number, sy: number) => getCanvasCoordinates(config.getConfig(), { x: sx, y: sy });

    it('a 10-frame pinch emits exactly one ZoomChange and one ConfigChange, when it ends', () => {
      directive.onPointerDown(touch('pointerdown', 1, 100, 100));
      directive.onPointerDown(touch('pointerdown', 2, 200, 100));
      for (let i = 1; i <= 10; i++) {
        directive.onPointerMove(touch('pointermove', 2, 200 + i * 10, 100 + i));
      }

      expect(zoomChanges).toBe(0);
      expect(configChanges).toBe(0);
      expect(config.getConfig().zoom).toBeCloseTo(Math.hypot(200, 10) / 100);

      directive.onPointerUp(touch('pointerup', 2, 300, 110));
      directive.onPointerUp(touch('pointerup', 1, 100, 100));

      expect(zoomChanges).toBe(1);
      expect(configChanges).toBe(1);
    });

    it('a pan-only gesture emits no ZoomChange', () => {
      // Fingers leapfrog so the pair distance stays exactly 100 (scale === 1) while the midpoint moves
      directive.onPointerDown(touch('pointerdown', 1, 0, 0));
      directive.onPointerDown(touch('pointerdown', 2, 100, 0));
      for (let i = 1; i <= 5; i++) {
        directive.onPointerMove(touch('pointermove', 1, i * 100, i * 100));
        directive.onPointerMove(touch('pointermove', 2, i * 100 + 100, i * 100));
      }
      directive.onPointerUp(touch('pointerup', 1, 500, 500));
      directive.onPointerUp(touch('pointerup', 2, 600, 500));

      expect(config.getConfig().zoom).toBe(1);
      expect(config.getConfig().x).toBeCloseTo(500);
      expect(config.getConfig().y).toBeCloseTo(500);
      expect(zoomChanges).toBe(0);
      expect(configChanges).toBe(1);
    });

    it('keeps the canvas point under the fingers fixed on a centred page', () => {
      config.updateConfig({ fullScreen: false, center: true, canvasX: 0, canvasY: 0 }, false);
      directive.onPointerDown(touch('pointerdown', 1, 100, 100));
      directive.onPointerDown(touch('pointerdown', 2, 200, 100));
      const before = canvasPointAt(150, 100);

      for (let i = 1; i <= 10; i++) {
        directive.onPointerMove(touch('pointermove', 1, 100 - i * 5, 100));
        directive.onPointerMove(touch('pointermove', 2, 200 + i * 5, 100));
      }
      const during = canvasPointAt(150, 100);
      directive.onPointerUp(touch('pointerup', 1, 50, 100));
      directive.onPointerUp(touch('pointerup', 2, 250, 100));
      const after = canvasPointAt(150, 100);

      expect(config.getConfig().zoom).toBeCloseTo(2);
      expect(during.x).toBeCloseTo(before.x);
      expect(during.y).toBeCloseTo(before.y);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);
    });
  });

  it('cancels draft when second pointer goes down', () => {
    const elementsBefore = api.getElements();
    const canUndoBefore = history.getCanUndoSignal()();

    directive.onPointerDown(touch('pointerdown', 1, 10, 10));
    directive.onPointerMove(touch('pointermove', 1, 40, 40));
    expect(api.getDraftElements().length).toBe(1);

    directive.onPointerDown(touch('pointerdown', 2, 200, 200));

    expect(api.getDraftElements()).toEqual([]);
    expect(api.getElements()).toEqual(elementsBefore);
    expect(history.getCanUndoSignal()()).toBe(canUndoBefore);

    directive.onPointerUp(touch('pointerup', 1, 40, 40));
    directive.onPointerUp(touch('pointerup', 2, 200, 200));
    directive.onPointerMove(touch('pointermove', 1, 80, 80));

    expect(api.getDraftElements()).toEqual([]);
    expect(api.getElements()).toEqual(elementsBefore);
    expect(history.getCanUndoSignal()()).toBe(canUndoBefore);
  });

  it('keeps a mouse stroke alive across Space down/up (temporary Hand)', () => {
    const mouse = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type, {
        clientX: x,
        clientY: y,
        button: type === 'pointermove' ? -1 : 0,
        buttons: type === 'pointerup' ? 0 : 1,
      }) as PointerEvent;
      Object.defineProperty(event, 'pointerId', { value: 1 });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      return withCurrentTarget(event, rect);
    };

    directive.onPointerDown(mouse('pointerdown', 10, 10));
    directive.onPointerMove(mouse('pointermove', 30, 30));

    directive.onKeyDown(new KeyboardEvent('keydown', { code: 'Space' }));
    TestBed.tick();
    directive.onKeyUp(new KeyboardEvent('keyup', { code: 'Space' }));
    TestBed.tick();

    directive.onPointerMove(mouse('pointermove', 60, 60));
    directive.onPointerUp(mouse('pointerup', 60, 60));

    expect(api.getDraftElements()).toEqual([]);
    expect(api.getElements().length).toBe(1);
  });

  it('emits one DrawEnd for one DrawStart when a pinch resumes with a finger still down', () => {
    let drawStarts = 0;
    let drawEnds = 0;
    component.drawStart.subscribe(() => drawStarts++);
    component.drawEnd.subscribe(() => drawEnds++);

    directive.onPointerDown(touch('pointerdown', 1, 10, 10));
    directive.onPointerDown(touch('pointerdown', 2, 200, 200));
    directive.onPointerUp(touch('pointerup', 2, 200, 200));
    directive.onPointerDown(touch('pointerdown', 3, 150, 150));
    directive.onPointerUp(touch('pointerup', 3, 150, 150));
    directive.onPointerUp(touch('pointerup', 1, 10, 10));

    expect(drawStarts).toBe(1);
    expect(drawEnds).toBe(1);
  });

  it('draws normally with a single finger after a gesture', () => {
    directive.onPointerDown(touch('pointerdown', 1, 10, 10));
    directive.onPointerDown(touch('pointerdown', 2, 200, 200));
    directive.onPointerUp(touch('pointerup', 1, 10, 10));
    directive.onPointerUp(touch('pointerup', 2, 200, 200));

    directive.onPointerDown(touch('pointerdown', 3, 10, 10));
    directive.onPointerMove(touch('pointermove', 3, 60, 60));
    directive.onPointerUp(touch('pointerup', 3, 60, 60));

    expect(api.getDraftElements()).toEqual([]);
    expect(api.getElements().length).toBe(1);
  });
});
