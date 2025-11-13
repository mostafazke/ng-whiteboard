import { TestBed } from '@angular/core/testing';
import { ApiService } from '../api';
import { ConfigService } from '../config/config.service';
import { ElementsService } from '../elements/elements.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { SelectionService } from '../elements/selection.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { HistoryService } from '../history/history.service';
import { ClipboardService, IOService } from '../input';
import { ToolsService } from '../tools/tools.service';
import { PanService } from '../viewport/pan.service';
import { ZoomService } from '../viewport/zoom.service';
import { CanvasService } from './canvas.service';
import { InstanceService } from './instance.service';

describe('WhiteboardMultiInstanceService', () => {
  let service: InstanceService;

  function createApiServiceInstance(): ApiService {
    return TestBed.inject(ApiService);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InstanceService,
        ApiService,
        ConfigService,
        EventBusService,
        ElementsService,
        CanvasService,
        IOService,
        LayerManagementService,
        PanService,
        SelectionService,
        ToolsService,
        HistoryService,
        ZoomService,
        ClipboardService,
      ],
    });
    service = TestBed.inject(InstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('activeId signal', () => {
    it('should start with null', () => {
      expect(service.activeId()).toBeNull();
    });

    it('should set active board', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);

      service.setActive('board-1');
      expect(service.activeId()).toBe('board-1');
    });

    it('should throw error when setting non-existing board as active', () => {
      expect(() => service.setActive('non-existing')).toThrow(
        'Whiteboard with ID "non-existing" not found in registry. Cannot set as active.'
      );
      expect(service.activeId()).toBeNull();
    });

    it('should clear active board', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);

      service.setActive('board-1');
      service.clearActive();

      expect(service.activeId()).toBeNull();
    });

    it('should clear active ID when unregistering the active instance', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);
      service.setActive('board-1');

      service.unregister('board-1');

      expect(service.activeId()).toBeNull();
    });
  });

  describe('getInstance', () => {
    it('should return instance by ID', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);

      expect(service.getInstance('board-1')).toBe(instance);
    });

    it('should return undefined for non-existing instance', () => {
      expect(service.getInstance('non-existing')).toBeUndefined();
    });
  });

  describe('hasInstance', () => {
    it('should return true for existing instance', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);

      expect(service.hasInstance('board-1')).toBe(true);
    });

    it('should return false for non-existing instance', () => {
      expect(service.hasInstance('non-existing')).toBe(false);
    });
  });

  describe('getAllInstanceIds', () => {
    it('should return all registered instance IDs', () => {
      const instance1 = createApiServiceInstance();
      const instance2 = createApiServiceInstance();

      service.register('board-1', instance1);
      service.register('board-2', instance2);

      const ids = service.getAllInstanceIds();
      expect(ids).toContain('board-1');
      expect(ids).toContain('board-2');
    });
  });

  describe('register and unregister', () => {
    it('should register a whiteboard instance', () => {
      const instance = createApiServiceInstance();

      service.register('board-1', instance);

      expect(service.hasInstance('board-1')).toBe(true);
      expect(service.getInstance('board-1')).toBe(instance);
    });

    it('should throw error when registering with empty ID', () => {
      const instance = createApiServiceInstance();

      expect(() => service.register('', instance)).toThrow('Whiteboard instance ID cannot be empty.');
    });

    it('should throw error when registering with whitespace-only ID', () => {
      const instance = createApiServiceInstance();

      expect(() => service.register('   ', instance)).toThrow('Whiteboard instance ID cannot be empty.');
    });

    it('should throw error when registering invalid instance', () => {
      expect(() => service.register('board-1', {} as ApiService)).toThrow('Instance must be an ApiService instance.');
    });

    it('should replace existing instance when registering with same ID', () => {
      const instance1 = createApiServiceInstance();
      const instance2 = createApiServiceInstance();

      service.register('board-1', instance1);
      service.register('board-1', instance2);

      expect(service.getInstance('board-1')).toBe(instance2);
      expect(service.getInstanceCount()).toBe(1);
    });

    it('should unregister a whiteboard instance', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);

      const result = service.unregister('board-1');

      expect(result).toBe(true);
      expect(service.hasInstance('board-1')).toBe(false);
    });

    it('should return false when unregistering non-existing instance', () => {
      const result = service.unregister('non-existing');

      expect(result).toBe(false);
    });

    it('should increment registry version on register', () => {
      const instance = createApiServiceInstance();
      const initialVersion = service.registryVersion();

      service.register('board-1', instance);

      expect(service.registryVersion()).toBe(initialVersion + 1);
    });

    it('should increment registry version on unregister', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);
      const versionBeforeUnregister = service.registryVersion();

      service.unregister('board-1');

      expect(service.registryVersion()).toBe(versionBeforeUnregister + 1);
    });

    it('should not increment registry version when unregistering non-existing instance', () => {
      const initialVersion = service.registryVersion();

      service.unregister('non-existing');

      expect(service.registryVersion()).toBe(initialVersion);
    });
  });

  describe('getInstanceCount', () => {
    it('should return 0 when no instances are registered', () => {
      expect(service.getInstanceCount()).toBe(0);
    });

    it('should return the correct count of registered instances', () => {
      const instance1 = createApiServiceInstance();
      const instance2 = createApiServiceInstance();

      service.register('board-1', instance1);
      service.register('board-2', instance2);

      expect(service.getInstanceCount()).toBe(2);
    });
  });

  describe('getActiveInstance', () => {
    it('should return undefined when no board is active', () => {
      expect(service.getActiveInstance()).toBeUndefined();
    });

    it('should return the active instance', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);
      service.setActive('board-1');

      expect(service.getActiveInstance()).toBe(instance);
    });

    it('should return undefined after clearing active', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);
      service.setActive('board-1');
      service.clearActive();

      expect(service.getActiveInstance()).toBeUndefined();
    });
  });

  describe('clearAll', () => {
    it('should clear all instances and active ID', () => {
      const instance1 = createApiServiceInstance();
      const instance2 = createApiServiceInstance();

      service.register('board-1', instance1);
      service.register('board-2', instance2);
      service.setActive('board-1');

      service.clearAll();

      expect(service.getInstanceCount()).toBe(0);
      expect(service.activeId()).toBeNull();
      expect(service.getAllInstanceIds().length).toBe(0);
    });

    it('should increment registry version', () => {
      const instance = createApiServiceInstance();
      service.register('board-1', instance);
      const versionBeforeClear = service.registryVersion();

      service.clearAll();

      expect(service.registryVersion()).toBe(versionBeforeClear + 1);
    });
  });

  describe('registryVersion signal', () => {
    it('should be reactive to registry changes', () => {
      const instance = createApiServiceInstance();
      const initialVersion = service.registryVersion();

      service.register('board-1', instance);
      expect(service.registryVersion()).toBe(initialVersion + 1);

      service.register('board-2', createApiServiceInstance());
      expect(service.registryVersion()).toBe(initialVersion + 2);

      service.unregister('board-1');
      expect(service.registryVersion()).toBe(initialVersion + 3);
    });
  });
});
