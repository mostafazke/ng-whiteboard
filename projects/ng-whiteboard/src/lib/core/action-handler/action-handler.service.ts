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

      case ActionType.ToggleGrid:
        this._dataService.toggleGrid();
        break;

      case ActionType.AddImage:
        this._dataService.addImage(action.payload);
        break;

      case ActionType.Batch:
        action.payload.forEach((batchAction) => this.handleAction(batchAction));
        break;
    }
  }
}
