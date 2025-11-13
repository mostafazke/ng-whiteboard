import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardEvent, LineCap, LineJoin, PenType } from '../types';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let eventBusService: EventBusService;

  beforeEach(() => {
    eventBusService = new EventBusService();
    service = new ConfigService(eventBusService);
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have default config values', () => {
      const config = service.getConfig();
      expect(config.drawingEnabled).toBe(true);
      expect(config.canvasWidth).toBe(800);
      expect(config.canvasHeight).toBe(600);
      expect(config.strokeColor).toBe('#333333');
      expect(config.strokeWidth).toBe(2);
      expect(config.backgroundColor).toBe('#F8F9FA');
    });

    it('should have default editor config values', () => {
      const editorConfig = service.getEditorConfig();
      expect(editorConfig.title).toBe('Whiteboard');
      expect(editorConfig.enableEditor).toBe(true);
      expect(editorConfig.showTitle).toBe(true);
      expect(editorConfig.showZoom).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the config object', () => {
      expect(service.getConfig().strokeColor).toBe('#333333');
    });

    it('should return readonly config', () => {
      const config = service.getConfig();
      expect(config).toBeTruthy();
      expect(typeof config).toBe('object');
    });

    it('should return current config snapshot', () => {
      service.updateConfig({ strokeColor: '#ff0000' }, false);
      const config = service.getConfig();
      expect(config.strokeColor).toBe('#ff0000');
    });
  });

  describe('getConfigSignal', () => {
    it('should return a readonly signal', () => {
      const signal = service.getConfigSignal();
      expect(signal).toBeTruthy();
      expect(typeof signal).toBe('function');
    });

    it('should provide reactive access to config', () => {
      const signal = service.getConfigSignal();
      const initialColor = signal().strokeColor;
      service.updateConfig({ strokeColor: '#00ff00' }, false);
      expect(signal().strokeColor).not.toBe(initialColor);
      expect(signal().strokeColor).toBe('#00ff00');
    });
  });

  describe('getEditorConfig', () => {
    it('should return readonly editor config', () => {
      const editorConfig = service.getEditorConfig();
      expect(editorConfig).toBeTruthy();
      expect(editorConfig.title).toBe('Whiteboard');
    });

    it('should return current editor config snapshot', () => {
      service.updateEditorConfigValue('title', 'My Board');
      const editorConfig = service.getEditorConfig();
      expect(editorConfig.title).toBe('My Board');
    });
  });

  describe('getEditorConfigSignal', () => {
    it('should return a readonly signal', () => {
      const signal = service.getEditorConfigSignal();
      expect(signal).toBeTruthy();
      expect(typeof signal).toBe('function');
    });

    it('should provide reactive access to editor config', () => {
      const signal = service.getEditorConfigSignal();
      service.updateEditorConfigValue('showTools', false);
      expect(signal().showTools).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should merge multiple config properties', () => {
      const partialConfig = {
        strokeColor: '#fff',
        strokeWidth: 5,
        backgroundColor: '#000',
      };

      service.updateConfig(partialConfig);
      const updatedConfig = service.getConfig();

      expect(updatedConfig.strokeColor).toBe('#fff');
      expect(updatedConfig.strokeWidth).toBe(5);
      expect(updatedConfig.backgroundColor).toBe('#000');
    });

    it('should emit event with full config', () => {
      jest.spyOn(eventBusService, 'emit');
      const partialConfig = { zoom: 2 };

      service.updateConfig(partialConfig);

      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, service.getConfig());
    });

    it('should emit ZoomChange event when zoom is updated', () => {
      jest.spyOn(eventBusService, 'emit');
      service.updateConfig({ zoom: 1.5 });

      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ZoomChange, { zoom: 1.5 });
      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, service.getConfig());
    });

    it('should not emit ConfigChange when emitEvent is false', () => {
      jest.spyOn(eventBusService, 'emit');
      service.updateConfig({ strokeColor: '#blue' }, false);

      expect(eventBusService.emit).not.toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, expect.anything());
    });

    it('should still emit ZoomChange even when emitEvent is false', () => {
      jest.spyOn(eventBusService, 'emit');
      service.updateConfig({ zoom: 2.5 }, false);

      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ZoomChange, { zoom: 2.5 });
      expect(eventBusService.emit).not.toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, expect.anything());
    });

    it('should update single property', () => {
      service.updateConfig({ strokeWidth: 10 });
      expect(service.getConfig().strokeWidth).toBe(10);
    });

    it('should preserve other properties when updating', () => {
      const originalColor = service.getConfig().strokeColor;
      service.updateConfig({ strokeWidth: 10 });
      expect(service.getConfig().strokeColor).toBe(originalColor);
    });

    it('should handle boolean properties', () => {
      service.updateConfig({ drawingEnabled: false });
      expect(service.getConfig().drawingEnabled).toBe(false);
    });

    it('should handle enum properties', () => {
      service.updateConfig({ lineCap: LineCap.Round });
      expect(service.getConfig().lineCap).toBe(LineCap.Round);
    });

    it('should handle number properties', () => {
      service.updateConfig({ fontSize: 36 });
      expect(service.getConfig().fontSize).toBe(36);
    });
  });

  describe('isConfigDifferent', () => {
    it('should return true for different values', () => {
      expect(service.isConfigDifferent('strokeWidth', 5)).toBeTruthy();
    });

    it('should return false for same values', () => {
      expect(service.isConfigDifferent('strokeWidth', 2)).toBeFalsy();
    });

    it('should handle string comparisons', () => {
      expect(service.isConfigDifferent('strokeColor', '#333333')).toBe(false);
      expect(service.isConfigDifferent('strokeColor', '#000000')).toBe(true);
    });

    it('should handle boolean comparisons', () => {
      expect(service.isConfigDifferent('drawingEnabled', true)).toBe(false);
      expect(service.isConfigDifferent('drawingEnabled', false)).toBe(true);
    });

    it('should handle number comparisons', () => {
      expect(service.isConfigDifferent('canvasWidth', 800)).toBe(false);
      expect(service.isConfigDifferent('canvasWidth', 1024)).toBe(true);
    });

    it('should handle enum comparisons', () => {
      // Default lineJoin is LineJoin.Round, so Miter is different, Round is same
      expect(service.isConfigDifferent('lineJoin', LineJoin.Round)).toBe(false);
      expect(service.isConfigDifferent('lineJoin', LineJoin.Miter)).toBe(true);
    });
  });

  describe('updateConfigValue', () => {
    it('should update config properties', () => {
      service.updateConfigValue('gridSize', 15);
      expect(service.getConfig().gridSize).toBe(15);
    });

    it('should emit event with full config', () => {
      jest.spyOn(eventBusService, 'emit');
      service.updateConfigValue('fontSize', 36);
      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, service.getConfig());
    });

    it('should handle multiple consecutive updates', () => {
      service.updateConfigValue('strokeWidth', 3);
      service.updateConfigValue('strokeColor', '#ff0000');
      service.updateConfigValue('strokeWidth', 5);

      const config = service.getConfig();
      expect(config.strokeWidth).toBe(5);
      expect(config.strokeColor).toBe('#ff0000');
    });

    it('should update zoom property', () => {
      service.updateConfigValue('zoom', 1.5);
      expect(service.getConfig().zoom).toBe(1.5);
    });

    it('should update position properties', () => {
      service.updateConfigValue('x', 100);
      service.updateConfigValue('y', 200);
      expect(service.getConfig().x).toBe(100);
      expect(service.getConfig().y).toBe(200);
    });
  });

  describe('updateEditorConfigValue', () => {
    it('should update editor config properties', () => {
      service.updateEditorConfigValue('title', 'New Title');
      expect(service.getEditorConfig().title).toBe('New Title');
    });

    it('should update boolean editor properties', () => {
      service.updateEditorConfigValue('showTools', false);
      expect(service.getEditorConfig().showTools).toBe(false);
    });

    it('should handle multiple updates', () => {
      service.updateEditorConfigValue('showZoom', false);
      service.updateEditorConfigValue('showLayers', false);
      service.updateEditorConfigValue('showGrid', false);

      const config = service.getEditorConfig();
      expect(config.showZoom).toBe(false);
      expect(config.showLayers).toBe(false);
      expect(config.showGrid).toBe(false);
    });

    it('should preserve other properties', () => {
      const originalTitle = service.getEditorConfig().title;
      service.updateEditorConfigValue('showTools', false);
      expect(service.getEditorConfig().title).toBe(originalTitle);
    });

    it('should not emit ConfigChange event', () => {
      jest.spyOn(eventBusService, 'emit');
      service.updateEditorConfigValue('showTitle', false);
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });
  });

  describe('checkAndUpdateConfig', () => {
    it('should not emit event when value is the same', () => {
      jest.spyOn(eventBusService, 'emit');
      service.checkAndUpdateConfig('strokeWidth', 2);
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('should update and emit event for grid-related properties', () => {
      jest.spyOn(eventBusService, 'emit');
      service.checkAndUpdateConfig('gridSize', 20);
      expect(service.getConfig().gridSize).toBe(20);
      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, service.getConfig());
    });

    it('should handle coordinate updates', () => {
      service.checkAndUpdateConfig('x', 100);
      expect(service.getConfig().x).toBe(100);
    });

    it('should not update when value is identical', () => {
      jest.spyOn(eventBusService, 'emit');
      const originalConfig = service.getConfig();
      service.checkAndUpdateConfig('strokeColor', '#333333');
      expect(eventBusService.emit).not.toHaveBeenCalled();
      expect(service.getConfig()).toEqual(originalConfig);
    });

    it('should update boolean properties when different', () => {
      service.checkAndUpdateConfig('drawingEnabled', false);
      expect(service.getConfig().drawingEnabled).toBe(false);
    });

    it('should handle enum updates', () => {
      service.checkAndUpdateConfig('penType', PenType.Marker);
      expect(service.getConfig().penType).toBe(PenType.Marker);
    });
  });

  describe('getConfigValue', () => {
    it('should get specific config value', () => {
      const strokeWidth = service.getConfigValue('strokeWidth');
      expect(strokeWidth).toBe(2);
    });

    it('should get string values', () => {
      const color = service.getConfigValue('strokeColor');
      expect(color).toBe('#333333');
    });

    it('should get boolean values', () => {
      const enabled = service.getConfigValue('drawingEnabled');
      expect(enabled).toBe(true);
    });

    it('should get number values', () => {
      const zoom = service.getConfigValue('zoom');
      expect(zoom).toBe(1);
    });

    it('should reflect updated values', () => {
      service.updateConfigValue('fontSize', 48);
      const fontSize = service.getConfigValue('fontSize');
      expect(fontSize).toBe(48);
    });
  });

  describe('setConfigValue', () => {
    it('should set specific config value', () => {
      service.setConfigValue('strokeWidth', 8);
      expect(service.getConfig().strokeWidth).toBe(8);
    });

    it('should emit ConfigChange event', () => {
      jest.spyOn(eventBusService, 'emit');
      service.setConfigValue('gridSize', 25);
      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, service.getConfig());
    });

    it('should handle string values', () => {
      service.setConfigValue('fontFamily', 'Arial');
      expect(service.getConfig().fontFamily).toBe('Arial');
    });

    it('should handle boolean values', () => {
      service.setConfigValue('enableGrid', true);
      expect(service.getConfig().enableGrid).toBe(true);
    });

    it('should handle number values', () => {
      service.setConfigValue('dashoffset', 5);
      expect(service.getConfig().dashoffset).toBe(5);
    });

    it('should be equivalent to updateConfigValue', () => {
      service.setConfigValue('strokeColor', '#abc123');
      service.updateConfigValue('backgroundColor', '#def456');

      expect(service.getConfig().strokeColor).toBe('#abc123');
      expect(service.getConfig().backgroundColor).toBe('#def456');
    });
  });

  describe('getConfigKeys', () => {
    it('should return all config keys', () => {
      const keys = service.getConfigKeys();
      expect(keys).toBeTruthy();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should include standard config keys', () => {
      const keys = service.getConfigKeys();
      expect(keys).toContain('strokeColor');
      expect(keys).toContain('strokeWidth');
      expect(keys).toContain('backgroundColor');
      expect(keys).toContain('zoom');
    });

    it('should return keys as array of strings', () => {
      const keys = service.getConfigKeys();
      keys.forEach((key) => {
        expect(typeof key).toBe('string');
      });
    });
  });

  describe('getConfigValues', () => {
    it('should return all config values', () => {
      const values = service.getConfigValues();
      expect(values).toBeTruthy();
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);
    });

    it('should include standard config values', () => {
      const values = service.getConfigValues();
      expect(values).toContain('#333333'); // strokeColor
      expect(values).toContain(2); // strokeWidth
      expect(values).toContain('#F8F9FA'); // backgroundColor
    });

    it('should reflect updated values', () => {
      service.updateConfigValue('strokeColor', '#unique123');
      const values = service.getConfigValues();
      expect(values).toContain('#unique123');
    });

    it('should have same length as keys', () => {
      const keys = service.getConfigKeys();
      const values = service.getConfigValues();
      expect(values.length).toBe(keys.length);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete config workflow', () => {
      // Check initial state
      expect(service.getConfig().strokeColor).toBe('#333333');

      // Update via different methods
      service.updateConfig({ strokeColor: '#ff0000', strokeWidth: 5 });
      expect(service.getConfig().strokeColor).toBe('#ff0000');
      expect(service.getConfig().strokeWidth).toBe(5);

      // Check and update
      service.checkAndUpdateConfig('strokeWidth', 10);
      expect(service.getConfig().strokeWidth).toBe(10);

      // Set value
      service.setConfigValue('fontSize', 32);
      expect(service.getConfigValue('fontSize')).toBe(32);
    });

    it('should maintain config consistency across signal and getter', () => {
      const signal = service.getConfigSignal();
      const getter = service.getConfig();

      expect(signal().strokeColor).toBe(getter.strokeColor);
      expect(signal().strokeWidth).toBe(getter.strokeWidth);
    });

    it('should handle rapid updates correctly', () => {
      for (let i = 0; i < 10; i++) {
        service.updateConfigValue('strokeWidth', i);
      }
      expect(service.getConfig().strokeWidth).toBe(9);
    });

    it('should handle all config property types', () => {
      service.updateConfig({
        drawingEnabled: false,
        strokeColor: '#test',
        strokeWidth: 99,
        lineCap: LineCap.Square,
        zoom: 2.5,
        x: 500,
        enableGrid: true,
      });

      const config = service.getConfig();
      expect(config.drawingEnabled).toBe(false);
      expect(config.strokeColor).toBe('#test');
      expect(config.strokeWidth).toBe(99);
      expect(config.lineCap).toBe(LineCap.Square);
      expect(config.zoom).toBe(2.5);
      expect(config.x).toBe(500);
      expect(config.enableGrid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty partial config update', () => {
      const originalConfig = service.getConfig();
      service.updateConfig({});
      expect(service.getConfig()).toEqual(originalConfig);
    });

    it('should handle zero values', () => {
      service.updateConfig({ strokeWidth: 0, x: 0, y: 0, zoom: 0 });
      const config = service.getConfig();
      expect(config.strokeWidth).toBe(0);
      expect(config.x).toBe(0);
      expect(config.y).toBe(0);
      expect(config.zoom).toBe(0);
    });

    it('should handle negative values', () => {
      service.updateConfig({ x: -100, y: -200 });
      expect(service.getConfig().x).toBe(-100);
      expect(service.getConfig().y).toBe(-200);
    });

    it('should handle very large values', () => {
      service.updateConfig({ canvasWidth: 10000, canvasHeight: 10000 });
      expect(service.getConfig().canvasWidth).toBe(10000);
      expect(service.getConfig().canvasHeight).toBe(10000);
    });

    it('should handle empty string values', () => {
      service.updateConfig({ dasharray: '', fill: '' });
      expect(service.getConfig().dasharray).toBe('');
      expect(service.getConfig().fill).toBe('');
    });

    it('should handle transparent fill', () => {
      service.updateConfig({ fill: 'transparent' });
      expect(service.getConfig().fill).toBe('transparent');
    });
  });
});
