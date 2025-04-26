import { Injectable } from '@angular/core';
import { LineCap, LineJoin, WhiteboardConfig, WhiteboardEvent } from '../types';
import { EventBusService } from '../event-bus/event-bus.service';

@Injectable()
export class ConfigService {
  private config: WhiteboardConfig = {
    drawingEnabled: true,
    canvasWidth: 800,
    canvasHeight: 600,
    fullScreen: true,
    center: true,
    strokeColor: '#333333',
    strokeWidth: 2,
    backgroundColor: '#F8F9FA',
    lineJoin: LineJoin.Miter,
    lineCap: LineCap.Butt,
    fill: 'transparent',
    zoom: 1,
    fontFamily: 'sans-serif',
    fontSize: 24,
    dasharray: '',
    dashoffset: 0,
    x: 0,
    y: 0,
    enableGrid: false,
    gridSize: 10,
    snapToGrid: true,
    gridTranslation: { x: 0, y: 0 },
    elementsTranslation: { x: 0, y: 0 },
  };

  constructor(private eventBusService: EventBusService) {}

  /**
   * Returns a copy of the current configuration.
   */
  getConfig(): WhiteboardConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration with the provided partial configuration.
   * Emits a ConfigChange event with the updated configuration.
   *
   * @param partialConfig - Partial configuration to update.
   */
  updateConfig(partialConfig: Partial<WhiteboardConfig>): void {
    this.config = { ...this.config, ...partialConfig };
    this.eventBusService.emit(WhiteboardEvent.ConfigChange, partialConfig);
  }

  /**
   * Checks if the provided value for a specific configuration key is different from the current value.
   *
   * @param key - The configuration key to check.
   * @param value - The value to compare.
   * @returns True if the value is different, false otherwise.
   */
  isConfigDifferent(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): boolean {
    return this.config[key] !== value;
  }

  /**
   * Updates the value of a specific configuration key.
   * Emits a ConfigChange event with the updated key-value pair.
   *
   * @param key - The configuration key to update.
   * @param value - The new value to set.
   */
  updateConfigValue(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): void {
    (this.config[key] as typeof value) = value;
    this.eventBusService.emit(WhiteboardEvent.ConfigChange, { [key]: value });
  }

  /**
   * Checks if the provided value for a specific configuration key is different from the current value.
   * If different, updates the configuration and emits a ConfigChange event.
   *
   * @param key - The configuration key to check and update.
   * @param value - The new value to set if different.
   */
  checkAndUpdateConfig(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): void {
    if (this.isConfigDifferent(key, value)) {
      this.updateConfigValue(key, value);
    }
  }
}
