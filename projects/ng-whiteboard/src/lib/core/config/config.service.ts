import { Injectable, signal } from '@angular/core';
import { LineCap, LineJoin, WhiteboardConfig, WhiteboardEvent, EditorConfig, PenType } from '../types';
import { EventBusService } from '../event-bus/event-bus.service';

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
  });

  private editorConfig = signal<EditorConfig>({
    title: 'Whiteboard',
    enableEditor: true,
    // Core panels / features
    showTitle: true,
    showZoom: true,
    showLayers: true,
    showTools: true,
    showGrid: true,
    showBackground: true,
    showStroke: true,
    showFill: true,
    showOpacity: true,
    showFont: true,
    showDash: true,
    showEraser: true,
    showUndo: true,
    showRedo: true,
    showClear: true,
    showSave: true,
    showLoad: false,
    showExport: true,
    showImport: false,
    showShare: false,
    showSettings: false,
    showHelp: false,
    showAbout: false,
    showFeedback: false,
    showSupport: false,
    showContact: false,
    showPrivacy: false,
    showTerms: false,
    showLicense: false,
    showAttribution: false,
    showCredits: false,
    showChangelog: false,
    showReleaseNotes: false,
    showRoadmap: false,
    showBlog: false,
    showForum: false,
    showCommunity: false,
    showEvents: false,
    showWebinars: false,
    showWorkshops: false,
    showTutorials: false,
    showDocumentation: false,
    showAPI: false,
    showSDK: false,
    showCLI: false,
    showPlugins: false,
    showExtensions: false,
    showIntegrations: false,
    showAddons: false,
    showThemes: false,
    showTemplates: false,
    showSnippets: false,
    showExamples: true,
    showDemos: true,
    showSamples: false,
    showShowcases: false,
    showPortfolios: false,
    showCaseStudies: false,
    showSuccessStories: false,
    showTestimonials: false,
    showReviews: false,
    showRatings: false,
    showComparisons: false,
    showAlternatives: false,
    showInsights: false,
  });

  constructor(private eventBusService: EventBusService) {}

  getConfig(): Readonly<WhiteboardConfig> {
    return this.config();
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
    this.config.update((current) => ({ ...current, ...partialConfig }));

    const hasZoomRelatedChanges = 'zoom' in partialConfig;

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

  isConfigDifferent(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): boolean {
    return this.config()[key] !== value;
  }

  updateConfigValue(key: keyof WhiteboardConfig, value: WhiteboardConfig[keyof WhiteboardConfig]): void {
    this.config.update((current) => ({ ...current, [key]: value }));
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
    this.config.update((current) => ({ ...current, [key]: value }));
    this.eventBusService.emit(WhiteboardEvent.ConfigChange, this.config());
  }

  getConfigKeys(): (keyof WhiteboardConfig)[] {
    return Object.keys(this.config()) as (keyof WhiteboardConfig)[];
  }

  getConfigValues(): WhiteboardConfig[keyof WhiteboardConfig][] {
    return Object.values(this.config()) as WhiteboardConfig[keyof WhiteboardConfig][];
  }
}
