import { WhiteboardConfig } from './config';
import { WhiteboardElement } from './elements';
import { ToolType } from './tools';

/** Event types that can occur in ng-whiteboard. */
export enum WhiteboardEvent {
  Ready = 'ready',
  Destroyed = 'destroyed',
  DrawStart = 'drawStart',
  Drawing = 'drawing',
  DrawEnd = 'drawEnd',
  ElementsAdded = 'elementsAdded',
  ElementsUpdated = 'elementsUpdated',
  ElementsSelected = 'elementsSelected',
  ElementsRemoved = 'elementsRemoved',
  ElementDoubleClicked = 'elementDoubleClicked',
  Undo = 'undo',
  Redo = 'redo',
  Clear = 'clear',
  DataChange = 'dataChange',
  Save = 'save',
  ImageAdded = 'imageAdded',
  ToolChange = 'toolChange',
  ConfigChange = 'configChange',
  ZoomChange = 'zoomChange',
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
  [WhiteboardEvent.ElementsRemoved]: WhiteboardElement[];
  [WhiteboardEvent.ElementDoubleClicked]: { target: EventTarget | null; clientX: number; clientY: number };

  [WhiteboardEvent.Undo]: void;
  [WhiteboardEvent.Redo]: void;
  [WhiteboardEvent.Clear]: void;
  [WhiteboardEvent.DataChange]: WhiteboardElement[];
  [WhiteboardEvent.Save]: string;

  [WhiteboardEvent.ImageAdded]: string | ArrayBuffer;

  [WhiteboardEvent.ToolChange]: ToolType;
  [WhiteboardEvent.ConfigChange]: WhiteboardConfig;
  [WhiteboardEvent.ZoomChange]: { zoom: number };
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
  | [WhiteboardEvent.ElementsRemoved]
  | [WhiteboardEvent.ElementDoubleClicked]
  | [WhiteboardEvent.Undo]
  | [WhiteboardEvent.Redo]
  | [WhiteboardEvent.Clear]
  | [WhiteboardEvent.DataChange]
  | [WhiteboardEvent.Save]
  | [WhiteboardEvent.ImageAdded]
  | [WhiteboardEvent.ToolChange]
  | [WhiteboardEvent.ConfigChange]
  | [WhiteboardEvent.ZoomChange];
