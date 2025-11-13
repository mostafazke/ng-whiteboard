import { PenElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ElementType, PointerInfo, ToolType, WhiteboardElementStyle, PenThickness } from '../types';
import { getPresetForType } from '../types/pen-presets';
import { StrokeOptions } from '../utils/drawing';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';
import { ApiService } from '../api/api.service';

export class PenTool extends BaseTool {
  type = ToolType.Pen;
  override baseCursor = CursorType.Crosshair;
  element: PenElement | null = null;

  constructor(apiService: ApiService) {
    super(apiService);
  }

  private getCurrentPathOptions(): StrokeOptions {
    const penType = this.whiteboardConfig.penType;
    const preset = getPresetForType(penType, PenThickness.Medium);

    const strokeOptions = preset.strokeOptions;

    return {
      smoothing: strokeOptions.smoothing || 0.5,
      streamline: strokeOptions.streamline || 0.5,
      thinning: strokeOptions.thinning || 0.5,
      simulatePressure: strokeOptions.simulatePressure !== undefined ? strokeOptions.simulatePressure : true,
      size: strokeOptions.size || 16,
      easing: strokeOptions.easing || ((t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)),
      start: strokeOptions.start || { cap: true, taper: 0.3 },
      end: strokeOptions.end || { cap: true, taper: 0.4 },
    };
  }

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    const point = this.getPointerPosition(event);
    const currentPathOptions = this.getCurrentPathOptions();
    const initialPoints = [[point.x, point.y]] as [number, number][];

    this.element = createElement(
      ElementType.Pen,
      {
        points: initialPoints,
        pathOptions: currentPathOptions,
        isComplete: false,
        style: this.getElementStyle(),
        zIndex: this.apiService.getNextZIndex(),
      },
      this.apiService.getActiveLayerId()
    );

    this.apiService.addDraftElements([this.element]);
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.active || !this.element) return;

    const { x, y } = this.getPointerPosition(event);
    const points = [...this.element.points, [x, y]] as [number, number][];

    this.element.points = points;

    this.apiService.updateDraftElements([
      {
        id: this.element.id,
        points,
      },
    ]);
  }

  override handlePointerUp(): void {
    if (!this.active) return;
    if (this.element) {
      const element = this.element;

      this.apiService.updateDraftElements([
        {
          id: element.id,
          isComplete: true,
        },
      ]);

      this.apiService.commitDraftElements();

      if (element.selectAfterDraw) {
        this.apiService.selectElements([element.id]);
      }

      this.element = null;
    }
  }

  private getElementStyle(): WhiteboardElementStyle {
    const penType = this.whiteboardConfig.penType;
    const preset = getPresetForType(penType, PenThickness.Medium);

    return {
      strokeColor: this.whiteboardConfig.strokeColor,
      strokeWidth: this.whiteboardConfig.strokeWidth,
      lineCap: this.whiteboardConfig.lineCap,
      lineJoin: this.whiteboardConfig.lineJoin,
      dasharray: this.whiteboardConfig.dasharray,
      dashoffset: this.whiteboardConfig.dashoffset,
      opacity: preset.opacity,
    };
  }
}
