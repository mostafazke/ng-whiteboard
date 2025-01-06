import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';

import { ElementTypeEnum, WhiteboardElement } from '../../models';

describe('DataService', () => {
  let service: DataService;
  let mockElement: WhiteboardElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataService],
    });
    service = TestBed.inject(DataService);
    mockElement = {
      id: '1',
      type: ElementTypeEnum.RECT,
      x: 0,
      y: 0,
      options: {
        width: 100,
        height: 100,
      },
      value: '',
      rotation: 0,
      opacity: 100,
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty data', () => {
    expect(service.getData()).toEqual([]);
  });

  describe('setData', () => {
    it('should set new data and update initial data', () => {
      const testData = [mockElement];
      service.setData(testData);
      expect(service.getData()).toEqual(testData);
    });
  });

  describe('addElement', () => {
    it('should add element to data array', () => {
      service.addElement(mockElement);
      expect(service.getData()).toContain(mockElement);
      expect(service.getData().length).toBe(1);
    });
  });

  describe('removeElement', () => {
    it('should remove existing element from data array', () => {
      service.addElement(mockElement);
      service.removeElement(mockElement);
      expect(service.getData()).not.toContain(mockElement);
      expect(service.getData().length).toBe(0);
    });

    it('should not modify array when removing non-existent element', () => {
      service.addElement(mockElement);
      const nonExistentElement = { ...mockElement, id: '2' };
      service.removeElement(nonExistentElement);
      expect(service.getData().length).toBe(1);
    });
  });

  describe('updateElement', () => {
    it('should update existing element', () => {
      service.addElement(mockElement);
      const updatedElement: WhiteboardElement = { ...mockElement, options: { ...mockElement.options, width: 200 } };
      service.updateElement(updatedElement);
      expect(service.getData()[0].options.width).toBe(200);
    });

    it('should not modify array when updating non-existent element', () => {
      service.addElement(mockElement);
      const nonExistentElement = { ...mockElement, id: '2', width: 200 };
      service.updateElement(nonExistentElement);
      expect(service.getData()[0].options.width).toBe(100);
    });
  });

  describe('clearDraw', () => {
    it('should clear all data', () => {
      service.addElement(mockElement);
      service.clearDraw();
      expect(service.getData().length).toBe(0);
    });
  });

  describe('undo/redo operations', () => {
    it('should undo last operation', () => {
      service.addElement(mockElement);
      service.undoDraw();
      expect(service.getData().length).toBe(0);
    });

    it('should redo last undone operation', () => {
      service.addElement(mockElement);
      service.undoDraw();
      service.redoDraw();
      expect(service.getData()).toContainEqual(mockElement);
    });

    it('should not undo when no operations exist', () => {
      service.undoDraw();
      expect(service.getData().length).toBe(0);
    });

    it('should not redo when no undone operations exist', () => {
      service.redoDraw();
      expect(service.getData().length).toBe(0);
    });
  });

  describe('data$ observable', () => {
    it('should emit new values when data changes', (done) => {
      service.data$.subscribe((data) => {
        expect(data).toEqual([mockElement]);
        done();
      });
      service.addElement(mockElement);
    });
  });
});
