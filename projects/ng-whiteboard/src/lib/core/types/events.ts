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
  ElementAdded = 'elementAdded',
  ElementUpdated = 'elementUpdated',
  ElementSelected = 'elementSelected',
  ElementDeleted = 'elementDeleted',
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

  [WhiteboardEvent.ElementAdded]: WhiteboardElement;
  [WhiteboardEvent.ElementUpdated]: WhiteboardElement;
  [WhiteboardEvent.ElementSelected]: WhiteboardElement | null;
  [WhiteboardEvent.ElementDeleted]: WhiteboardElement;

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
  | [WhiteboardEvent.ElementAdded]
  | [WhiteboardEvent.ElementUpdated]
  | [WhiteboardEvent.ElementSelected]
  | [WhiteboardEvent.ElementDeleted]
  | [WhiteboardEvent.Undo]
  | [WhiteboardEvent.Redo]
  | [WhiteboardEvent.Clear]
  | [WhiteboardEvent.DataChange]
  | [WhiteboardEvent.Save]
  | [WhiteboardEvent.ImageAdded]
  | [WhiteboardEvent.ToolChange]
  | [WhiteboardEvent.ConfigChange];
