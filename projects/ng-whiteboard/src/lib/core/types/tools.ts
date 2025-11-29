import { PointerInfo } from './pointer';

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

export interface ToolConfig {
  id: string;
  type: ToolType;
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  order?: number;
  permissions?: string[];
  customData?: Record<string, unknown>;
}

export type Tool = {
  type: ToolType;
  activate(): void;
  deactivate(): void;
  handlePointerDown?(event: PointerInfo): void;
  handlePointerMove?(event: PointerInfo): void;
  handlePointerUp?(event: PointerInfo): void;
  handleKeyDown?(event: KeyboardEvent): void;
  handleKeyUp?(event: KeyboardEvent): void;
  onActivate?(): void;
  onDeactivate?(): void;
  isEditing?: boolean;
};
