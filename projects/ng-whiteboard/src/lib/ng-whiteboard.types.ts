export class temp {
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

export class Shape {
  type: ActionType;
  src: string;

  constructor(type: ActionType, src: string) {
    this.type = type;
    this.src = src;
  }
}
export class Line extends Shape {
  stroke: string;
  size: string;
  linejoin: string;
  linecap: string;

  constructor(type: ActionType, src: string, stroke: string, size: string, linejoin: string, linecap: string) {
    super(type, src);
    this.stroke = stroke;
    this.size = size;
    this.linejoin = linejoin;
    this.linecap = linecap;
  }
}

export class Image extends Shape {
  stroke: string;
  size: string;
  linejoin: string;
  linecap: string;

  constructor(type: ActionType, src: string, stroke: string, size: string, linejoin: string, linecap: string) {
    super(type, src);
    this.stroke = stroke;
    this.size = size;
    this.linejoin = linejoin;
    this.linecap = linecap;
  }
}
