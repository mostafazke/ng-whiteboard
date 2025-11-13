export interface PointerInfo {
  // Position
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  movementX: number;
  movementY: number;

  // Pressure/tilt
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;

  // Contact geometry
  width: number;
  height: number;

  // Input type
  pointerType: string;
  pointerId: number;
  isPrimary: boolean;

  // Button states
  button: -1 | 0 | 1 | 2 | 3 | 4;
  buttons: number;

  // Modifier keys
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;

  // Event type
  eventType: string;

  // Click detection
  isDoubleClick?: boolean;

  // Timing
  timeStamp: number;

  // Target element
  target: EventTarget | null;
}
