import { LineCap, LineJoin } from './types';

export interface WhiteboardElementStyle {
  strokeWidth?: number;
  strokeColor?: string;
  fill?: string;

  lineJoin?: LineJoin;
  lineCap?: LineCap;

  fontSize?: number;
  fontFamily?: string;

  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold';
  color?: string;

  dasharray?: string;
  dashoffset?: number;
}

export const defaultElementStyle: WhiteboardElementStyle = {
  strokeWidth: 2,
  strokeColor: '#000000',
  fill: '#000000',

  lineJoin: LineJoin.Miter,
  lineCap: LineCap.Butt,

  dasharray: '',
  dashoffset: 0,
};

export const defaultTextElementStyle: WhiteboardElementStyle = {
  ...defaultElementStyle,
  fontSize: 14,
  fontFamily: 'Arial',
  fontStyle: 'normal',
  fontWeight: 'normal',
  color: '#000000',
};
