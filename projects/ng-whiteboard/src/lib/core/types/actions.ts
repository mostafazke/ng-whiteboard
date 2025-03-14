import { FormatType, AddImage, WhiteboardElement, ToolType } from '.';

export enum ActionType {
  Save = 'save',
  Undo = 'undo',
  Redo = 'redo',
  Clear = 'clear',
  AddImage = 'addImage',
  ToggleGrid = 'toggleGrid',
  AddElement = 'addElement',
  UpdateElement = 'updateElement',
  removeElement = 'removeElement',
  SelectElement = 'selectElement',
  UpdateSelectedElement = 'updateSelectedElement',
  SetActiveTool = 'setActiveTool',
  SetCanvasDimensions = 'setCanvasDimensions',
  SetCanvasPosition = 'setCanvasPosition',
  UpdateGridTranslation = 'updateGridTranslation',
  UpdateElementsTranslation = 'updateElementsTranslation',
  FullScreen = 'fullScreen',
  CenterCanvas = 'centerCanvas',
  Batch = 'batch',
}

export type WhiteboardAction =
  | { type: ActionType.Save; payload: { format: FormatType; name: string } }
  | { type: ActionType.Undo }
  | { type: ActionType.Redo }
  | { type: ActionType.Clear }
  | { type: ActionType.AddImage; payload: AddImage }
  | { type: ActionType.ToggleGrid }
  | { type: ActionType.AddElement; payload: { element: WhiteboardElement } }
  | { type: ActionType.UpdateElement; payload: { element: WhiteboardElement } }
  | { type: ActionType.removeElement; payload: { id: string } }
  | { type: ActionType.SelectElement; payload: { element: WhiteboardElement | null } }
  | { type: ActionType.UpdateSelectedElement; payload: { partialElement: Partial<WhiteboardElement> } }
  | { type: ActionType.SetActiveTool; payload: { tool: ToolType } }
  | { type: ActionType.SetCanvasDimensions; payload: { width: number; height: number } }
  | { type: ActionType.SetCanvasPosition; payload: { x: number; y: number } }
  | { type: ActionType.UpdateGridTranslation; payload: { dx: number; dy: number } }
  | { type: ActionType.UpdateElementsTranslation; payload: { dx: number; dy: number } }
  | { type: ActionType.FullScreen }
  | { type: ActionType.CenterCanvas }
  | { type: ActionType.Batch; payload: WhiteboardAction[] };

export type Priority = 'high' | 'normal' | 'low';
