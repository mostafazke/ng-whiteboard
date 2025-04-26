import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { bufferTime, filter } from 'rxjs/operators';
import { ActionType, Priority, WhiteboardAction } from './core/types/actions';
import { FormatType, ToolType, WhiteboardElement } from './core/types';
import { PRIORITY_WEIGHTS } from './core/constants';

@Injectable({
  providedIn: 'root',
})
export class NgWhiteboardService {
  private readonly BUFFER_SIZE = 1000;
  private readonly BATCH_INTERVAL = 16;

  private readonly actionDispatcher = new Subject<WhiteboardAction>();
  private readonly priorityDispatcher = new BehaviorSubject<{ action: WhiteboardAction; priority: Priority }[]>([]);
  private readonly actionBuffer: WhiteboardAction[] = [];

  // Observable that emits batches of actions after a specified interval
  actions$ = this.actionDispatcher.pipe(
    bufferTime(this.BATCH_INTERVAL),
    filter((actions) => actions.length > 0)
  );

  // Public API

  /**
   * Add a new element to the whiteboard.
   * @param {WhiteboardElement} element - The element to add to the whiteboard.
   * @returns {void}
   */
  public addElement(element: WhiteboardElement): void {
    this.dispatchWithPriority(
      {
        type: ActionType.AddElement,
        payload: { element },
      },
      'normal'
    );
  }

  /**
   * Add an image to the whiteboard.
   * @param {string | ArrayBuffer} image - The image to add, either as a base64 string or an ArrayBuffer.
   * @param {number} [x] - The x-coordinate where the image should be placed (optional).
   * @param {number} [y] - The y-coordinate where the image should be placed (optional).
   * @returns {void}
   */
  public addImage(image: string | ArrayBuffer, x?: number, y?: number): void {
    this.dispatchWithPriority(
      {
        type: ActionType.AddImage,
        payload: { image, x, y },
      },
      'normal'
    );
  }

  /**
   * Center the canvas.
   * This method centers the canvas within the whiteboard area.
   */
  public centerCanvas(): void {
    this.dispatchWithPriority({ type: ActionType.CenterCanvas }, 'normal');
  }

  /**
   * Clear the whiteboard.
   * This method removes all elements from the whiteboard, effectively resetting it to a blank state.
   */
  public clear(): void {
    this.dispatchWithPriority({ type: ActionType.Clear }, 'high');
  }

  /**
   * Dispatch a batch of actions.
   * @param {WhiteboardAction[]} actions - An array of actions to be dispatched. Each action should conform to the WhiteboardAction interface.
   */
  public dispatchBatch(actions: WhiteboardAction[]): void {
    this.dispatchWithPriority(
      {
        type: ActionType.Batch,
        payload: actions,
      },
      'low'
    );
  }

  /**
   * Make the canvas full screen.
   * This method sets the canvas to full screen mode.
   */
  public fullScreen(): void {
    this.dispatchWithPriority({ type: ActionType.FullScreen }, 'normal');
  }

  /**
   * Remove an element from the whiteboard.
   * @param {string[]} ids - The IDs of the elements to remove from the whiteboard.
   */
  public removeElements(ids: string[]): void {
    this.dispatchWithPriority(
      {
        type: ActionType.RemoveElements,
        payload: { ids },
      },
      'normal'
    );
  }

  /**
   * Undo the last action performed on the whiteboard.
   * This method reverts the whiteboard to the state before the last action was performed.
   */
  public undo(): void {
    this.dispatchWithPriority({ type: ActionType.Undo }, 'high');
  }

  /**
   * Redo the last undone action.
   * This method reapplies the last action that was undone, restoring the whiteboard to the state after that action was originally performed.
   */
  public redo(): void {
    this.dispatchWithPriority({ type: ActionType.Redo }, 'high');
  }

  /**
   * Save the current state of the whiteboard.
   * @param format - The format in which to save the whiteboard (e.g., Base64, JSON).
   * @param name - The name of the saved whiteboard.
   */
  public save(format = FormatType.Base64, name = 'New board'): void {
    this.dispatchWithPriority(
      {
        type: ActionType.Save,
        payload: { format, name },
      },
      'normal'
    );
  }

  /**
   * Select element(s) on the whiteboard.
   * @param {WhiteboardElement | WhiteboardElement[] | string | string[]} elementsOrIds - The element(s) or their IDs to select.
   * This can be a single element, an array of elements, a single ID, or an array of IDs.
   */
  public selectElements(elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[]): void {
    this.dispatchWithPriority(
      {
        type: ActionType.SelectElements,
        payload: { elementsOrIds },
      },
      'normal'
    );
  }

  /**
   * Deselect an element on the whiteboard.
   * @param {WhiteboardElement | string} elementOrId - The element or its ID to deselect.
   */
  public deselectElement(elementOrId: WhiteboardElement | string): void {
    this.dispatchWithPriority(
      {
        type: ActionType.DeselectElement,
        payload: { elementOrId },
      },
      'normal'
    );
  }

  /**
   * Toggle the selection of an element on the whiteboard.
   * @param {WhiteboardElement | string} elementOrId - The element or its ID to toggle selection.
   * If the element is already selected, it will be deselected; otherwise, it will be selected.
   */
  public toggleSelection(elementOrId: WhiteboardElement | string): void {
    this.dispatchWithPriority(
      {
        type: ActionType.ToggleSelection,
        payload: { elementOrId },
      },
      'normal'
    );
  }

  /**
   * Select all elements on the whiteboard.
   * This method selects all elements currently present on the whiteboard.
   */
  public selectAll(): void {
    this.dispatchWithPriority({ type: ActionType.SelectAll }, 'normal');
  }

  /**
   * Clear the selection of elements on the whiteboard.
   * This method clears any currently selected elements on the whiteboard.
   */
  public clearSelection(): void {
    this.dispatchWithPriority({ type: ActionType.ClearSelection }, 'normal');
  }

  /**
   * Set the active tool on the whiteboard.
   * @param {ToolType} tool - The tool to set as active. Expected values are defined in the ToolType enum.
   */
  public setActiveTool(tool: ToolType): void {
    this.dispatchWithPriority({ type: ActionType.SetActiveTool, payload: { tool } }, 'normal');
  }

  /**
   * Set the dimensions of the canvas.
   * @param {number} width - The width of the canvas in pixels.
   * @param {number} height - The height of the canvas in pixels.
   */
  public setCanvasDimensions(width: number, height: number): void {
    this.dispatchWithPriority(
      {
        type: ActionType.SetCanvasDimensions,
        payload: { width, height },
      },
      'normal'
    );
  }

  /**
   * Set the position of the canvas.
   * @param {number} x - The x-coordinate of the canvas position.
   * @param {number} y - The y-coordinate of the canvas position.
   */
  public setCanvasPosition(x: number, y: number): void {
    this.dispatchWithPriority(
      {
        type: ActionType.SetCanvasPosition,
        payload: { x, y },
      },
      'normal'
    );
  }

  /**
   * Toggle the grid on the whiteboard.
   * This method toggles the visibility of the grid on the whiteboard.
   */
  public toggleGrid(): void {
    this.dispatchWithPriority({ type: ActionType.ToggleGrid }, 'normal');
  }

  /**
   * Update an existing element on the whiteboard.
   * @param {WhiteboardElement} element - The element to update on the whiteboard.
   * The element should contain the updated properties and values.
   */
  public updateElement(element: WhiteboardElement): void {
    this.dispatchWithPriority(
      {
        type: ActionType.UpdateElement,
        payload: { element },
      },
      'normal'
    );
  }

  /**
   * Update the selected element on the whiteboard.
   * @param {Partial<WhiteboardElement>} partialElement - An object containing the properties to update on the selected element.
   * The properties can include any subset of the properties of a WhiteboardElement.
   */
  public updateSelectedElements(partialElement: Partial<WhiteboardElement>): void {
    this.dispatchWithPriority(
      {
        type: ActionType.UpdateSelectedElements,
        payload: { partialElement },
      },
      'normal'
    );
  }

  private isProcessing = false;

  // Service message commands
  public dispatchWithPriority(action: WhiteboardAction, priority: Priority = 'normal'): void {
    const currentQueue = this.priorityDispatcher.value;
    const newAction = { action, priority };
    const index = currentQueue.findIndex(
      (item) => this.getPriorityWeight(item.priority) < this.getPriorityWeight(priority)
    );
    const updatedQueue =
      index === -1
        ? [...currentQueue, newAction]
        : [...currentQueue.slice(0, index), newAction, ...currentQueue.slice(index)];

    this.priorityDispatcher.next(updatedQueue);
    if (!this.isProcessing) {
      this.processNextAction();
    }
  }
  private dispatch(action: WhiteboardAction): void {
    this.manageBuffer(action);
    this.actionDispatcher.next(action);
  }

  private getPriorityWeight(priority: Priority): number {
    return PRIORITY_WEIGHTS[priority];
  }

  private manageBuffer(action: WhiteboardAction): void {
    if (this.actionBuffer.length >= this.BUFFER_SIZE) {
      this.actionBuffer.shift();
    }
    this.actionBuffer.push(action);
  }

  private processNextAction(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const process = () => {
      const queue = this.priorityDispatcher.value;
      if (queue.length > 0) {
        const { action } = queue[0];
        this.dispatch(action);
        this.priorityDispatcher.next(queue.slice(1));
        process();
      } else {
        this.isProcessing = false;
      }
    };

    process();
  }
}
