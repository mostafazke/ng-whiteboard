export enum ToolType {
  Hand = 'hand',
  Select = 'select',
  Pen = 'pen',
  Rectangle = 'rectangle',
  Image = 'image',
  Line = 'line',
  Arrow = 'arrow',
  Ellipse = 'ellipse',
  Text = 'text',
  Eraser = 'eraser',
}

export type Tool = {
  type: ToolType;
  activate(): void;
  deactivate(): void;
  handlePointerDown?(event: PointerEvent): void;
  handlePointerMove?(event: PointerEvent): void;
  handlePointerUp?(event: PointerEvent): void;
  onActivate?(): void;
  onDeactivate?(): void;
};
