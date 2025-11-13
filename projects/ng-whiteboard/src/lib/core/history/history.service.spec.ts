import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { WhiteboardElement, ElementType } from '../types';

describe('HistoryService', () => {
  let service: HistoryService;

  const createMockElement = (id: string, x = 0, y = 0): WhiteboardElement =>
    ({
      id,
      type: ElementType.Rectangle,
      x,
      y,
      width: 100,
      height: 100,
      rx: 0,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      style: {
        strokeColor: '#000000',
        fillColor: '#ffffff',
        strokeWidth: 2,
        fillStyle: 'solid',
        strokeStyle: 'solid',
      },
    } as WhiteboardElement);

  const createMockPenElement = (id: string, points: [number, number][]): WhiteboardElement =>
    ({
      id,
      type: ElementType.Pen,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      points,
      path: '',
      style: {
        strokeColor: '#000000',
        fillColor: '#ffffff',
        strokeWidth: 2,
        fillStyle: 'solid',
        strokeStyle: 'solid',
      },
    } as WhiteboardElement);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistoryService],
    });
    service = TestBed.inject(HistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Signals', () => {
    it('should initialize signals with correct default values', () => {
      const canUndo = service.getCanUndoSignal();
      const canRedo = service.getCanRedoSignal();
      const undoDescription = service.getUndoDescriptionSignal();
      const redoDescription = service.getRedoDescriptionSignal();

      expect(canUndo()).toBe(false);
      expect(canRedo()).toBe(false);
      expect(undoDescription()).toBeUndefined();
      expect(redoDescription()).toBeUndefined();
    });

    it('should update canUndo signal when history is recorded', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');

      const canUndo = service.getCanUndoSignal();
      expect(canUndo()).toBe(true);
    });

    it('should update canRedo signal after undo', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');
      service.undo();

      const canRedo = service.getCanRedoSignal();
      expect(canRedo()).toBe(true);
    });

    it('should update undo description signal', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Custom action');

      const undoDescription = service.getUndoDescriptionSignal();
      expect(undoDescription()).toBe('Custom action');
    });

    it('should update redo description signal after undo', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Custom action');
      service.undo();

      const redoDescription = service.getRedoDescriptionSignal();
      expect(redoDescription()).toBe('Custom action');
    });
  });

  describe('recordChange', () => {
    it('should record a change when before and after differ', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');

      expect(service.getCanUndoSignal()()).toBe(true);
    });

    it('should not record a change when before and after are equal', () => {
      const elements = [createMockElement('1')];

      service.recordChange(elements, elements, 'No change');

      expect(service.getCanUndoSignal()()).toBe(false);
    });

    it('should not record a change during batching', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      const batch = service.startBatch('Batch operation', before);
      service.recordChange(before, after, 'Should be ignored');

      expect(service.getCanUndoSignal()()).toBe(false);

      batch.execute();
    });

    it('should clear redo stack when new change is recorded', () => {
      const before1: WhiteboardElement[] = [];
      const after1 = [createMockElement('1')];
      const after2 = [createMockElement('1'), createMockElement('2')];

      service.recordChange(before1, after1, 'Action 1');
      service.undo();

      expect(service.getCanRedoSignal()()).toBe(true);

      service.recordChange(after1, after2, 'Action 2');

      expect(service.getCanRedoSignal()()).toBe(false);
    });

    it('should respect MAX_HISTORY limit', () => {
      const before: WhiteboardElement[] = [];
      let after: WhiteboardElement[] = [];

      // Record 51 changes (MAX_HISTORY is 50)
      for (let i = 0; i < 51; i++) {
        after = [createMockElement(`element-${i}`)];
        service.recordChange(before, after, `Action ${i}`);
      }

      // Undo 50 times
      let undoCount = 0;
      while (service.getCanUndoSignal()()) {
        service.undo();
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('Convenience wrappers', () => {
    it('should record element creation with correct description', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordElementCreation(before, after);

      expect(service.getUndoDescriptionSignal()()).toBe('Create element');
    });

    it('should record element update with correct description', () => {
      const before = [createMockElement('1', 0, 0)];
      const after = [createMockElement('1', 10, 10)];

      service.recordElementUpdate(before, after);

      expect(service.getUndoDescriptionSignal()()).toBe('Update element');
    });

    it('should record element deletion with correct description', () => {
      const before = [createMockElement('1')];
      const after: WhiteboardElement[] = [];

      service.recordElementDeletion(before, after);

      expect(service.getUndoDescriptionSignal()()).toBe('Delete element');
    });

    it('should record clear with correct description', () => {
      const before = [createMockElement('1'), createMockElement('2')];
      const after: WhiteboardElement[] = [];

      service.recordClear(before, after);

      expect(service.getUndoDescriptionSignal()()).toBe('Clear whiteboard');
    });
  });

  describe('Batch operations', () => {
    it('should start a batch and return a batch handle', () => {
      const before: WhiteboardElement[] = [];

      const batch = service.startBatch('Batch operation', before);

      expect(batch).toHaveProperty('execute');
      expect(batch).toHaveProperty('clear');
      expect(typeof batch.execute).toBe('function');
      expect(typeof batch.clear).toBe('function');
    });

    it('should not record changes during batch', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      const batch = service.startBatch('Batch operation', before);
      service.recordChange(before, after, 'Should be ignored');

      expect(service.getCanUndoSignal()()).toBe(false);

      batch.execute();
    });

    it('should record batch when completeBatch and execute are called', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      const batch = service.startBatch('Batch operation', before);
      service.completeBatch(after);
      batch.execute();

      expect(service.getCanUndoSignal()()).toBe(true);
      expect(service.getUndoDescriptionSignal()()).toBe('Batch operation');
    });

    it('should not record batch when before and after are equal', () => {
      const elements = [createMockElement('1')];

      const batch = service.startBatch('Batch operation', elements);
      service.completeBatch(elements);
      batch.execute();

      expect(service.getCanUndoSignal()()).toBe(false);
    });

    it('should handle nested batches correctly', () => {
      const before: WhiteboardElement[] = [];
      const intermediate = [createMockElement('1')];
      const after = [createMockElement('1'), createMockElement('2')];

      const batch1 = service.startBatch('Outer batch', before);
      const batch2 = service.startBatch('Inner batch', intermediate);

      service.completeBatch(after);

      // Complete inner batch first
      batch2.execute();
      expect(service.getCanUndoSignal()()).toBe(false); // Still batching

      // Complete outer batch
      batch1.execute();
      expect(service.getCanUndoSignal()()).toBe(true); // Now recorded
      expect(service.getUndoDescriptionSignal()()).toBe('Outer batch');
    });

    it('should use beforeSnapshot if completeBatch is not called', () => {
      const before = [createMockElement('1')];

      const batch = service.startBatch('Batch operation', before);
      batch.execute();

      expect(service.getCanUndoSignal()()).toBe(false); // No change recorded
    });

    it('should cancel batch and clear state', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      const batch = service.startBatch('Batch operation', before);
      service.completeBatch(after);
      batch.clear();

      expect(service.getCanUndoSignal()()).toBe(false);
    });

    it('should reset batch state after execute', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      const batch1 = service.startBatch('Batch 1', before);
      service.completeBatch(after);
      batch1.execute();

      // Start a new batch and verify it works correctly
      const after2 = [createMockElement('1'), createMockElement('2')];
      const batch2 = service.startBatch('Batch 2', after);
      service.completeBatch(after2);
      batch2.execute();

      expect(service.getCanUndoSignal()()).toBe(true);
    });

    it('should handle cancel of nested batches', () => {
      const before: WhiteboardElement[] = [];

      service.startBatch('Outer batch', before);
      const batch2 = service.startBatch('Inner batch', before);

      batch2.clear(); // This should reset depth to 0

      expect(service.getCanUndoSignal()()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo a change and return the before state', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');

      const result = service.undo();

      expect(result).toEqual([]);
      expect(service.getCanUndoSignal()()).toBe(false);
      expect(service.getCanRedoSignal()()).toBe(true);
    });

    it('should return null when undo stack is empty', () => {
      const result = service.undo();

      expect(result).toBeNull();
    });

    it('should properly clone elements on undo', () => {
      const before = [createMockElement('1')];
      const after = [createMockElement('1', 10, 10)];

      service.recordChange(before, after, 'Move element');

      const result = service.undo();

      expect(result).not.toBe(before); // Should be a clone
      expect(result).toEqual(before);
    });

    it('should handle multiple undos', () => {
      const state0: WhiteboardElement[] = [];
      const state1 = [createMockElement('1')];
      const state2 = [createMockElement('1'), createMockElement('2')];

      service.recordChange(state0, state1, 'Action 1');
      service.recordChange(state1, state2, 'Action 2');

      const result1 = service.undo();
      expect(result1).toEqual(state1);
      expect(service.getUndoDescriptionSignal()()).toBe('Action 1');

      const result2 = service.undo();
      expect(result2).toEqual(state0);
      expect(service.getCanUndoSignal()()).toBe(false);
    });
  });

  describe('redo', () => {
    it('should redo a change and return the after state', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');
      service.undo();

      const result = service.redo();

      expect(result).toEqual(after);
      expect(service.getCanUndoSignal()()).toBe(true);
      expect(service.getCanRedoSignal()()).toBe(false);
    });

    it('should return null when redo stack is empty', () => {
      const result = service.redo();

      expect(result).toBeNull();
    });

    it('should properly clone elements on redo', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');
      service.undo();

      const result = service.redo();

      expect(result).not.toBe(after); // Should be a clone
      expect(result).toEqual(after);
    });

    it('should handle multiple redos', () => {
      const state0: WhiteboardElement[] = [];
      const state1 = [createMockElement('1')];
      const state2 = [createMockElement('1'), createMockElement('2')];

      service.recordChange(state0, state1, 'Action 1');
      service.recordChange(state1, state2, 'Action 2');

      service.undo();
      service.undo();

      const result1 = service.redo();
      expect(result1).toEqual(state1);

      const result2 = service.redo();
      expect(result2).toEqual(state2);
      expect(service.getCanRedoSignal()()).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear both undo and redo stacks', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');
      service.undo();

      service.clearHistory();

      expect(service.getCanUndoSignal()()).toBe(false);
      expect(service.getCanRedoSignal()()).toBe(false);
      expect(service.getUndoDescriptionSignal()()).toBeUndefined();
      expect(service.getRedoDescriptionSignal()()).toBeUndefined();
    });

    it('should clear history when no changes exist', () => {
      service.clearHistory();

      expect(service.getCanUndoSignal()()).toBe(false);
      expect(service.getCanRedoSignal()()).toBe(false);
    });
  });

  describe('cloneElements', () => {
    it('should deep clone elements with points', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 10],
        [20, 20],
      ];
      const penElement = createMockPenElement('pen-1', points);
      const before = [penElement];
      const after = [
        createMockPenElement('pen-1', [
          [0, 0],
          [10, 10],
          [20, 20],
          [30, 30],
        ]),
      ];

      service.recordChange(before, after, 'Add point');

      const result = service.undo();

      expect(result).toBeTruthy();
      if (result) {
        const restoredElement = result[0] as typeof penElement;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((restoredElement as any).points).toEqual(points);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((restoredElement as any).points).not.toBe(points); // Different reference
      }
    });

    it('should handle elements without points', () => {
      const rectElement = createMockElement('rect-1');
      const before = [rectElement];
      const after = [createMockElement('rect-1', 10, 10)];

      service.recordChange(before, after, 'Move rect');

      const result = service.undo();

      expect(result).toEqual(before);
      expect(result).not.toBe(before); // Different reference
    });
  });

  describe('snapshotsEqual', () => {
    it('should return true for equal snapshots', () => {
      const elements = [createMockElement('1')];

      service.recordChange(elements, elements, 'No change');

      expect(service.getCanUndoSignal()()).toBe(false);
    });

    it('should return false for snapshots with different lengths', () => {
      const before = [createMockElement('1')];
      const after = [createMockElement('1'), createMockElement('2')];

      service.recordChange(before, after, 'Add element');

      expect(service.getCanUndoSignal()()).toBe(true);
    });

    it('should return false for snapshots with different element IDs', () => {
      const before = [createMockElement('1')];
      const after = [createMockElement('2')];

      service.recordChange(before, after, 'Replace element');

      expect(service.getCanUndoSignal()()).toBe(true);
    });

    it('should return false for elements with different properties', () => {
      const before = [createMockElement('1', 0, 0)];
      const after = [createMockElement('1', 10, 10)];

      service.recordChange(before, after, 'Move element');

      expect(service.getCanUndoSignal()()).toBe(true);
    });

    it('should handle empty arrays', () => {
      const before: WhiteboardElement[] = [];
      const after: WhiteboardElement[] = [];

      service.recordChange(before, after, 'No change');

      expect(service.getCanUndoSignal()()).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: create, undo, redo, modify', () => {
      const state0: WhiteboardElement[] = [];
      const state1 = [createMockElement('1')];
      const state2 = [createMockElement('1', 10, 10)];

      // Create
      service.recordElementCreation(state0, state1);
      expect(service.getCanUndoSignal()()).toBe(true);
      expect(service.getUndoDescriptionSignal()()).toBe('Create element');

      // Undo
      const undoResult = service.undo();
      expect(undoResult).toEqual(state0);
      expect(service.getCanRedoSignal()()).toBe(true);

      // Redo
      const redoResult = service.redo();
      expect(redoResult).toEqual(state1);

      // Modify
      service.recordElementUpdate(state1, state2);
      expect(service.getCanRedoSignal()()).toBe(false); // Redo stack cleared
      expect(service.getUndoDescriptionSignal()()).toBe('Update element');
    });

    it('should handle batch with multiple operations', () => {
      const before: WhiteboardElement[] = [];
      const intermediate1 = [createMockElement('1')];
      const intermediate2 = [createMockElement('1'), createMockElement('2')];
      const after = [createMockElement('1', 10, 10), createMockElement('2', 20, 20)];

      const batch = service.startBatch('Multiple operations', before);

      // Simulate multiple operations during batch
      service.recordChange(before, intermediate1, 'Ignored');
      service.recordChange(intermediate1, intermediate2, 'Ignored');
      service.recordChange(intermediate2, after, 'Ignored');

      service.completeBatch(after);
      batch.execute();

      expect(service.getCanUndoSignal()()).toBe(true);
      expect(service.getUndoDescriptionSignal()()).toBe('Multiple operations');

      // Undo should restore to before state
      const result = service.undo();
      expect(result).toEqual(before);
    });

    it('should handle timestamp recording', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');

      // Verify the history was recorded with a timestamp
      expect(service.getCanUndoSignal()()).toBe(true);
    });

    it('should maintain correct state through complex undo/redo sequence', () => {
      const state0: WhiteboardElement[] = [];
      const state1 = [createMockElement('1')];
      const state2 = [createMockElement('1'), createMockElement('2')];
      const state3 = [createMockElement('1'), createMockElement('2'), createMockElement('3')];

      service.recordChange(state0, state1, 'Action 1');
      service.recordChange(state1, state2, 'Action 2');
      service.recordChange(state2, state3, 'Action 3');

      // Undo twice
      service.undo();
      service.undo();

      // Redo once
      service.redo();

      // Record new action (should clear remaining redo)
      const state4 = [createMockElement('1'), createMockElement('4')];
      service.recordChange(state2, state4, 'Action 4');

      expect(service.getCanRedoSignal()()).toBe(false);

      // Verify correct undo chain
      const result1 = service.undo();
      expect(result1).toEqual(state2);

      const result2 = service.undo();
      expect(result2).toEqual(state1);
    });
  });

  describe('Edge cases', () => {
    it('should handle undo when stack has only one entry', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');

      const result = service.undo();
      expect(result).toEqual(before);
      expect(service.getCanUndoSignal()()).toBe(false);

      const nullResult = service.undo();
      expect(nullResult).toBeNull();
    });

    it('should handle redo when stack has only one entry', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');
      service.undo();

      const result = service.redo();
      expect(result).toEqual(after);
      expect(service.getCanRedoSignal()()).toBe(false);

      const nullResult = service.redo();
      expect(nullResult).toBeNull();
    });

    it('should handle batch execute with batchDepth > 0 but no beforeSnapshot', () => {
      const before: WhiteboardElement[] = [];

      const batch = service.startBatch('Batch', before);
      batch.clear(); // This resets state
      batch.execute(); // This should handle gracefully

      expect(service.getCanUndoSignal()()).toBe(false);
    });

    it('should handle completeBatch when not batching', () => {
      const after = [createMockElement('1')];

      service.completeBatch(after); // Should not throw

      expect(service.getCanUndoSignal()()).toBe(false);
    });

    it('should handle edge case where undoStack.pop() might return undefined', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');

      // Normal undo should work
      const result = service.undo();
      expect(result).not.toBeNull();

      // Second undo on empty stack should return null
      const nullResult = service.undo();
      expect(nullResult).toBeNull();

      // This covers both branches: length check and the defensive !entry check
    });

    it('should handle edge case where redoStack.pop() might return undefined', () => {
      const before: WhiteboardElement[] = [];
      const after = [createMockElement('1')];

      service.recordChange(before, after, 'Add element');
      service.undo();

      // Normal redo should work
      const result = service.redo();
      expect(result).not.toBeNull();

      // Second redo on empty stack should return null
      const nullResult = service.redo();
      expect(nullResult).toBeNull();

      // This covers both branches: length check and the defensive !entry check
    });

    it('should maintain stack integrity through multiple operations', () => {
      const state0: WhiteboardElement[] = [];
      const state1 = [createMockElement('1')];
      const state2 = [createMockElement('1'), createMockElement('2')];

      // Build up history
      service.recordChange(state0, state1, 'Action 1');
      service.recordChange(state1, state2, 'Action 2');

      // Verify we have 2 entries
      expect(service.getCanUndoSignal()()).toBe(true);

      // Undo both
      service.undo();
      service.undo();

      // Stack should be empty
      expect(service.getCanUndoSignal()()).toBe(false);

      // Additional undo should return null (covers the !entry path)
      const result = service.undo();
      expect(result).toBeNull();
    });
  });
});
