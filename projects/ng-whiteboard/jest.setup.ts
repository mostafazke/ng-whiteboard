import { Canvas } from 'canvas';

// Mock PointerEvent using MouseEvent
class MockPointerEvent extends MouseEvent {
  public pointerId: number;
  public pointerType: string;
  public pressure: number;
  public tiltX: number;
  public tiltY: number;
  public width: number;
  public height: number;
  public isPrimary: boolean;

  constructor(type: string, eventInitDict?: PointerEventInit) {
    super(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      ...eventInitDict,
    });

    this.pointerId = eventInitDict?.pointerId ?? 1;
    this.pointerType = eventInitDict?.pointerType ?? 'mouse';
    this.pressure = eventInitDict?.pressure ?? 0.5;
    this.tiltX = eventInitDict?.tiltX ?? 0;
    this.tiltY = eventInitDict?.tiltY ?? 0;
    this.width = eventInitDict?.width ?? 1;
    this.height = eventInitDict?.height ?? 1;
    this.isPrimary = eventInitDict?.isPrimary ?? true;
  }
}

declare global {
  interface Window {
    HTMLCanvasElement: {
      prototype: HTMLCanvasElement;
    };
  }
}

// Set up PointerEvent mock
(window as any).PointerEvent = MockPointerEvent;

// Configure canvas for JSDOM
(window.HTMLCanvasElement.prototype as any).getContext = function (contextType: string) {
  if (contextType === '2d') {
    return new Canvas(this.width, this.height).getContext('2d');
  }
  return null;
};
