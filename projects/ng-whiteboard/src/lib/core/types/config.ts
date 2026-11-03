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
  'none' | 'arrow' | 'open-arrow' | 'diamond' | 'open-diamond' | 'circle' | 'open-circle' | 'bar';

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
  /** Color theme for the canvas and editor UI */
  theme?: 'light' | 'dark';
  /** Default corner radius for new rectangles; 5 when unset */
  cornerRadius?: number;
}

export const DEFAULT_CORNER_RADIUS = 5;

export interface EditorConfig {
  title: string;
  /** @deprecated unused; removed in next major */
  showTitle?: boolean;
  /** @deprecated unused; removed in next major */
  showZoom?: boolean;
  /** @deprecated unused; removed in next major */
  showLayers?: boolean;
  /** @deprecated unused; removed in next major */
  showTools?: boolean;
  /** @deprecated unused; removed in next major */
  showGrid?: boolean;
  /** @deprecated unused; removed in next major */
  showBackground?: boolean;
  /** @deprecated unused; removed in next major */
  showStroke?: boolean;
  /** @deprecated unused; removed in next major */
  showFill?: boolean;
  /** @deprecated unused; removed in next major */
  showOpacity?: boolean;
  /** @deprecated unused; removed in next major */
  showFont?: boolean;
  /** @deprecated unused; removed in next major */
  showDash?: boolean;
  /** @deprecated unused; removed in next major */
  showEraser?: boolean;
  /** @deprecated unused; removed in next major */
  showUndo?: boolean;
  /** @deprecated unused; removed in next major */
  showRedo?: boolean;
  /** @deprecated unused; removed in next major */
  showClear?: boolean;
  /** @deprecated unused; removed in next major */
  showSave?: boolean;
  /** @deprecated unused; removed in next major */
  showLoad?: boolean;
  /** @deprecated unused; removed in next major */
  showExport?: boolean;
  /** @deprecated unused; removed in next major */
  showImport?: boolean;
  /** @deprecated unused; removed in next major */
  showShare?: boolean;
  /** @deprecated unused; removed in next major */
  showSettings?: boolean;
  /** @deprecated unused; removed in next major */
  showHelp?: boolean;
  /** @deprecated unused; removed in next major */
  showAbout?: boolean;
  /** @deprecated unused; removed in next major */
  showFeedback?: boolean;
  /** @deprecated unused; removed in next major */
  showSupport?: boolean;
  /** @deprecated unused; removed in next major */
  showContact?: boolean;
  /** @deprecated unused; removed in next major */
  showPrivacy?: boolean;
  /** @deprecated unused; removed in next major */
  showTerms?: boolean;
  /** @deprecated unused; removed in next major */
  showLicense?: boolean;
  /** @deprecated unused; removed in next major */
  showAttribution?: boolean;
  /** @deprecated unused; removed in next major */
  showCredits?: boolean;
  /** @deprecated unused; removed in next major */
  showChangelog?: boolean;
  /** @deprecated unused; removed in next major */
  showReleaseNotes?: boolean;
  /** @deprecated unused; removed in next major */
  showRoadmap?: boolean;
  /** @deprecated unused; removed in next major */
  showBlog?: boolean;
  /** @deprecated unused; removed in next major */
  showForum?: boolean;
  /** @deprecated unused; removed in next major */
  showCommunity?: boolean;
  /** @deprecated unused; removed in next major */
  showEvents?: boolean;
  /** @deprecated unused; removed in next major */
  showWebinars?: boolean;
  /** @deprecated unused; removed in next major */
  showWorkshops?: boolean;
  /** @deprecated unused; removed in next major */
  showTutorials?: boolean;
  /** @deprecated unused; removed in next major */
  showDocumentation?: boolean;
  /** @deprecated unused; removed in next major */
  showAPI?: boolean;
  /** @deprecated unused; removed in next major */
  showSDK?: boolean;
  /** @deprecated unused; removed in next major */
  showCLI?: boolean;
  /** @deprecated unused; removed in next major */
  showPlugins?: boolean;
  /** @deprecated unused; removed in next major */
  showExtensions?: boolean;
  /** @deprecated unused; removed in next major */
  showIntegrations?: boolean;
  /** @deprecated unused; removed in next major */
  showAddons?: boolean;
  /** @deprecated unused; removed in next major */
  showThemes?: boolean;
  /** @deprecated unused; removed in next major */
  showTemplates?: boolean;
  /** @deprecated unused; removed in next major */
  showSnippets?: boolean;
  /** @deprecated unused; removed in next major */
  showExamples?: boolean;
  /** @deprecated unused; removed in next major */
  showDemos?: boolean;
  /** @deprecated unused; removed in next major */
  showSamples?: boolean;
  /** @deprecated unused; removed in next major */
  showShowcases?: boolean;
  /** @deprecated unused; removed in next major */
  showPortfolios?: boolean;
  /** @deprecated unused; removed in next major */
  showCaseStudies?: boolean;
  /** @deprecated unused; removed in next major */
  showSuccessStories?: boolean;
  /** @deprecated unused; removed in next major */
  showTestimonials?: boolean;
  /** @deprecated unused; removed in next major */
  showReviews?: boolean;
  /** @deprecated unused; removed in next major */
  showRatings?: boolean;
  /** @deprecated unused; removed in next major */
  showComparisons?: boolean;
  /** @deprecated unused; removed in next major */
  showAlternatives?: boolean;
  /** @deprecated unused; removed in next major */
  showInsights?: boolean;
  /** @deprecated unused; removed in next major */
  enableEditor?: boolean;
  /** @deprecated use WhiteboardConfig.theme */
  theme?: 'light' | 'dark';
}
