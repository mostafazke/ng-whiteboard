import { PointerInfo } from "../core/types/types";

export interface ToolHandlers {
  [key: string]: (info: PointerInfo) => void;
}
