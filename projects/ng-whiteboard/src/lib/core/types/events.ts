import { WhiteboardConfig } from './config';
import { WhiteboardElement } from './elements';
import { ToolType } from './tools';

/**
 * Enum representing the different types of events that can occur in ng-whiteboard.
 * These events are used to communicate the state changes and user interactions with the whiteboard.
 */
export enum WhiteboardEvent {
  Ready = 'ready',
  Destroyed = 'destroyed',
  DrawStart = 'drawStart',
  Drawing = 'drawing',
  DrawEnd = 'drawEnd',
  ElementsAdded = 'elementsAdded',
  ElementsUpdated = 'elementsUpdated',
  ElementsSelected = 'elementsSelected',
  ElementsDeleted = 'elementsDeleted',
  Undo = 'undo',
  Redo = 'redo',
  Clear = 'clear',
  DataChange = 'dataChange',
  Save = 'save',
  ImageAdded = 'imageAdded',
  ToolChange = 'toolChange',
  ConfigChange = 'configChange',
}

export type WhiteboardEventPayloads = {
  [WhiteboardEvent.Ready]: void;
  [WhiteboardEvent.Destroyed]: void;

  [WhiteboardEvent.DrawStart]: { x: number; y: number };
  [WhiteboardEvent.Drawing]: { x: number; y: number };
  [WhiteboardEvent.DrawEnd]: void;

  [WhiteboardEvent.ElementsAdded]: WhiteboardElement[];
  [WhiteboardEvent.ElementsUpdated]: WhiteboardElement[];
  [WhiteboardEvent.ElementsSelected]: WhiteboardElement[] | null;
  [WhiteboardEvent.ElementsDeleted]: void;

  [WhiteboardEvent.Undo]: void;
  [WhiteboardEvent.Redo]: void;
  [WhiteboardEvent.Clear]: void;
  [WhiteboardEvent.DataChange]: WhiteboardElement[];
  [WhiteboardEvent.Save]: string;

  [WhiteboardEvent.ImageAdded]: string | ArrayBuffer;

  [WhiteboardEvent.ToolChange]: ToolType;
  [WhiteboardEvent.ConfigChange]: Partial<WhiteboardConfig>;
};

export type WhiteboardEventType =
  | [WhiteboardEvent.Ready]
  | [WhiteboardEvent.Destroyed]
  | [WhiteboardEvent.DrawStart]
  | [WhiteboardEvent.Drawing]
  | [WhiteboardEvent.DrawEnd]
  | [WhiteboardEvent.ElementsAdded]
  | [WhiteboardEvent.ElementsUpdated]
  | [WhiteboardEvent.ElementsSelected]
  | [WhiteboardEvent.ElementsDeleted]
  | [WhiteboardEvent.Undo]
  | [WhiteboardEvent.Redo]
  | [WhiteboardEvent.Clear]
  | [WhiteboardEvent.DataChange]
  | [WhiteboardEvent.Save]
  | [WhiteboardEvent.ImageAdded]
  | [WhiteboardEvent.ToolChange]
  | [WhiteboardEvent.ConfigChange];
