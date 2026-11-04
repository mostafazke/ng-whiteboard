import { signal, Injectable } from '@angular/core';
import { WhiteboardElement } from '../types';
import { LayerState } from '../types/layers';

export interface BoardSnapshot {
  elements: WhiteboardElement[];
  layers?: LayerState;
}

interface HistoryEntry {
  before: WhiteboardElement[];
  after: WhiteboardElement[];
  layersBefore?: LayerState;
  layersAfter?: LayerState;
  description: string;
  timestamp: number;
}

export interface BatchHandle {
  /** Commit the batch; `after` and `layersAfter`, when given, are recorded as its final state first. */
  execute: (after?: WhiteboardElement[], layersAfter?: LayerState) => void;
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
  private batchLayersBefore: LayerState | undefined;
  private pendingBatchLayersAfter: LayerState | undefined;
  private batchGeneration = 0;

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

  recordBoardChange(before: BoardSnapshot, after: BoardSnapshot, description: string) {
    if (this.batching) {
      return;
    }

    if (!this.snapshotsEqual(before.elements, after.elements) || !this.layersEqual(before.layers, after.layers)) {
      this.pushHistory({
        before: this.cloneElements(before.elements),
        after: this.cloneElements(after.elements),
        layersBefore: this.cloneLayers(before.layers),
        layersAfter: this.cloneLayers(after.layers),
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

  startBatch(description: string, beforeSnapshot: WhiteboardElement[], layersBefore?: LayerState): BatchHandle {
    if (this.batchDepth === 0) {
      this.batchBeforeSnapshot = this.cloneElements(beforeSnapshot);
      this.batchLayersBefore = this.cloneLayers(layersBefore);
      this.batchDescription = description;
      this.batching = true;
    }
    this.batchDepth++;
    const generation = this.batchGeneration;
    let settled = false;
    // A handle settles once, and only while its batch is still the open one: after a cancel it no longer
    // touches the depth, so a stale owner cannot close a batch opened by someone else.
    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      if (generation === this.batchGeneration) action();
    };
    return {
      execute: (after?: WhiteboardElement[], layersAfter?: LayerState) =>
        settle(() => {
          if (after) this.completeBatch(after);
          if (layersAfter && this.batching) this.pendingBatchLayersAfter = this.cloneLayers(layersAfter);
          this.finishBatchCommit();
        }),
      clear: () => settle(() => this.cancelBatch()),
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
    const layersAfter = this.pendingBatchLayersAfter ?? this.batchLayersBefore;
    if (
      !this.snapshotsEqual(this.batchBeforeSnapshot, after) ||
      !this.layersEqual(this.batchLayersBefore, layersAfter)
    ) {
      this.pushHistory({
        before: this.batchBeforeSnapshot,
        after,
        layersBefore: this.batchLayersBefore,
        layersAfter,
        description: this.batchDescription,
        timestamp: Date.now(),
      });
    }
    this.resetBatchState();
  }

  private cancelBatch() {
    this.batchGeneration++;
    this.batchDepth = 0;
    this.resetBatchState();
  }

  private resetBatchState() {
    this.batching = false;
    this.batchBeforeSnapshot = null;
    this.pendingBatchAfter = null;
    this.batchLayersBefore = undefined;
    this.pendingBatchLayersAfter = undefined;
    this.batchDescription = 'Batch operation';
  }

  undo(): WhiteboardElement[] | null {
    return this.performUndo();
  }

  redo(): WhiteboardElement[] | null {
    return this.performRedo();
  }

  undoSnapshot(): BoardSnapshot | null {
    const entry = this.takeUndo();
    if (!entry) return null;
    return this.toSnapshot(entry.before, entry.layersBefore);
  }

  redoSnapshot(): BoardSnapshot | null {
    const entry = this.takeRedo();
    if (!entry) return null;
    return this.toSnapshot(entry.after, entry.layersAfter);
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateSignals();
  }

  private performUndo(): WhiteboardElement[] | null {
    return this.undoSnapshot()?.elements ?? null;
  }

  private performRedo(): WhiteboardElement[] | null {
    return this.redoSnapshot()?.elements ?? null;
  }

  private takeUndo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(entry);
    this.updateSignals();
    return entry;
  }

  private takeRedo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push(entry);
    this.updateSignals();
    return entry;
  }

  private toSnapshot(elements: WhiteboardElement[], layers?: LayerState): BoardSnapshot {
    const snapshot: BoardSnapshot = { elements: this.cloneElements(elements) };
    if (layers) snapshot.layers = this.cloneLayers(layers);
    return snapshot;
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

  private cloneLayers(layers: LayerState | undefined): LayerState | undefined {
    return layers ? (JSON.parse(JSON.stringify(layers)) as LayerState) : undefined;
  }

  private layersEqual(a: LayerState | undefined, b: LayerState | undefined): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
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
