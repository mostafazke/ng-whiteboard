/** CSS Blend Modes. */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/** Blend mode display information for UI. */
export interface BlendModeOption {
  value: BlendMode;
  label: string;
  description: string;
  category: 'normal' | 'darken' | 'lighten' | 'contrast' | 'component';
}

/** Core Layer Model. */
export interface WhiteboardLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  elements: string[];
  opacity?: number;
  blendMode?: BlendMode;
}

/** Layer Management State. */
export interface LayerState {
  layers: WhiteboardLayer[];
  activeLayerId: string;
}

/** Available blend modes with metadata for UI display. */
export const BLEND_MODES: BlendModeOption[] = [
  { value: 'normal', label: 'Normal', description: 'Default blending', category: 'normal' },
  { value: 'multiply', label: 'Multiply', description: 'Darkens by multiplying colors', category: 'darken' },
  { value: 'darken', label: 'Darken', description: 'Keeps darkest colors', category: 'darken' },
  { value: 'color-burn', label: 'Color Burn', description: 'Increases contrast and darkens', category: 'darken' },
  { value: 'screen', label: 'Screen', description: 'Lightens by inverting and multiplying', category: 'lighten' },
  { value: 'lighten', label: 'Lighten', description: 'Keeps lightest colors', category: 'lighten' },
  { value: 'color-dodge', label: 'Color Dodge', description: 'Brightens and reduces contrast', category: 'lighten' },
  { value: 'overlay', label: 'Overlay', description: 'Combines multiply and screen', category: 'contrast' },
  { value: 'soft-light', label: 'Soft Light', description: 'Subtle version of overlay', category: 'contrast' },
  { value: 'hard-light', label: 'Hard Light', description: 'Intense version of overlay', category: 'contrast' },
  { value: 'difference', label: 'Difference', description: 'Subtracts colors', category: 'contrast' },
  {
    value: 'exclusion',
    label: 'Exclusion',
    description: 'Similar to difference but less contrast',
    category: 'contrast',
  },
  { value: 'hue', label: 'Hue', description: 'Uses hue of top layer', category: 'component' },
  { value: 'saturation', label: 'Saturation', description: 'Uses saturation of top layer', category: 'component' },
  { value: 'color', label: 'Color', description: 'Uses hue and saturation of top layer', category: 'component' },
  { value: 'luminosity', label: 'Luminosity', description: 'Uses luminosity of top layer', category: 'component' },
];
