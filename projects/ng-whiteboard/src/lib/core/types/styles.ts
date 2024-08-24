export enum ColorStyle {
  White = 'White',
  LightGray = 'LightGray',
  Gray = 'Gray',
  Black = 'Black',
  Green = 'Green',
  Cyan = 'Cyan',
  Blue = 'Blue',
  Indigo = 'Indigo',
  Violet = 'Violet',
  Red = 'Red',
  Orange = 'Orange',
  Yellow = 'Yellow',
}

export enum SizeStyle {
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
}

export enum DashStyle {
  Brush = 'Brush',
  Solid = 'Solid',
  Dashed = 'Dashed',
  Dotted = 'Dotted',
}
export type ShapeStyles = {
  color: ColorStyle;
  size: SizeStyle;
  dash: DashStyle;
  isFilled?: boolean;
  scale?: number;
};
export const defaultStyle: ShapeStyles = {
  color: ColorStyle.Black,
  size: SizeStyle.Small,
  isFilled: false,
  dash: DashStyle.Brush,
};
