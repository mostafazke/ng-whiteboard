import { signal, Injectable } from '@angular/core';
import { WhiteboardElement } from '../types';

interface HistoryEntry {
  before: WhiteboardElement[];
  after: WhiteboardElement[];
  description: string;
  timestamp: number;
}

interface BatchHandle {
  execute: () => void;
  clear: () => void;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private readonly MAX_HISTORY = 50;

  // Signals
  private canUndoSignal = signal(false);
  private canRedoSignal = signal(false);
  private undoDescriptionSignal = signal<string | undefined>(undefined);
  private redoDescriptionSignal = signal<string | undefined>(undefined);

  private batching = false;
  private batchDepth = 0;
  private batchBeforeSnapshot: WhiteboardElement[] | null = null;
  private batchDescription = 'Batch operation';
  private pendingBatchAfter: WhiteboardElement[] | null = null;

  getCanUndoSignal() {
    return this.canUndoSignal.asReadonly();
  }
  getCanRedoSignal() {
    return this.canRedoSignal.asReadonly();
  }
  getUndoDescriptionSignal() {
    return this.undoDescriptionSignal.asReadonly();
  }
  getRedoDescriptionSignal() {
    return this.redoDescriptionSignal.asReadonly();
  }

  recordChange(before: WhiteboardElement[], after: WhiteboardElement[], description: string) {
    if (this.batching) {
      return;
    }

    if (!this.snapshotsEqual(before, after)) {
      this.pushHistory({
        before: this.cloneElements(before),
        after: this.cloneElements(after),
        description,
        timestamp: Date.now(),
      });
    }
  }

  recordElementCreation(before: WhiteboardElement[], after: WhiteboardElement[]) {
    this.recordChange(before, after, 'Create element');
  }
  recordElementUpdate(before: WhiteboardElement[], after: WhiteboardElement[]) {
    this.recordChange(before, after, 'Update element');
  }
  recordElementDeletion(before: WhiteboardElement[], after: WhiteboardElement[]) {
    this.recordChange(before, after, 'Delete element');
  }
  recordClear(before: WhiteboardElement[], after: WhiteboardElement[]) {
    this.recordChange(before, after, 'Clear whiteboard');
  }

  startBatch(description: string, beforeSnapshot: WhiteboardElement[]): BatchHandle {
    if (this.batchDepth === 0) {
      this.batchBeforeSnapshot = this.cloneElements(beforeSnapshot);
      this.batchDescription = description;
      this.batching = true;
    }
    this.batchDepth++;
    return {
      execute: () => this.finishBatchCommit(),
      clear: () => this.cancelBatch(),
    };
  }

  completeBatch(afterSnapshot: WhiteboardElement[]) {
    if (!this.batching) return;
    this.pendingBatchAfter = this.cloneElements(afterSnapshot);
  }

  private finishBatchCommit() {
    this.batchDepth = Math.max(0, this.batchDepth - 1);
    if (this.batchDepth > 0) return;
    if (!this.batching || !this.batchBeforeSnapshot) {
      this.resetBatchState();
      return;
    }
    const after = this.pendingBatchAfter ?? this.batchBeforeSnapshot;
    if (!this.snapshotsEqual(this.batchBeforeSnapshot, after)) {
      this.pushHistory({
        before: this.batchBeforeSnapshot,
        after,
        description: this.batchDescription,
        timestamp: Date.now(),
      });
    }
    this.resetBatchState();
  }

  private cancelBatch() {
    this.batchDepth = 0;
    this.resetBatchState();
  }

  private resetBatchState() {
    this.batching = false;
    this.batchBeforeSnapshot = null;
    this.batchDescription = 'Batch operation';
  }

  undo(): WhiteboardElement[] | null {
    return this.performUndo();
  }

  redo(): WhiteboardElement[] | null {
    return this.performRedo();
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateSignals();
  }

  private performUndo(): WhiteboardElement[] | null {
    if (this.undoStack.length === 0) return null;
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(entry);
    this.updateSignals();
    return this.cloneElements(entry.before);
  }

  private performRedo(): WhiteboardElement[] | null {
    if (this.redoStack.length === 0) return null;
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push(entry);
    this.updateSignals();
    return this.cloneElements(entry.after);
  }

  private pushHistory(entry: HistoryEntry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > this.MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
    this.updateSignals();
  }

  private updateSignals() {
    this.canUndoSignal.set(this.undoStack.length > 0);
    this.canRedoSignal.set(this.redoStack.length > 0);
    this.undoDescriptionSignal.set(this.undoStack[this.undoStack.length - 1]?.description);
    this.redoDescriptionSignal.set(this.redoStack[this.redoStack.length - 1]?.description);
  }

  private cloneElements(elements: WhiteboardElement[]): WhiteboardElement[] {
    interface PointElement {
      points?: [number, number][];
    }
    return elements.map((el) => {
      const cloned: WhiteboardElement = { ...el };
      const maybePoints = (el as unknown as PointElement).points;
      if (Array.isArray(maybePoints)) {
        (cloned as unknown as PointElement).points = maybePoints.map((pt) => [...pt]) as [number, number][];
      }
      return cloned;
    });
  }

  private snapshotsEqual(a: WhiteboardElement[], b: WhiteboardElement[]): boolean {
    if (a.length !== b.length) return false;
    const byIdA = new Map(a.map((e) => [e.id, e] as const));
    for (const el of b) {
      const prev = byIdA.get(el.id);
      if (!prev) return false;
      if (JSON.stringify(prev) !== JSON.stringify(el)) return false;
    }
    return true;
  }
}
