import { ElementType, LineCap, LineJoin, PenType } from '.';

/**
 * Controls what happens after a tool finishes drawing an element:
 * - `true` (for a tool): the new element is selected and the Select tool becomes active.
 * - `false`: nothing is selected and the current drawing tool stays active (draw several in a row).
 * - object: per-element-type overrides (e.g. `{ pen: false, rectangle: true }`).
 * - omitted: falls back to each element's own `selectAfterDraw` default.
 */
export type SelectAfterDrawConfig = boolean | Partial<Record<ElementType, boolean>>;

/**
 * Describes the type of arrowhead.
 * Mirrors ArrowheadType for config usage.
 */
export type ArrowHeadStyle =
  | 'none'
  | 'arrow'
  | 'open-arrow'
  | 'diamond'
  | 'open-diamond'
  | 'circle'
  | 'open-circle'
  | 'bar';

/**
 * Describes the default path style for new arrows.
 */
export type ArrowLineStyle = 'straight' | 'curve' | 'elbow';

export interface ArrowConfig {
  /** Default head style for the start of an arrow */
  startHeadStyle: ArrowHeadStyle;
  /** Default head style for the end of an arrow */
  endHeadStyle: ArrowHeadStyle;
  /** Default line style for new arrows */
  lineStyle: ArrowLineStyle;
}

export const defaultArrowConfig: ArrowConfig = {
  startHeadStyle: 'none',
  endHeadStyle: 'open-arrow',
  lineStyle: 'curve',
};

export interface WhiteboardConfig {
  drawingEnabled: boolean;
  canvasWidth: number;
  canvasHeight: number;
  fullScreen: boolean;
  center: boolean;
  canvasX: number;
  canvasY: number;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  lineJoin: LineJoin;
  lineCap: LineCap;
  fill: string;
  zoom: number;
  fontFamily: string;
  fontSize: number;
  dasharray: string;
  dashoffset: number;
  x: number;
  y: number;
  enableGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  keyboardShortcutsEnabled: boolean;
  penType: PenType;
  /** Minimum distance (in pixels) between points when drawing with the pen tool */
  penThrottlingThreshold: number;
  /** Arrow-specific configuration – heads, line style, size */
  arrowConfig: ArrowConfig;
  /**
   * Post-draw behaviour: whether a freshly drawn element gets selected (and the Select tool
   * activated) or the drawing tool stays active. Global, per-element-type, or omitted to use
   * each element's own default. See {@link SelectAfterDrawConfig}.
   */
  selectAfterDraw?: SelectAfterDrawConfig;
}

export interface EditorConfig {
  title: string;
  showTitle: boolean;
  showZoom: boolean;
  showLayers: boolean;
  showTools: boolean;
  showGrid: boolean;
  showBackground: boolean;
  showStroke: boolean;
  showFill: boolean;
  showOpacity: boolean;
  showFont: boolean;
  showDash: boolean;
  showEraser: boolean;
  showUndo: boolean;
  showRedo: boolean;
  showClear: boolean;
  showSave: boolean;
  showLoad: boolean;
  showExport: boolean;
  showImport: boolean;
  showShare: boolean;
  showSettings: boolean;
  showHelp: boolean;
  showAbout: boolean;
  showFeedback: boolean;
  showSupport: boolean;
  showContact: boolean;
  showPrivacy: boolean;
  showTerms: boolean;
  showLicense: boolean;
  showAttribution: boolean;
  showCredits: boolean;
  showChangelog: boolean;
  showReleaseNotes: boolean;
  showRoadmap: boolean;
  showBlog: boolean;
  showForum: boolean;
  showCommunity: boolean;
  showEvents: boolean;
  showWebinars: boolean;
  showWorkshops: boolean;
  showTutorials: boolean;
  showDocumentation: boolean;
  showAPI: boolean;
  showSDK: boolean;
  showCLI: boolean;
  showPlugins: boolean;
  showExtensions: boolean;
  showIntegrations: boolean;
  showAddons: boolean;
  showThemes: boolean;
  showTemplates: boolean;
  showSnippets: boolean;
  showExamples: boolean;
  showDemos: boolean;
  showSamples: boolean;
  showShowcases: boolean;
  showPortfolios: boolean;
  showCaseStudies: boolean;
  showSuccessStories: boolean;
  showTestimonials: boolean;
  showReviews: boolean;
  showRatings: boolean;
  showComparisons: boolean;
  showAlternatives: boolean;
  showInsights: boolean;
  enableEditor: boolean;
}
