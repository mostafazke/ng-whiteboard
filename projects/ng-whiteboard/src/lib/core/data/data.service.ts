import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WhiteboardElement } from '../../models';

@Injectable()
export class DataService {
  private undoStack: WhiteboardElement[][] = [];
  private redoStack: WhiteboardElement[][] = [];
  private _data: BehaviorSubject<WhiteboardElement[]> = new BehaviorSubject<WhiteboardElement[]>([]);
  private _initialData: WhiteboardElement[] = [];

  data$ = this._data.asObservable();

  setData(data: WhiteboardElement[]) {
    this._data.next(data);
    this._initialData = JSON.parse(JSON.stringify(data));
  }

  getData(): WhiteboardElement[] {
    return this._data.getValue();
  }

  addElement(element: WhiteboardElement) {
    const currentData = this.getData();
    currentData.push(element);
    this._data.next(currentData);
    this.pushToUndo();
  }

  removeElement(element: WhiteboardElement) {
    const currentData = this.getData();
    const index = currentData.indexOf(element);
    if (index > -1) {
      currentData.splice(index, 1);
      this._data.next(currentData);
      this.pushToUndo();
    }
  }

  updateElement(element: WhiteboardElement) {
    const currentData = this.getData();
    const index = currentData.findIndex((el) => el.id === element.id);
    if (index > -1) {
      currentData[index] = element;
      this._data.next(currentData);
      this.pushToUndo();
    }
  }

  clearDraw() {
    this.setData([]);
    this.pushToUndo();
  }

  undoDraw(): boolean {
    if (!this.undoStack.length) {
      return false;
    }
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState as WhiteboardElement[]);
    if (this.undoStack.length) {
      this.setData(JSON.parse(JSON.stringify(this.undoStack[this.undoStack.length - 1])));
    } else {
      this.setData(JSON.parse(JSON.stringify(this._initialData)));
    }
    return true;
  }

  redoDraw(): boolean {
    if (!this.redoStack.length) {
      return false;
    }
    const currentState = this.redoStack.pop() as WhiteboardElement[];
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    this.setData(currentState);
    return true;
  }

  pushToUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.getData())));
  }
}
