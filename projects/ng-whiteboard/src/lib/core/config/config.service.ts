import { Injectable, signal } from '@angular/core';
import {
  ElementType,
  LineCap,
  LineJoin,
  WhiteboardConfig,
  WhiteboardEvent,
  EditorConfig,
  PenType,
  defaultArrowConfig,
} from '../types';
import { EventBusService } from '../event-bus/event-bus.service';
import { applyThemeColors } from './theme-colors';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config = signal<WhiteboardConfig>({
    drawingEnabled: true,
    canvasWidth: 800,
    canvasHeight: 600,
    fullScreen: true,
    center: true,
    canvasX: 0,
    canvasY: 0,
    strokeColor: '#333333',
    strokeWidth: 2,
    backgroundColor: '#F8F9FA',
    lineJoin: LineJoin.Round,
    lineCap: LineCap.Round,
    fill: 'transparent',
    zoom: 1,
    x: 0,
    y: 0,
    fontFamily: 'sans-serif',
    fontSize: 24,
    dasharray: '',
    dashoffset: 0,
    enableGrid: false,
    gridSize: 10,
    snapToGrid: true,
    keyboardShortcutsEnabled: true,
    penType: PenType.Pen,
    penThrottlingThreshold: 2,
    arrowConfig: { ...defaultArrowConfig },
  });

  private editorConfig = signal<EditorConfig>({ title: 'Whiteboard' });

  private eventsHeld = false;
  private heldZoomChange = false;
  private heldConfigChange = false;

  constructor(private eventBusService: EventBusService) {}

  getConfig(): Readonly<WhiteboardConfig> {
    return this.config();
  }

  /**
   * Resolve the post-draw "select after draw" behaviour for an element type. Honours the
   * `selectAfterDraw` config (global boolean or per-type object); falls back to the element's
   * own default when the config is omitted (or has no entry for that type).
   */
  resolveSelectAfterDraw(type: ElementType, fallback: boolean): boolean {
    const cfg = this.config().selectAfterDraw;
    if (cfg === undefined) return fallback;
    if (typeof cfg === 'boolean') return cfg;
    return cfg[type] ?? fallback;
  }

  getConfigSignal() {
    return this.config.asReadonly();
  }

  getEditorConfig(): Readonly<EditorConfig> {
    return this.editorConfig();
  }

  getEditorConfigSignal() {
    return this.editorConfig.asReadonly();
  }

  updateConfig(partialConfig: Partial<WhiteboardConfig>, emitEvent = true): void {
    this.config.update((current) => applyThemeColors(current, { ...current, ...partialConfig }));

    const hasZoomRelatedChanges = 'zoom' in partialConfig;

    if (this.eventsHeld) {
      this.heldZoomChange ||= hasZoomRelatedChanges;
      this.heldConfigChange ||= emitEvent;
      return;
    }

    if (hasZoomRelatedChanges) {
      const config = this.config();
      this.eventBusService.emit(WhiteboardEvent.ZoomChange, {
        zoom: config.zoom,
      });
    }
    if (emitEvent) {
      this.eventBusService.emit(WhiteboardEvent.ConfigChange, this.config());
    }
  }

  /**
   * Coalesce the ZoomChange/ConfigChange events of `updateConfig` until {@link releaseEvents},
   * e.g. for the per-frame updates of a pinch. The config itself still updates immediately.
   */
  holdEvents(): void {
    this.eventsHeld = true;
  }

  /** Stop holding and emit at most one ZoomChange and one ConfigChange for the held updates. */
  releaseEvents(): void {
    if (!this.eventsHeld) return;
    const zoomChanged = this.heldZoomChange;
    const configChanged = this.heldConfigChange;
    this.eventsHeld = false;
    this.heldZoomChange = false;
    this.heldConfigChange = false;

    if (zoomChanged) {
      this.eventBusService.emit(WhiteboardEvent.ZoomChange, { zoom: this.config().zoom });
    }
    if (configChanged) {
      this.eventBusService.emit(WhiteboardEvent.ConfigChange, this.config());
    }
  }

  isConfigDifferent(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): boolean {
    return this.config()[key] !== value;
  }

  updateConfigValue(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): void {
    this.config.update((current) => applyThemeColors(current, { ...current, [key]: value }));
    this.eventBusService.emit(WhiteboardEvent.ConfigChange, this.config());
  }

  updateEditorConfigValue(key: keyof EditorConfig, value: EditorConfig[keyof EditorConfig]): void {
    this.editorConfig.update((current) => ({ ...current, [key]: value }));
  }

  checkAndUpdateConfig(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): void {
    if (this.isConfigDifferent(key, value)) {
      this.updateConfigValue(key, value);
    }
  }

  getConfigValue<K extends keyof WhiteboardConfig>(key: K): WhiteboardConfig[K] {
    return this.config()[key];
  }

  setConfigValue<K extends keyof WhiteboardConfig>(key: K, value: WhiteboardConfig[K]): void {
    this.config.update((current) => applyThemeColors(current, { ...current, [key]: value }));
    this.eventBusService.emit(WhiteboardEvent.ConfigChange, this.config());
  }

  getConfigKeys(): (keyof WhiteboardConfig)[] {
    return Object.keys(this.config()) as (keyof WhiteboardConfig)[];
  }

  getConfigValues(): WhiteboardConfig[keyof WhiteboardConfig][] {
    return Object.values(this.config()) as WhiteboardConfig[keyof WhiteboardConfig][];
  }
}
