export interface NormalizedShapePath {
  path: string;
  aspectRatio: number;
}

type Point = [number, number];

type Segment =
  | { type: 'M'; points: [Point] }
  | { type: 'L'; points: [Point] }
  | { type: 'Q'; points: [Point, Point] }
  | { type: 'C'; points: [Point, Point, Point] }
  | { type: 'Z'; points: [] };

const NUMBER_PATTERN = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/y;
const SEPARATOR_PATTERN = /[\s,]*/y;
const COMMAND_PATTERN = /[MmLlHhVvCcSsQqTtAaZz]/;
const MIN_SIZE = 1e-9;

const ARG_COUNTS: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

class PathScanner {
  private pos = 0;

  constructor(private readonly d: string) {}

  skipSeparators(): void {
    SEPARATOR_PATTERN.lastIndex = this.pos;
    SEPARATOR_PATTERN.exec(this.d);
    this.pos = SEPARATOR_PATTERN.lastIndex;
  }

  atEnd(): boolean {
    this.skipSeparators();
    return this.pos >= this.d.length;
  }

  readCommand(): string | null {
    this.skipSeparators();
    const ch = this.d[this.pos];
    if (ch === undefined || !COMMAND_PATTERN.test(ch)) return null;
    this.pos++;
    return ch;
  }

  peekNumber(): boolean {
    this.skipSeparators();
    NUMBER_PATTERN.lastIndex = this.pos;
    return NUMBER_PATTERN.test(this.d);
  }

  readNumber(): number | null {
    this.skipSeparators();
    NUMBER_PATTERN.lastIndex = this.pos;
    const match = NUMBER_PATTERN.exec(this.d);
    if (!match) return null;
    this.pos = NUMBER_PATTERN.lastIndex;
    return Number(match[0]);
  }

  readFlag(): number | null {
    this.skipSeparators();
    const ch = this.d[this.pos];
    if (ch !== '0' && ch !== '1') return null;
    this.pos++;
    return ch === '1' ? 1 : 0;
  }

  readArgs(upper: string): number[] | null {
    const args: number[] = [];
    for (let i = 0; i < ARG_COUNTS[upper]; i++) {
      const value = upper === 'A' && (i === 3 || i === 4) ? this.readFlag() : this.readNumber();
      if (value === null) return null;
      args.push(value);
    }
    return args;
  }
}

function parseToAbsolute(d: string): Segment[] | null {
  const scanner = new PathScanner(d);
  const segments: Segment[] = [];
  let current: Point = [0, 0];
  let subpathStart: Point = [0, 0];
  let lastCubicCtrl: Point | null = null;
  let lastQuadCtrl: Point | null = null;

  while (!scanner.atEnd()) {
    let command: string | null = scanner.readCommand();
    if (command === null) return null;
    if (segments.length === 0 && command !== 'M' && command !== 'm') return null;

    let first = true;
    while (first || scanner.peekNumber()) {
      const upper: string = command.toUpperCase();
      if (upper === 'Z' && !first) return null;
      first = false;

      const args = scanner.readArgs(upper);
      if (args === null) return null;

      const relative: boolean = command !== upper;
      const ox = relative ? current[0] : 0;
      const oy = relative ? current[1] : 0;
      let cubicCtrl: Point | null = null;
      let quadCtrl: Point | null = null;

      switch (upper) {
        case 'M': {
          current = [args[0] + ox, args[1] + oy];
          subpathStart = current;
          segments.push({ type: 'M', points: [current] });
          command = relative ? 'l' : 'L';
          break;
        }
        case 'L':
          current = [args[0] + ox, args[1] + oy];
          segments.push({ type: 'L', points: [current] });
          break;
        case 'H':
          current = [args[0] + ox, current[1]];
          segments.push({ type: 'L', points: [current] });
          break;
        case 'V':
          current = [current[0], args[0] + oy];
          segments.push({ type: 'L', points: [current] });
          break;
        case 'C': {
          const c1: Point = [args[0] + ox, args[1] + oy];
          const c2: Point = [args[2] + ox, args[3] + oy];
          const end: Point = [args[4] + ox, args[5] + oy];
          segments.push({ type: 'C', points: [c1, c2, end] });
          cubicCtrl = c2;
          current = end;
          break;
        }
        case 'S': {
          const c1 = reflect(lastCubicCtrl, current);
          const c2: Point = [args[0] + ox, args[1] + oy];
          const end: Point = [args[2] + ox, args[3] + oy];
          segments.push({ type: 'C', points: [c1, c2, end] });
          cubicCtrl = c2;
          current = end;
          break;
        }
        case 'Q': {
          const c: Point = [args[0] + ox, args[1] + oy];
          const end: Point = [args[2] + ox, args[3] + oy];
          segments.push({ type: 'Q', points: [c, end] });
          quadCtrl = c;
          current = end;
          break;
        }
        case 'T': {
          const c = reflect(lastQuadCtrl, current);
          const end: Point = [args[0] + ox, args[1] + oy];
          segments.push({ type: 'Q', points: [c, end] });
          quadCtrl = c;
          current = end;
          break;
        }
        case 'A': {
          const end: Point = [args[5] + ox, args[6] + oy];
          segments.push(...arcToSegments(current, args[0], args[1], args[2], args[3], args[4], end));
          current = end;
          break;
        }
        case 'Z':
          segments.push({ type: 'Z', points: [] });
          current = subpathStart;
          break;
      }

      lastCubicCtrl = cubicCtrl;
      lastQuadCtrl = quadCtrl;
    }
  }

  return segments;
}

function reflect(ctrl: Point | null, about: Point): Point {
  return ctrl ? [2 * about[0] - ctrl[0], 2 * about[1] - ctrl[1]] : about;
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  const sign = ux * vy - uy * vx < 0 ? -1 : 1;
  const dot = ux * vx + uy * vy;
  const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  return sign * Math.acos(Math.max(-1, Math.min(1, dot / len)));
}

// SVG spec F.6.5 endpoint-to-center conversion, then cubic approximation in <=90° pieces.
function arcToSegments(
  start: Point,
  rxIn: number,
  ryIn: number,
  angleDeg: number,
  largeArc: number,
  sweep: number,
  end: Point
): Segment[] {
  const [x1, y1] = start;
  const [x2, y2] = end;
  if (x1 === x2 && y1 === y2) return [];

  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [{ type: 'L', points: [end] }];

  const phi = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }

  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const num = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p;
  const den = rx2 * y1p * y1p + ry2 * x1p * x1p;
  const coef = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;

  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  const theta1 = vectorAngle(1, 0, ux, uy);
  let deltaTheta = vectorAngle(ux, uy, vx, vy);
  if (!sweep && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
  if (sweep && deltaTheta < 0) deltaTheta += 2 * Math.PI;

  const count = Math.max(1, Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2) - 1e-9));
  const delta = deltaTheta / count;
  const k = (4 / 3) * Math.tan(delta / 4);

  const pointAt = (t: number): Point => {
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    return [cx + cos * ex - sin * ey, cy + sin * ex + cos * ey];
  };
  const tangentAt = (t: number): Point => {
    const ex = -rx * Math.sin(t);
    const ey = ry * Math.cos(t);
    return [cos * ex - sin * ey, sin * ex + cos * ey];
  };

  const segments: Segment[] = [];
  for (let i = 0; i < count; i++) {
    const t1 = theta1 + i * delta;
    const t2 = t1 + delta;
    const p1 = pointAt(t1);
    const p2 = i === count - 1 ? end : pointAt(t2);
    const d1 = tangentAt(t1);
    const d2 = tangentAt(t2);
    segments.push({
      type: 'C',
      points: [[p1[0] + k * d1[0], p1[1] + k * d1[1]], [p2[0] - k * d2[0], p2[1] - k * d2[1]], p2],
    });
  }
  return segments;
}

function solveQuadratic(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-12) {
    return Math.abs(b) < 1e-12 ? [] : [-c / b];
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const sqrt = Math.sqrt(disc);
  return [(-b + sqrt) / (2 * a), (-b - sqrt) / (2 * a)];
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function quadAt(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

function axisExtrema(start: Point, segment: Segment, axis: 0 | 1): number[] {
  const p0 = start[axis];
  if (segment.type === 'C') {
    const [p1, p2, p3] = segment.points.map((p) => p[axis]);
    const c = p1 - p0;
    const d = p2 - p1;
    const e = p3 - p2;
    return solveQuadratic(c - 2 * d + e, 2 * (d - c), c)
      .filter((t) => t > 0 && t < 1)
      .map((t) => cubicAt(p0, p1, p2, p3, t));
  }
  if (segment.type === 'Q') {
    const [p1, p2] = segment.points.map((p) => p[axis]);
    const denom = p0 - 2 * p1 + p2;
    if (Math.abs(denom) < 1e-12) return [];
    const t = (p0 - p1) / denom;
    return t > 0 && t < 1 ? [quadAt(p0, p1, p2, t)] : [];
  }
  return [];
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1e4) / 1e4;
  return String(rounded === 0 ? 0 : rounded);
}

export function normalizeShapePath(d: string): NormalizedShapePath | null {
  const segments = parseToAbsolute(d);
  if (!segments || !segments.some((s) => s.type === 'L' || s.type === 'C' || s.type === 'Q')) {
    return null;
  }

  const xs: number[] = [];
  const ys: number[] = [];
  let current: Point = [0, 0];
  let subpathStart: Point = [0, 0];
  for (const segment of segments) {
    if (segment.type === 'Z') {
      current = subpathStart;
      continue;
    }
    const end = segment.points[segment.points.length - 1];
    xs.push(end[0], ...axisExtrema(current, segment, 0));
    ys.push(end[1], ...axisExtrema(current, segment, 1));
    if (segment.type === 'M') subpathStart = end;
    current = end;
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX;
  const height = Math.max(...ys) - minY;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < MIN_SIZE || height < MIN_SIZE) {
    return null;
  }

  const parts: string[] = [];
  for (const segment of segments) {
    if (segment.type === 'Z') {
      parts.push('Z');
      continue;
    }
    const coords: string[] = [];
    for (const [x, y] of segment.points) {
      const nx = (x - minX) / width;
      const ny = (y - minY) / height;
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;
      coords.push(`${formatNumber(nx)} ${formatNumber(ny)}`);
    }
    parts.push(segment.type + coords.join(' '));
  }

  const aspectRatio = width / height;
  if (!Number.isFinite(aspectRatio)) return null;

  return { path: parts.join(' '), aspectRatio };
}

export function scaleShapePath(path: string, width: number, height: number): string {
  const tokens = path.match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  const parts: string[] = [];
  let coords: string[] = [];
  let command = '';

  const flush = () => {
    if (command) parts.push(command + coords.join(' '));
  };

  for (const token of tokens) {
    if (/[MLCQZ]/.test(token)) {
      flush();
      command = token;
      coords = [];
    } else {
      const scale = coords.length % 2 === 0 ? width : height;
      coords.push(formatNumber(Number(token) * scale));
    }
  }
  flush();

  return parts.join(' ');
}
