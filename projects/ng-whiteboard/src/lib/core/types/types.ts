export enum FormatType {
  Png = 'png',
  Jpeg = 'jpeg',
  Svg = 'svg',
  Base64 = 'base64',
}

export enum AlignmentType {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Top = 'top',
  Middle = 'middle',
  Bottom = 'bottom',
  DistributeHorizontally = 'distribute-horizontally',
  DistributeVertically = 'distribute-vertically',
}

export enum LineCap {
  Round = 'round',
  Butt = 'butt',
  Square = 'square',
}

export enum LineJoin {
  Round = 'round',
  Miter = 'miter',
  Bevel = 'bevel',
  MiterClip = 'miter-clip',
}

export interface AddImage {
  image: string | ArrayBuffer;
  x?: number;
  y?: number;
}

export enum Direction {
  NW = 'nw',
  N = 'n',
  NE = 'ne',
  E = 'e',
  SE = 'se',
  S = 's',
  SW = 'sw',
  W = 'w',
}

export interface ResizeElement {
  direction: Direction;
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  handles: {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
    rotateHandle: Point;
  };
  rotation: number;
}
