import { inject, Injectable, OnDestroy } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '../constants';
import { WhiteboardConfig, WhiteboardElement, WhiteboardEvent } from '../types';
import { CanvasService } from '../canvas/canvas.service';
import { ElementsService } from '../elements/elements.service';
import { SelectionService } from '../elements/selection.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { Subscription } from 'rxjs';

/**
 * Manages zoom operations for the whiteboard canvas including zoom in/out,
 * zoom to fit, zoom to selection, and zoom bounds management.
 */
@Injectable({ providedIn: 'root' })
export class ZoomService implements OnDestroy {
  private canvasService = inject(CanvasService);
  private elementsService = inject(ElementsService);
  private selectionService = inject(SelectionService);
  private configService = inject(ConfigService);
  private eventBusService = inject(EventBusService);
  private readonly DEFAULT_FIT_MARGIN = 0.9;
  private zoomSubscription: Subscription;

  constructor() {
    this.zoomSubscription = this.eventBusService.on(WhiteboardEvent.ZoomChange).subscribe(() => {
      const { center, fullScreen, zoom } = this.getConfig();
      if (center && !fullScreen) {
        this.centerCanvas(zoom);
      }
    });
  }

  ngOnDestroy(): void {
    this.zoomSubscription?.unsubscribe();
  }

  private emitZoomChangeEvent(): void {
    const { zoom } = this.getConfig();
    this.eventBusService.emit(WhiteboardEvent.ZoomChange, {
      zoom,
    });
  }

  private getConfig(): WhiteboardConfig {
    return this.configService.getConfig();
  }

  private centerCanvas(zoom: number): { x: number; y: number } {
    const { canvasWidth, canvasHeight } = this.getConfig();
    const containerDimensions = this.canvasService.getContainerDimensions();
    const newCanvasX = (containerDimensions.width - canvasWidth * zoom) / 2;
    const newCanvasY = (containerDimensions.height - canvasHeight * zoom) / 2;
    this.configService.updateConfig({ canvasX: newCanvasX, canvasY: newCanvasY }, false);
    return { x: newCanvasX, y: newCanvasY };
  }

  /**
   * Set zoom level with optional animation.
   */
  zoom(zoom: number, animated = true, duration = 300): void {
    if (zoom <= 0) {
      return;
    }

    const roundedZoom = Math.round(this.clampZoom(zoom) * 100) / 100;

    if (animated) {
      this.animateToTarget(roundedZoom, duration);
    } else {
      this.setInstant(roundedZoom);
    }
  }

  /**
   * Zoom in by step amount.
   */
  zoomIn(animated = true, duration = 300): void {
    const { zoom } = this.getConfig();
    const newZoom = Math.round((zoom + ZOOM_STEP) * 100) / 100;

    if (newZoom <= MAX_ZOOM) {
      this.zoom(newZoom, animated, duration);
    }
  }

  /**
   * Zoom out by step amount.
   */
  zoomOut(animated = true, duration = 300): void {
    const { zoom } = this.getConfig();
    const newZoom = Math.round((zoom - ZOOM_STEP) * 100) / 100;

    if (newZoom >= MIN_ZOOM) {
      this.zoom(newZoom, animated, duration);
    }
  }

  /**
   * Reset zoom to 100%.
   */
  resetZoom(animated = true, duration = 300): void {
    if (animated) {
      this.animateToTarget(DEFAULT_ZOOM, duration);
    } else {
      this.setInstant(DEFAULT_ZOOM);
    }
  }

  /**
   * Get current zoom level.
   */
  getZoomLevel(): number {
    return this.getConfig().zoom;
  }

  /**
   * Get current zoom level as percentage.
   */
  getZoomPercentage(): number {
    return Math.round(this.getConfig().zoom * 100);
  }

  /**
   * Zoom to fit all elements in the viewport.
   */
  zoomToFit(margin = this.DEFAULT_FIT_MARGIN, animated = true, duration = 300): void {
    const elements = this.elementsService.getElements();

    if (elements.length === 0) {
      // No elements to fit, reset zoom
      this.resetZoom(animated, duration);
      return;
    }

    this.zoomToElements(elements, margin, animated, duration);
  }

  /**
   * Zoom to fit selected elements.
   */
  zoomToSelection(margin = this.DEFAULT_FIT_MARGIN, animated = true, duration = 300): void {
    const selectedElements = this.selectionService.getSelectedElements();

    if (selectedElements.length === 0) {
      return;
    }

    this.zoomToElements(selectedElements, margin, animated, duration);
  }

  /**
   * Zoom to fit specific elements.
   */
  zoomToElements(
    elements: WhiteboardElement[],
    margin = this.DEFAULT_FIT_MARGIN,
    animated = true,
    duration = 300
  ): void {
    if (elements.length === 0) {
      return;
    }

    const bounds = this.elementsService.calculateElementsBounds(elements);
    if (!bounds) {
      return;
    }

    const { fullScreen } = this.getConfig();
    const dimensions = fullScreen
      ? this.canvasService.getContainerDimensions()
      : this.canvasService.getCanvasDimensions();

    // Calculate zoom level to fit elements with padding
    const zoomX = (dimensions.width * margin) / bounds.width;
    const zoomY = (dimensions.height * margin) / bounds.height;
    const targetZoom = Math.min(zoomX, zoomY);

    if (animated) {
      this.animateToTarget(targetZoom, duration);
    } else {
      this.setInstant(targetZoom);
    }
  }

  /**
   * Zoom to fit a specific rectangular area.
   */
  zoomToArea(
    x: number,
    y: number,
    width: number,
    height: number,
    margin = this.DEFAULT_FIT_MARGIN,
    animated = true,
    duration = 300
  ): void {
    const canvasDimensions = this.canvasService.getCanvasDimensions();
    const zoomX = (canvasDimensions.width * margin) / width;
    const zoomY = (canvasDimensions.height * margin) / height;
    const targetZoom = Math.min(zoomX, zoomY);
    if (animated) {
      this.animateToTarget(targetZoom, duration);
    } else {
      this.setInstant(targetZoom);
    }
  }

  /**
   * Get optimal zoom level for given dimensions.
   */
  getOptimalZoom(contentWidth: number, contentHeight: number, margin = this.DEFAULT_FIT_MARGIN): number {
    const canvasDimensions = this.canvasService.getCanvasDimensions();

    const zoomX = canvasDimensions.width / contentWidth;
    const zoomY = canvasDimensions.height / contentHeight;

    return this.clampZoom(Math.min(zoomX, zoomY) * margin);
  }

  /**
   * Clamp zoom value to valid range.
   */
  clampZoom(zoom: number): number {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  }

  /**
   * Check if zoom level is valid.
   */
  isValidZoom(zoom: number): boolean {
    return zoom >= MIN_ZOOM && zoom <= MAX_ZOOM;
  }

  /**
   * Get zoom limits.
   */
  getZoomLimits(): { min: number; max: number } {
    return {
      min: MIN_ZOOM,
      max: MAX_ZOOM,
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private setInstant(targetZoom: number): void {
    const { fullScreen, center } = this.getConfig();
    const validatedZoom = this.clampZoom(targetZoom);

    if (!fullScreen && center) {
      this.centerCanvas(validatedZoom);
    }
    this.configService.updateConfig({ zoom: validatedZoom });
    this.emitZoomChangeEvent();
  }

  private animateToTarget(targetZoom: number, duration = 300): void {
    const { zoom: startZoom, fullScreen, center } = this.getConfig();
    const validatedZoom = this.clampZoom(targetZoom);

    if (!fullScreen && center) {
      this.centerCanvas(validatedZoom);
    }
    // Animation
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeInOutCubic(progress);

      const currentZoom = startZoom + (validatedZoom - startZoom) * easedProgress;
      this.configService.updateConfig({ zoom: currentZoom });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.emitZoomChangeEvent();
      }
    };

    requestAnimationFrame(animate);
  }
}
