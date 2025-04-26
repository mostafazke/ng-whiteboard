import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardEvent } from '../types';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let eventBusService: EventBusService;

  beforeEach(() => {
    eventBusService = new EventBusService();
    service = new ConfigService(eventBusService);
  });

  describe('getConfig', () => {
    it('should return a copy of the config object', () => {
      expect(service.getConfig().strokeColor).toBe('#333333');
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

    it('should emit event with only changed properties', () => {
      jest.spyOn(eventBusService, 'emit');
      const partialConfig = { zoom: 2 };

      service.updateConfig(partialConfig);

      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, partialConfig);
    });
  });

  describe('isConfigDifferent', () => {
    it('should return true for different values', () => {
      expect(service.isConfigDifferent('strokeWidth', 5)).toBeTruthy();
    });

    it('should return false for same values', () => {
      expect(service.isConfigDifferent('strokeWidth', 2)).toBeFalsy();
    });
  });

  describe('updateConfigValue', () => {
    it('should update nested object properties', () => {
      const newTranslation = { x: 10, y: 10 };
      service.updateConfigValue('gridTranslation', newTranslation);
      expect(service.getConfig().gridTranslation).toEqual(newTranslation);
    });

    it('should emit event with property name as key', () => {
      jest.spyOn(eventBusService, 'emit');
      service.updateConfigValue('fontSize', 36);
      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, { fontSize: 36 });
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
      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ConfigChange, { gridSize: 20 });
    });

    it('should handle translation object updates', () => {
      const newTranslation = { x: 100, y: 100 };
      service.checkAndUpdateConfig('gridTranslation', newTranslation);
      expect(service.getConfig().gridTranslation).toEqual(newTranslation);
    });
  });
});
