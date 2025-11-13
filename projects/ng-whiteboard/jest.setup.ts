import { Canvas } from 'canvas';

// Mock crypto.randomUUID for Node.js environments that don't have it
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    writable: true,
  });
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = (() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }) as () => `${string}-${string}-${string}-${string}-${string}`;
}

// Polyfill PointerEvent for jsdom
class MockPointerEvent extends MouseEvent {
  public pointerId: number;
  public width: number;
  public height: number;
  public pressure: number;
  public tiltX: number;
  public tiltY: number;
  public pointerType: string;
  public isPrimary: boolean;
  public tangentialPressure: number;
  public twist: number;
  public altitudeAngle: number;
  public azimuthAngle: number;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.width = params.width ?? 1;
    this.height = params.height ?? 1;
    this.pressure = params.pressure ?? 0;
    this.tiltX = params.tiltX ?? 0;
    this.tiltY = params.tiltY ?? 0;
    this.pointerType = params.pointerType ?? '';
    this.isPrimary = params.isPrimary ?? false;
    this.tangentialPressure = params.tangentialPressure ?? 0;
    this.twist = params.twist ?? 0;
    this.altitudeAngle = 0;
    this.azimuthAngle = 0;
  }

  public getCoalescedEvents(): PointerEvent[] {
    return [];
  }

  public getPredictedEvents(): PointerEvent[] {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).PointerEvent = MockPointerEvent;

// Mock Canvas context - use 'canvas' package for Node.js environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window.HTMLCanvasElement.prototype as any).getContext = function (contextType: string) {
  if (contextType === '2d') {
    return new Canvas(200, 200).getContext('2d');
  }
  return null;
};
