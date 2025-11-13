import { WhiteboardElement } from './elements';

export interface ClipboardData {
  elements: WhiteboardElement[];
  timestamp: number;
}

export interface ClipboardInfo {
  elementCount: number;
  timestamp: number;
}
