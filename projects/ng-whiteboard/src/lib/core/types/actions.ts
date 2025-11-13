import { FormatType, AddImage, WhiteboardElement, ToolType, WhiteboardConfig } from '.';

export enum ActionType {
  Save = 'save',
  Undo = 'undo',
  Redo = 'redo',
  Clear = 'clear',
  AddImage = 'addImage',
  ToggleGrid = 'toggleGrid',
  AddElement = 'addElement',
  UpdateElement = 'updateElement',
  RemoveElements = 'removeElements',
  RemoveSelectedElements = 'removeSelectedElements',
  SelectElements = 'selectElements',
  ToggleSelection = 'toggleSelection',
  DeselectElement = 'deselectElement',
  SelectAll = 'selectAll',
  ClearSelection = 'clearSelection',
  UpdateSelectedElements = 'updateSelectedElements',
  SetActiveTool = 'setActiveTool',
  SetCanvasDimensions = 'setCanvasDimensions',
  SetCanvasPosition = 'setCanvasPosition',
  UpdateGridTranslation = 'updateGridTranslation',
  UpdateElementsTranslation = 'updateElementsTranslation',
  FullScreen = 'fullScreen',
  CenterCanvas = 'centerCanvas',
  ZoomIn = 'zoomIn',
  ZoomOut = 'zoomOut',
  Zoom = 'zoom',
  ZoomToFit = 'zoomToFit',
  ZoomToSelection = 'zoomToSelection',
  ResetZoom = 'resetZoom',
  SetBackgroundColor = 'setBackgroundColor',
  UpdateConfig = 'updateConfig',
  Batch = 'batch',
  // Layer Management Actions
  AddLayer = 'addLayer',
  RemoveLayer = 'removeLayer',
  RenameLayer = 'renameLayer',
  SetActiveLayer = 'setActiveLayer',
  ToggleLayerVisibility = 'toggleLayerVisibility',
  ToggleLayerLock = 'toggleLayerLock',
  SetLayerOpacity = 'setLayerOpacity',
  SetLayerBlendMode = 'setLayerBlendMode',
  MoveLayerUp = 'moveLayerUp',
  MoveLayerDown = 'moveLayerDown',
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
  | { type: ActionType.RemoveElements; payload: { ids: string[] } }
  | { type: ActionType.RemoveSelectedElements }
  | {
      type: ActionType.SelectElements;
      payload: { elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[] };
    }
  | { type: ActionType.ToggleSelection; payload: { elementOrId: WhiteboardElement | string } }
  | { type: ActionType.DeselectElement; payload: { elementOrId: WhiteboardElement | string } }
  | { type: ActionType.SelectAll }
  | { type: ActionType.ClearSelection }
  | { type: ActionType.UpdateSelectedElements; payload: { partialElement: Partial<WhiteboardElement> } }
  | { type: ActionType.SetActiveTool; payload: { tool: ToolType } }
  | { type: ActionType.SetCanvasDimensions; payload: { width: number; height: number } }
  | { type: ActionType.SetCanvasPosition; payload: { x: number; y: number } }
  | { type: ActionType.UpdateGridTranslation; payload: { dx: number; dy: number } }
  | { type: ActionType.UpdateElementsTranslation; payload: { dx: number; dy: number } }
  | { type: ActionType.FullScreen }
  | { type: ActionType.CenterCanvas }
  | { type: ActionType.ZoomIn }
  | { type: ActionType.ZoomOut }
  | { type: ActionType.Zoom; payload: { zoom: number } }
  | { type: ActionType.ZoomToFit }
  | { type: ActionType.ZoomToSelection }
  | { type: ActionType.ResetZoom }
  | { type: ActionType.SetBackgroundColor; payload: { color: string } }
  | { type: ActionType.UpdateConfig; payload: { config: Partial<WhiteboardConfig> } }
  | { type: ActionType.Batch; payload: WhiteboardAction[] }
  // Layer Management Actions
  | { type: ActionType.AddLayer; payload: { name?: string } }
  | { type: ActionType.RemoveLayer; payload: { id: string } }
  | { type: ActionType.RenameLayer; payload: { id: string; name: string } }
  | { type: ActionType.SetActiveLayer; payload: { id: string } }
  | { type: ActionType.ToggleLayerVisibility; payload: { id: string } }
  | { type: ActionType.ToggleLayerLock; payload: { id: string } }
  | { type: ActionType.SetLayerOpacity; payload: { id: string; opacity: number } }
  | { type: ActionType.SetLayerBlendMode; payload: { id: string; blendMode: string } }
  | { type: ActionType.MoveLayerUp; payload: { id: string } }
  | { type: ActionType.MoveLayerDown; payload: { id: string } };

export type Priority = 'high' | 'normal' | 'low';
