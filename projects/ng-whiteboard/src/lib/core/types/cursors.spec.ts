import { CursorType } from './cursors';

describe('CursorType', () => {
  it('should have all standard CSS cursor types', () => {
    expect(CursorType.Default).toBe('default');
    expect(CursorType.Pointer).toBe('pointer');
    expect(CursorType.Crosshair).toBe('crosshair');
    expect(CursorType.Grab).toBe('grab');
    expect(CursorType.Grabbing).toBe('grabbing');
    expect(CursorType.Move).toBe('move');
    expect(CursorType.Text).toBe('text');
    expect(CursorType.NotAllowed).toBe('not-allowed');
  });

  it('should have resize cursor types', () => {
    expect(CursorType.NResize).toBe('n-resize');
    expect(CursorType.SResize).toBe('s-resize');
    expect(CursorType.EResize).toBe('e-resize');
    expect(CursorType.WResize).toBe('w-resize');
    expect(CursorType.NEResize).toBe('ne-resize');
    expect(CursorType.NWResize).toBe('nw-resize');
    expect(CursorType.SEResize).toBe('se-resize');
    expect(CursorType.SWResize).toBe('sw-resize');
  });

  it('should have action state cursor types', () => {
    expect(CursorType.Copy).toBe('copy');
    expect(CursorType.NoDrop).toBe('no-drop');
    expect(CursorType.ZoomIn).toBe('zoom-in');
    expect(CursorType.ZoomOut).toBe('zoom-out');
  });
});
