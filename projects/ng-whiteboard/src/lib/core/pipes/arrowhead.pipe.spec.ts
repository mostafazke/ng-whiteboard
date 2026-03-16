import { ArrowheadPipe, ArrowRenderData } from './arrowhead.pipe';
import { ArrowElement, ArrowheadType } from '../elements';
import { ElementType } from '../types/elements';
import { ArrowPathType } from '../types/connections';

/** Minimal ArrowElement factory — only fields used by the pipe */
function makeArrow(overrides: Partial<ArrowElement> = {}): ArrowElement {
  return {
    id: 'a1',
    type: ElementType.Arrow,
    x: 0,
    y: 0,
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 0,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    style: { strokeWidth: 2 },
    startHead: { type: ArrowheadType.None },
    endHead: { type: ArrowheadType.None },
    startBinding: null,
    endBinding: null,
    pathType: { type: 'straight' },
    ...overrides,
  } as ArrowElement;
}

describe('ArrowheadPipe', () => {
  let pipe: ArrowheadPipe;

  beforeEach(() => {
    pipe = new ArrowheadPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  // ------------------------------------------------------------------ //
  //  Straight arrows — no heads                                        //
  // ------------------------------------------------------------------ //

  describe('straight arrows with no heads', () => {
    it('should return unadjusted endpoints and empty heads', () => {
      const el = makeArrow();
      const result = pipe.transform(el);

      expect(result.heads).toEqual([]);
      expect(result.lineX1).toBe(0);
      expect(result.lineY1).toBe(0);
      expect(result.lineX2).toBe(100);
      expect(result.lineY2).toBe(0);
      expect(result.isCurved).toBe(false);
      expect(result.pathD).toBe('M 0 0 L 100 0');
    });
  });

  // ------------------------------------------------------------------ //
  //  Arrowhead types — end head                                        //
  // ------------------------------------------------------------------ //

  describe('end head types', () => {
    it('should render Arrow (filled triangle)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.Arrow } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(true);
      expect(result.heads[0].d).toContain('M 0 0');
      expect(result.heads[0].strokeWidth).toBeUndefined();
      // Line should be pulled back
      expect(result.lineX2).toBeLessThan(100);
    });

    it('should render OpenArrow (stroked chevron)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.OpenArrow } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(false);
      expect(result.heads[0].strokeWidth).toBeDefined();
      expect(result.heads[0].strokeWidth).toBeGreaterThan(0);
    });

    it('should render Diamond (filled)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.Diamond } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(true);
      expect(result.heads[0].d).toContain('-14');
    });

    it('should render OpenDiamond (stroked)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.OpenDiamond } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(false);
      expect(result.heads[0].strokeWidth).toBeDefined();
    });

    it('should render Circle (filled)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.Circle } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(true);
      expect(result.heads[0].d).toContain('A 5 5');
    });

    it('should render OpenCircle (stroked)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.OpenCircle } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(false);
      expect(result.heads[0].strokeWidth).toBeDefined();
    });

    it('should render Bar (stroked)', () => {
      const el = makeArrow({ endHead: { type: ArrowheadType.Bar } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.heads[0].filled).toBe(false);
      // Bar has baseInset=0, so line end should not be pulled back
      expect(result.lineX2).toBe(100);
    });
  });

  // ------------------------------------------------------------------ //
  //  Start head                                                         //
  // ------------------------------------------------------------------ //

  describe('start head', () => {
    it('should render a start head and pull back line start', () => {
      const el = makeArrow({ startHead: { type: ArrowheadType.Arrow } });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.lineX1).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  Both heads                                                         //
  // ------------------------------------------------------------------ //

  describe('both heads', () => {
    it('should render two heads and adjust both endpoints', () => {
      const el = makeArrow({
        startHead: { type: ArrowheadType.OpenArrow },
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(2);
      expect(result.lineX1).toBeGreaterThan(0);
      expect(result.lineX2).toBeLessThan(100);
    });
  });

  // ------------------------------------------------------------------ //
  //  Inset clamping (short arrow)                                       //
  // ------------------------------------------------------------------ //

  describe('inset clamping on short arrows', () => {
    it('should clamp combined insets to 80% of arrow length', () => {
      // Very short arrow with big heads
      const el = makeArrow({
        x2: 10,
        y2: 0,
        style: { strokeWidth: 10 },
        startHead: { type: ArrowheadType.Diamond }, // large inset
        endHead: { type: ArrowheadType.Diamond },
      });
      const result = pipe.transform(el);

      // The adjusted endpoints should not cross each other
      expect(result.lineX1).toBeLessThan(result.lineX2);
    });
  });

  // ------------------------------------------------------------------ //
  //  Diagonal arrow                                                     //
  // ------------------------------------------------------------------ //

  describe('diagonal arrow', () => {
    it('should compute correct angle for non-horizontal arrows', () => {
      const el = makeArrow({
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // Transform should contain a 45-degree rotation
      expect(result.heads[0].transform).toContain('rotate(45)');
    });
  });

  // ------------------------------------------------------------------ //
  //  strokeWidth edge cases                                             //
  // ------------------------------------------------------------------ //

  describe('strokeWidth handling', () => {
    it('should default to 2 when strokeWidth is 0 (falsy)', () => {
      const el = makeArrow({
        style: { strokeWidth: 0 },
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // strokeWidth || 2 → 2, so size = max(12,2*3)=12, scale=12/10=1.2
      expect(result.heads.length).toBe(1);
    });

    it('should use strokeWidth when provided', () => {
      const el = makeArrow({
        style: { strokeWidth: 8 },
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // size = max(12, 8*3)=24, scale=24/10=2.4
      expect(result.heads[0].transform).toContain('scale(2.4)');
    });

    it('should use minimum size of 12 for thin strokes', () => {
      const el = makeArrow({
        style: { strokeWidth: 1 },
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // size = max(12, 1*3)=12, scale=12/10=1.2
      expect(result.heads[0].transform).toContain('scale(1.2)');
    });
  });

  // ------------------------------------------------------------------ //
  //  Quadratic path type                                                //
  // ------------------------------------------------------------------ //

  describe('quadratic path type', () => {
    it('should compute tangent angles from control point', () => {
      const pathType: ArrowPathType = { type: 'quadratic', cx: 50, cy: -50 };
      const el = makeArrow({
        pathType,
        endHead: { type: ArrowheadType.Arrow },
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.isCurved).toBe(true);
      expect(result.heads.length).toBe(2);
      expect(result.pathD).toContain('Q 50 -50');
    });

    it('should adjust line start using direction toward control point', () => {
      const pathType: ArrowPathType = { type: 'quadratic', cx: 50, cy: -50 };
      const el = makeArrow({
        pathType,
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // Start point should be shifted toward control point
      expect(result.lineX1).toBeGreaterThan(0);
      expect(result.lineY1).toBeLessThan(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  Cubic path type                                                    //
  // ------------------------------------------------------------------ //

  describe('cubic path type', () => {
    it('should compute tangent angles from two control points', () => {
      const pathType: ArrowPathType = { type: 'cubic', cx1: 30, cy1: -40, cx2: 70, cy2: 40 };
      const el = makeArrow({
        pathType,
        endHead: { type: ArrowheadType.Arrow },
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.isCurved).toBe(true);
      expect(result.heads.length).toBe(2);
      expect(result.pathD).toContain('C 30 -40 70 40');
    });

    it('should adjust line start using direction toward first control point', () => {
      const pathType: ArrowPathType = { type: 'cubic', cx1: 30, cy1: -40, cx2: 70, cy2: 40 };
      const el = makeArrow({
        pathType,
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.lineX1).toBeGreaterThan(0);
      expect(result.lineY1).toBeLessThan(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  Elbow path type                                                    //
  // ------------------------------------------------------------------ //

  describe('elbow path type', () => {
    it('should generate elbow path with right-angle segments', () => {
      const pathType: ArrowPathType = { type: 'elbow', midRatio: 0.5 };
      const el = makeArrow({ pathType });
      const result = pipe.transform(el);

      expect(result.isCurved).toBe(true);
      // Elbow path has two L commands (bend point)
      expect(result.pathD).toMatch(/M .* L .* L .* L .*/);
    });

    it('should compute horizontal angles for elbow heads (x2 > x1)', () => {
      const pathType: ArrowPathType = { type: 'elbow', midRatio: 0.5 };
      const el = makeArrow({
        pathType,
        endHead: { type: ArrowheadType.Arrow },
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(2);
      // End head at 0° (pointing right), start head at 180° (pointing left)
      expect(result.heads[0].transform).toContain('rotate(0)');
      expect(result.heads[1].transform).toContain('rotate(180)');
    });

    it('should reverse angles when x2 < x1', () => {
      const pathType: ArrowPathType = { type: 'elbow', midRatio: 0.5 };
      const el = makeArrow({
        x1: 100,
        y1: 0,
        x2: 0,
        y2: 50,
        pathType,
        endHead: { type: ArrowheadType.Arrow },
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(2);
      // When x2<x1: endAngle=180, startAngle=0
      expect(result.heads[0].transform).toContain('rotate(180)');
      expect(result.heads[1].transform).toContain('rotate(0)');
    });

    it('should adjust start endpoint using forward direction', () => {
      const pathType: ArrowPathType = { type: 'elbow', midRatio: 0.5 };
      const el = makeArrow({
        pathType,
        startHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // Start should be pulled forward (toward x2)
      expect(result.lineX1).toBeGreaterThan(0);
    });

    it('should use default midRatio when not provided', () => {
      const pathType = { type: 'elbow' } as ArrowPathType;
      const el = makeArrow({ pathType });
      const result = pipe.transform(el);

      // midRatio defaults to 0.5 via ?? 0.5
      const bendX = 0 + (100 - 0) * 0.5;
      expect(result.pathD).toContain(`L ${bendX} `);
    });
  });

  // ------------------------------------------------------------------ //
  //  Unknown/unhandled head type via default branch                     //
  // ------------------------------------------------------------------ //

  describe('unknown head type', () => {
    it('should return null for an unrecognized arrowhead type', () => {
      const el = makeArrow({
        endHead: { type: 'unknown-type' as ArrowheadType },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  undefined config                                                   //
  // ------------------------------------------------------------------ //

  describe('undefined head config', () => {
    it('should handle undefined startHead', () => {
      const el = makeArrow({ startHead: undefined as any });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  Transform string format                                            //
  // ------------------------------------------------------------------ //

  describe('buildTransform output', () => {
    it('should produce correct translate/rotate/scale format', () => {
      const el = makeArrow({
        x2: 0,
        y2: 100,
        endHead: { type: ArrowheadType.Arrow },
        style: { strokeWidth: 2 },
      });
      const result = pipe.transform(el);

      // Angle should be 90°; translate at (0,100); scale=1.2
      expect(result.heads[0].transform).toBe('translate(0 100) rotate(90) scale(1.2)');
    });
  });

  // ------------------------------------------------------------------ //
  //  Open head strokeWidth calculation                                  //
  // ------------------------------------------------------------------ //

  describe('open head strokeWidth scaling', () => {
    it('should divide strokeWidth by scale for open heads', () => {
      const el = makeArrow({
        style: { strokeWidth: 6 },
        endHead: { type: ArrowheadType.OpenArrow },
      });
      const result = pipe.transform(el);

      // size = max(12, 6*3)=18, scale=18/10=1.8
      // headStrokeWidth = 6 / 1.8 ≈ 3.333
      expect(result.heads[0].strokeWidth).toBeCloseTo(6 / 1.8, 5);
    });
  });

  // ------------------------------------------------------------------ //
  //  Zero-length arrow (arrowLen = 0)                                   //
  // ------------------------------------------------------------------ //

  describe('zero-length arrow', () => {
    it('should not clamp insets when arrow length is zero', () => {
      const el = makeArrow({
        x1: 50,
        y1: 50,
        x2: 50,
        y2: 50,
        startHead: { type: ArrowheadType.Arrow },
        endHead: { type: ArrowheadType.Arrow },
      });
      // Should not throw
      const result = pipe.transform(el);
      expect(result.heads.length).toBe(2);
    });
  });

  // ------------------------------------------------------------------ //
  //  pathType undefined / straight isCurved                             //
  // ------------------------------------------------------------------ //

  describe('pathType variations', () => {
    it('should treat straight path as not curved', () => {
      const el = makeArrow({ pathType: { type: 'straight' } });
      const result = pipe.transform(el);
      expect(result.isCurved).toBe(false);
    });

    it('should handle undefined pathType gracefully', () => {
      const el = makeArrow({ pathType: undefined as any });
      const result = pipe.transform(el);
      // Falls through to straight angle calc
      expect(result.isCurved).toBe(false);
      expect(result.pathD).toContain('M');
      expect(result.pathD).toContain('L');
    });
  });

  // ------------------------------------------------------------------ //
  //  Elbow with inset clamping                                          //
  // ------------------------------------------------------------------ //

  describe('elbow with inset clamping on short arrow', () => {
    it('should clamp insets for elbow path type', () => {
      const el = makeArrow({
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        pathType: { type: 'elbow', midRatio: 0.5 },
        style: { strokeWidth: 10 },
        startHead: { type: ArrowheadType.Diamond },
        endHead: { type: ArrowheadType.Diamond },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(2);
    });
  });

  // ------------------------------------------------------------------ //
  //  Quadratic with inset clamping on short arrow                       //
  // ------------------------------------------------------------------ //

  describe('quadratic with inset clamping on short arrow', () => {
    it('should clamp insets for quadratic path type', () => {
      const el = makeArrow({
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        pathType: { type: 'quadratic', cx: 5, cy: -5 },
        style: { strokeWidth: 10 },
        startHead: { type: ArrowheadType.Diamond },
        endHead: { type: ArrowheadType.Diamond },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(2);
    });
  });

  // ------------------------------------------------------------------ //
  //  Cubic with inset clamping on short arrow                           //
  // ------------------------------------------------------------------ //

  describe('cubic with inset clamping on short arrow', () => {
    it('should clamp insets for cubic path type', () => {
      const el = makeArrow({
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        pathType: { type: 'cubic', cx1: 3, cy1: -3, cx2: 7, cy2: 3 },
        style: { strokeWidth: 10 },
        startHead: { type: ArrowheadType.Diamond },
        endHead: { type: ArrowheadType.Diamond },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(2);
    });
  });

  // ------------------------------------------------------------------ //
  //  No inset clamping with ample length                                //
  // ------------------------------------------------------------------ //

  describe('no inset clamping with long arrow', () => {
    it('should not clamp insets on a long arrow', () => {
      const el = makeArrow({
        x1: 0,
        y1: 0,
        x2: 1000,
        y2: 0,
        startHead: { type: ArrowheadType.Arrow },
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // Plenty of room, no clamping needed
      const size = Math.max(12, 2 * 3); // 12
      const inset = 10 * (size / 10); // 12
      expect(result.lineX1).toBeCloseTo(inset, 5);
      expect(result.lineX2).toBeCloseTo(1000 - inset, 5);
    });
  });

  // ------------------------------------------------------------------ //
  //  Elbow head only end (no start)                                     //
  // ------------------------------------------------------------------ //

  describe('elbow with only end head', () => {
    it('should adjust only the end for elbow path', () => {
      const pathType: ArrowPathType = { type: 'elbow', midRatio: 0.5 };
      const el = makeArrow({
        pathType,
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.lineX1).toBe(0);
      expect(result.lineX2).toBeLessThan(100);
    });
  });

  // ------------------------------------------------------------------ //
  //  Quadratic with only end head                                       //
  // ------------------------------------------------------------------ //

  describe('quadratic with only end head', () => {
    it('should adjust only the end endpoint', () => {
      const pathType: ArrowPathType = { type: 'quadratic', cx: 50, cy: -50 };
      const el = makeArrow({
        pathType,
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.lineX1).toBe(0);
      expect(result.lineY1).toBe(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  Cubic with only end head                                           //
  // ------------------------------------------------------------------ //

  describe('cubic with only end head', () => {
    it('should adjust only the end endpoint', () => {
      const pathType: ArrowPathType = { type: 'cubic', cx1: 30, cy1: -40, cx2: 70, cy2: 40 };
      const el = makeArrow({
        pathType,
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      expect(result.heads.length).toBe(1);
      expect(result.lineX1).toBe(0);
      expect(result.lineY1).toBe(0);
    });
  });

  // ------------------------------------------------------------------ //
  //  Style with undefined strokeWidth                                   //
  // ------------------------------------------------------------------ //

  describe('undefined strokeWidth in style', () => {
    it('should fall back to 2 when strokeWidth is undefined', () => {
      const el = makeArrow({
        style: {},
        endHead: { type: ArrowheadType.Arrow },
      });
      const result = pipe.transform(el);

      // strokeWidth = undefined || 2 → 2; size = max(12, 6)=12; scale=1.2
      expect(result.heads[0].transform).toContain('scale(1.2)');
    });
  });
});
