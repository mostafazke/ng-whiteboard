import { Pipe, PipeTransform } from '@angular/core';

// Cursor types
const CURSOR_NW_RESIZE = 'nw-resize';
const CURSOR_NE_RESIZE = 'ne-resize';
const CURSOR_NS_RESIZE = 'ns-resize';
const CURSOR_EW_RESIZE = 'ew-resize';
const CURSOR_GRAB = 'grab';
const CURSOR_DEFAULT = 'default';

// Rotation thresholds
const MIN_ANGLE_THRESHOLD = 45;
const MAX_ANGLE_THRESHOLD = 135;

// Grip identifiers
const ROTATE_IDENTIFIER = 'rotate';

@Pipe({
  name: 'gripCursor',
  standalone: true,
})
export class GripCursorPipe implements PipeTransform {
  private readonly cornerGrips = ['nw', 'ne', 'se', 'sw'];
  private readonly sideGrips = ['n', 's', 'e', 'w'];

  transform(grip: string, rotation: number): string {
    if (grip.includes(ROTATE_IDENTIFIER)) {
      return CURSOR_GRAB;
    }

    const isHorizontalOrientation = this.isHorizontalOrientation(rotation);

    if (this.cornerGrips.includes(grip)) {
      return this.getCornerCursor(grip, isHorizontalOrientation);
    }

    if (this.sideGrips.includes(grip)) {
      return this.getSideCursor(grip, isHorizontalOrientation);
    }

    return CURSOR_DEFAULT;
  }

  private isHorizontalOrientation(rotation: number): boolean {
    const normalizedRotation = rotation % 180;
    return normalizedRotation < MIN_ANGLE_THRESHOLD || normalizedRotation > MAX_ANGLE_THRESHOLD;
  }

  private getCornerCursor(grip: string, isHorizontal: boolean): string {
    const isNwOrSe = grip === 'nw' || grip === 'se';

    if (isNwOrSe) {
      return isHorizontal ? CURSOR_NW_RESIZE : CURSOR_NE_RESIZE;
    }

    return isHorizontal ? CURSOR_NE_RESIZE : CURSOR_NW_RESIZE;
  }

  private getSideCursor(grip: string, isHorizontal: boolean): string {
    const isNorthOrSouth = grip === 'n' || grip === 's';

    if (isNorthOrSouth) {
      return isHorizontal ? CURSOR_NS_RESIZE : CURSOR_EW_RESIZE;
    }

    return isHorizontal ? CURSOR_EW_RESIZE : CURSOR_NS_RESIZE;
  }
}
