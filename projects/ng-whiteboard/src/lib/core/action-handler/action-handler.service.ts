import { Injectable } from '@angular/core';
import { DataService } from '../data/data.service';
import { NgWhiteboardService } from '../../ng-whiteboard.service';
import { filter } from 'rxjs';
import { ActionType, WhiteboardAction } from '../types/actions';

@Injectable()
export class ActionHandlerService {
  constructor(private _dataService: DataService, private _whiteboardService: NgWhiteboardService) {
    this.initializeActionListeners();
  }

  private initializeActionListeners(): void {
    this._whiteboardService.actions$.pipe(filter((actions) => actions.length > 0)).subscribe((actions) => {
      actions.forEach((action) => this.handleAction(action));
    });
  }

  private handleAction(action: WhiteboardAction): void {
    switch (action.type) {
      case ActionType.Undo:
        this._dataService.undo();
        break;
      case ActionType.Redo:
        this._dataService.redo();
        break;
      case ActionType.Clear:
        this._dataService.clear();
        break;
      case ActionType.UpdateSelectedElement:
        this._dataService.updateSelectedElement(action.payload.partialElement);
        break;
      case ActionType.Save: {
        const { format, name } = action.payload;
        this._dataService.save(format, name);
        break;
      }
      case ActionType.AddElement:
        this._dataService.addElement(action.payload.element);
        break;
      case ActionType.UpdateElement:
        this._dataService.updateElement(action.payload.element);
        break;
      case ActionType.RemoveElements:
        this._dataService.removeElements(action.payload.ids);
        break;
      case ActionType.SelectElement:
        this._dataService.selectElement(action.payload.element);
        break;
      case ActionType.SetActiveTool:
        this._dataService.setActiveTool(action.payload.tool);
        break;
      case ActionType.ToggleGrid:
        this._dataService.toggleGrid();
        break;
      case ActionType.AddImage:
        this._dataService.addImage(action.payload);
        break;
      case ActionType.SetCanvasDimensions: {
        const { width, height } = action.payload;
        this._dataService.setCanvasDimensions(width, height);
        break;
      }
      case ActionType.SetCanvasPosition: {
        const { x, y } = action.payload;
        this._dataService.setCanvasPosition(x, y);
        break;
      }
      case ActionType.UpdateGridTranslation: {
        const { dx, dy } = action.payload;
        this._dataService.updateGridTranslation(dx, dy);
        break;
      }
      case ActionType.UpdateElementsTranslation: {
        const { dx: elementDx, dy: elementDy } = action.payload;
        this._dataService.updateElementsTranslation(elementDx, elementDy);
        break;
      }
      case ActionType.FullScreen:
        this._dataService.fullScreen();
        break;
      case ActionType.CenterCanvas:
        this._dataService.centerCanvas();
        break;
      case ActionType.Batch:
        action.payload.forEach((batchAction) => this.handleAction(batchAction));
        break;
    }
  }
}
