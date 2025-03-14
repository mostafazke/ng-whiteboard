import { LineCap, LineJoin, RubberBox } from '.';

export interface WhiteboardConfig {
  drawingEnabled: boolean;
  canvasWidth: number;
  canvasHeight: number;
  fullScreen: boolean;
  center: boolean;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  lineJoin: LineJoin;
  lineCap: LineCap;
  fill: string;
  zoom: number;
  fontFamily: string;
  fontSize: number;
  dasharray: string;
  dashoffset: number;
  x: number;
  y: number;
  enableGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  rubberBox: RubberBox;
  gridTranslation: { x: number; y: number };
  elementsTranslation: { x: number; y: number };
}
