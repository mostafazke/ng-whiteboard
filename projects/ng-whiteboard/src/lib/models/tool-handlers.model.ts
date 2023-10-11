export interface ToolHandlers {
  [key: string]: (info: PointerEvent) => void;
}
