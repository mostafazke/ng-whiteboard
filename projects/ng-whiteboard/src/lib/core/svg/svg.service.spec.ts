import { SvgService } from './svg.service';

describe('SvgService', () => {
  let service: SvgService;

  beforeEach(() => {
    service = new SvgService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set isPointing to true on pointer down', () => {
    const pointerEvent = {} as PointerEvent;
    service.onPointerDown(pointerEvent);
    expect(service.isPointing).toBe(true);
  });

  it('should emit pointer down event', () => {
    const pointerEvent = {} as PointerEvent;
    const spy = jest.spyOn(service['pointerDownSubject'], 'next');
    service.onPointerDown(pointerEvent);
    expect(spy).toHaveBeenCalledWith(pointerEvent);
  });

  it('should emit pointer move event when isPointing is true', () => {
    service.isPointing = true;
    const pointerEvent = {} as PointerEvent;
    const spy = jest.spyOn(service['pointerMoveSubject'], 'next');
    service.onPointerMove(pointerEvent);
    expect(spy).toHaveBeenCalledWith(pointerEvent);
  });

  it('should not emit pointer move event when isPointing is false', () => {
    service.isPointing = false;
    const pointerEvent = {} as PointerEvent;
    const spy = jest.spyOn(service['pointerMoveSubject'], 'next');
    service.onPointerMove(pointerEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set isPointing to false on pointer up', () => {
    const pointerEvent = {} as PointerEvent;
    service.onPointerUp(pointerEvent);
    expect(service.isPointing).toBe(false);
  });

  it('should emit pointer up event', () => {
    const pointerEvent = {} as PointerEvent;
    const spy = jest.spyOn(service['pointerUpSubject'], 'next');
    service.onPointerUp(pointerEvent);
    expect(spy).toHaveBeenCalledWith(pointerEvent);
  });
});
