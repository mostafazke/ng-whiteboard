import { LineCap, LineJoin } from './types';
import { StrokeOptions } from '../utils/drawing/stroke-types';

/** Available pen types. */
export enum PenType {
  Pen = 'pen',
  Marker = 'marker',
  Highlighter = 'highlighter',
  Brush = 'brush',
  Pencil = 'pencil',
}

/** Pen thickness options. */
export enum PenThickness {
  ExtraFine = 'extra-fine',
  Fine = 'fine',
  Medium = 'medium',
  Thick = 'thick',
  ExtraThick = 'extra-thick',
}

/** Complete pen preset configuration. */
export interface PenPreset {
  id: string;
  name: string;
  type: PenType;
  thickness: PenThickness;

  strokeColor?: string;
  strokeWidth?: number;
  lineCap?: LineCap;
  lineJoin?: LineJoin;
  dasharray?: string;
  dashoffset?: number;
  opacity?: number;

  strokeOptions: StrokeOptions;

  display: {
    description: string;
    icon?: string;
    preview?: string;
  };
}

/** Base stroke options for smooth pen. */
const smoothPenOptions: StrokeOptions = {
  size: 3,
  thinning: 0.8,
  smoothing: 0.9,
  streamline: 0.8,
  simulatePressure: true,
  easing: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  start: { cap: true, taper: 0.5 },
  end: { cap: true, taper: 0.6 },
};

/** Marker stroke options with uniform thickness. */
const markerOptions: StrokeOptions = {
  size: 6,
  thinning: 0.0,
  smoothing: 0.2,
  streamline: 0.3,
  simulatePressure: false,
  easing: () => 1.0,
  start: { cap: false, taper: false },
  end: { cap: false, taper: false },
};

/** Highlighter stroke options with wide rectangular shape. */
const highlighterOptions: StrokeOptions = {
  size: 18,
  thinning: 0.05,
  smoothing: 0.1,
  streamline: 0.1,
  simulatePressure: false,
  easing: (t: number) => t,
  start: { cap: false, taper: false },
  end: { cap: false, taper: false },
};

/** Brush stroke options with high expressiveness. */
const brushOptions: StrokeOptions = {
  size: 14,
  thinning: 0.85,
  smoothing: 0.95,
  streamline: 0.9,
  simulatePressure: true,
  easing: (t: number) => Math.pow(t, 1.8),
  start: { cap: true, taper: 0.7 },
  end: { cap: true, taper: 0.8 },
};

/** Pencil stroke options with rough texture. */
const pencilOptions: StrokeOptions = {
  size: 1.5,
  thinning: 0.6,
  smoothing: 0.15,
  streamline: 0.1,
  simulatePressure: true,
  easing: (t: number) => {
    const base = t * 0.7 + 0.3;
    return Math.min(1.0, base + Math.sin(t * 20) * 0.1);
  },
  start: { cap: true, taper: 0.1 },
  end: { cap: true, taper: 0.2 },
};

/** How a pen type turns the configured stroke width into a rendered stroke. */
export interface PenTypeStyle {
  /** `outline` fills a variable-width shape; `stroke` draws a uniform centerline. */
  render: 'outline' | 'stroke';
  /** Multiplier applied to the configured stroke width. */
  sizeFactor: number;
  minSize: number;
  lineCap: LineCap;
  lineJoin: LineJoin;
  opacity?: number;
  blendMode?: string;
  /** Id of an SVG filter defined by the canvas. */
  filter?: string;
  strokeOptions: StrokeOptions;
}

export const PENCIL_FILTER_ID = 'wb-pencil-texture';

export const PEN_TYPE_STYLES: Record<PenType, PenTypeStyle> = {
  [PenType.Pen]: {
    render: 'outline',
    sizeFactor: 1.6,
    minSize: 2,
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      thinning: 0.5,
      streamline: 0.5,
      simulatePressure: true,
      start: { cap: true, taper: 0.1 },
      end: { cap: true, taper: 0.15 },
    },
  },
  [PenType.Marker]: {
    render: 'stroke',
    sizeFactor: 2.5,
    minSize: 3,
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: { streamline: 0.45, simulatePressure: false },
  },
  [PenType.Highlighter]: {
    render: 'stroke',
    sizeFactor: 7,
    minSize: 12,
    lineCap: LineCap.Butt,
    lineJoin: LineJoin.Round,
    opacity: 0.4,
    blendMode: 'multiply',
    strokeOptions: { streamline: 0.6, simulatePressure: false },
  },
  [PenType.Brush]: {
    render: 'outline',
    sizeFactor: 5,
    minSize: 6,
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      thinning: 0.9,
      streamline: 0.7,
      simulatePressure: true,
      start: { cap: true, taper: 0.35 },
      end: { cap: true, taper: 0.5 },
    },
  },
  [PenType.Pencil]: {
    render: 'stroke',
    sizeFactor: 0.75,
    minSize: 1,
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    opacity: 0.9,
    filter: PENCIL_FILTER_ID,
    strokeOptions: { streamline: 0.25, simulatePressure: false },
  },
};

export function getPenTypeStyle(type: PenType | undefined): PenTypeStyle {
  return (type && PEN_TYPE_STYLES[type]) || PEN_TYPE_STYLES[PenType.Marker];
}

/** Size mappings for different thickness levels. */
export const THICKNESS_SIZES: Record<PenThickness, number> = {
  [PenThickness.ExtraFine]: 1,
  [PenThickness.Fine]: 3,
  [PenThickness.Medium]: 6,
  [PenThickness.Thick]: 12,
  [PenThickness.ExtraThick]: 20,
};

/** Stroke width mappings for different thickness levels. */
export const THICKNESS_STROKE_WIDTHS: Record<PenThickness, number> = {
  [PenThickness.ExtraFine]: 0.5,
  [PenThickness.Fine]: 1.5,
  [PenThickness.Medium]: 3,
  [PenThickness.Thick]: 6,
  [PenThickness.ExtraThick]: 10,
};

/** Predefined pen presets. */
export const PEN_PRESETS_MAP: Record<string, PenPreset> = {
  'pen-fine': {
    id: 'pen-fine',
    name: 'Fine Pen',
    type: PenType.Pen,
    thickness: PenThickness.Fine,
    strokeColor: '#000000',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Fine],
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      ...smoothPenOptions,
      size: THICKNESS_SIZES[PenThickness.Fine],
    },
    display: {
      description: 'Smooth fine pen for detailed drawing',
      icon: '✏️',
    },
  },
  'pen-medium': {
    id: 'pen-medium',
    name: 'Medium Pen',
    type: PenType.Pen,
    thickness: PenThickness.Medium,
    strokeColor: '#000000',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Medium],
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      ...smoothPenOptions,
      size: THICKNESS_SIZES[PenThickness.Medium],
    },
    display: {
      description: 'Standard pen for general use',
      icon: '🖊️',
    },
  },
  'pen-thick': {
    id: 'pen-thick',
    name: 'Thick Pen',
    type: PenType.Pen,
    thickness: PenThickness.Thick,
    strokeColor: '#000000',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Thick],
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      ...smoothPenOptions,
      size: THICKNESS_SIZES[PenThickness.Thick],
    },
    display: {
      description: 'Thick pen for bold strokes',
      icon: '🖍️',
    },
  },

  'marker-medium': {
    id: 'marker-medium',
    name: 'Medium Marker',
    type: PenType.Marker,
    thickness: PenThickness.Medium,
    strokeColor: '#2563eb',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Medium],
    lineCap: LineCap.Square,
    lineJoin: LineJoin.Miter,
    strokeOptions: {
      ...markerOptions,
      size: THICKNESS_SIZES[PenThickness.Medium],
    },
    display: {
      description: 'Consistent marker for clean lines',
      icon: '🖍️',
    },
  },
  'marker-thick': {
    id: 'marker-thick',
    name: 'Thick Marker',
    type: PenType.Marker,
    thickness: PenThickness.Thick,
    strokeColor: '#dc2626',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Thick],
    lineCap: LineCap.Square,
    lineJoin: LineJoin.Miter,
    strokeOptions: {
      ...markerOptions,
      size: THICKNESS_SIZES[PenThickness.Thick],
    },
    display: {
      description: 'Thick marker for emphasis',
      icon: '🖍️',
    },
  },

  'highlighter-medium': {
    id: 'highlighter-medium',
    name: 'Highlighter',
    type: PenType.Highlighter,
    thickness: PenThickness.Medium,
    strokeColor: '#fefc34',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.ExtraThick],
    lineCap: LineCap.Square,
    lineJoin: LineJoin.Miter,
    opacity: 0.4,
    strokeOptions: {
      ...highlighterOptions,
      size: THICKNESS_SIZES[PenThickness.ExtraThick],
    },
    display: {
      description: 'Translucent highlighter for emphasis',
      icon: '🖍️',
    },
  },

  'brush-medium': {
    id: 'brush-medium',
    name: 'Paint Brush',
    type: PenType.Brush,
    thickness: PenThickness.Medium,
    strokeColor: '#059669',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Thick],
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      ...brushOptions,
      size: THICKNESS_SIZES[PenThickness.Thick],
    },
    display: {
      description: 'Expressive brush with pressure sensitivity',
      icon: '🖌️',
    },
  },

  'pencil-fine': {
    id: 'pencil-fine',
    name: 'Pencil',
    type: PenType.Pencil,
    thickness: PenThickness.Fine,
    strokeColor: '#374151',
    strokeWidth: THICKNESS_STROKE_WIDTHS[PenThickness.Fine],
    lineCap: LineCap.Round,
    lineJoin: LineJoin.Round,
    strokeOptions: {
      ...pencilOptions,
      size: THICKNESS_SIZES[PenThickness.Fine],
    },
    display: {
      description: 'Natural pencil for sketching',
      icon: '✏️',
    },
  },
};

/** Array version for backward compatibility. */
export const PEN_PRESETS: PenPreset[] = Object.values(PEN_PRESETS_MAP);

export const PEN_PRESETS_BY_TYPE_THICKNESS: Record<string, PenPreset> = {};
Object.values(PEN_PRESETS_MAP).forEach((preset) => {
  const key = `${preset.type}-${preset.thickness}`;
  PEN_PRESETS_BY_TYPE_THICKNESS[key] = preset;
});

/** Default pen preset. */
export const DEFAULT_PEN_PRESET = PEN_PRESETS_MAP['pen-medium'];

/** Get preset by type and thickness combination. */
export function getPenPresetByTypeAndThickness(type: PenType, thickness: PenThickness): PenPreset | undefined {
  return PEN_PRESETS_BY_TYPE_THICKNESS[`${type}-${thickness}`];
}

/** Get first available preset for a pen type with preferred thickness. */
export function getPresetForType(type: PenType, preferredThickness: PenThickness = PenThickness.Medium): PenPreset {
  const preferred = getPenPresetByTypeAndThickness(type, preferredThickness);
  if (preferred) return preferred;

  const fallback = PEN_PRESETS.find((preset) => preset.type === type);
  return fallback || DEFAULT_PEN_PRESET;
}
