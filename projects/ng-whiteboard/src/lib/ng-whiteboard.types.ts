export class WhiteboardOptions {
  color = '#000000';
  backgroundColor = '#ffffff';
  size = '5px';
  linejoin: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs' = 'round';
  linecap: 'butt' | 'square' | 'round' = 'round';
}

export interface ActionStack {
  type: ActionType;
  line?: SVGPathElement;
  image?: SVGGElement;
}

export enum ActionType {
  Line,
  Image,
}

export type formatTypes = 'png' | 'jpeg' | 'svg' | 'base64';

export enum FormatType {
  Png = 'png',
  Jpeg = 'jpeg',
  Svg = 'svg',
  Base64 = 'base64',
}
