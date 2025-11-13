import { PointerInfo } from '../../types';

/**
 * Helper function to create mock PointerInfo for testing
 */
export function createMockPointerInfo(
  overrides: Partial<PointerInfo & { offsetX?: number; offsetY?: number }> = {}
): PointerInfo {
  return {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    movementX: 0,
    movementY: 0,
    pressure: 0.5,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    width: 1,
    height: 1,
    pointerType: 'mouse',
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    eventType: 'pointermove',
    timeStamp: Date.now(),
    target: null,
    ...overrides,
  } as PointerInfo;
}
