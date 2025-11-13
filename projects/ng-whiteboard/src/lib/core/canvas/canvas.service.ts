import { Injectable, Renderer2, RendererFactory2, Signal, computed } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardConfig } from '../types';
import { WhiteboardEvent } from '../types/events';

@Injectable({ providedIn: 'root' })
export class CanvasService {
  private renderer: Renderer2;
  private svgContainer: SVGSVGElement | null = null;

  private transform = computed(() => {
    const { zoom, x, y } = this.getConfig();
    return `translate(${x}, ${y}) scale(${zoom})`;
  });

  constructor(
    private configService: ConfigService,
    private eventBusService: EventBusService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  initializeCanvas(svgContainer: SVGSVGElement): void {
    this.svgContainer = svgContainer;
    const { fullScreen, center } = this.getConfig();

    if (!fullScreen && center) {
      setTimeout(() => {
        this.centerCanvas();
      }, 0);
    }

    this.eventBusService.emit(WhiteboardEvent.Ready);
  }

  getCanvas(): SVGSVGElement {
    if (!this.svgContainer) {
      throw new Error('SVG container not initialized');
    }
    return this.svgContainer;
  }

  isCanvasInitialized(): boolean {
    return this.svgContainer !== null;
  }

  getConfig(): WhiteboardConfig {
    return this.configService.getConfig();
  }

  setCanvasDimensions(width: number, height: number): void {
    this.configService.updateConfig({ canvasWidth: width, canvasHeight: height });
  }

  setCanvasPosition(x: number, y: number): void {
    this.configService.updateConfig({ x, y });
  }

  getCanvasDimensions(): { width: number; height: number } {
    const config = this.getConfig();
    return {
      width: config.canvasWidth,
      height: config.canvasHeight,
    };
  }

  getCanvasPosition(): { x: number; y: number } {
    const config = this.getConfig();
    return { x: config.x, y: config.y };
  }

  getContainerDimensions(): { width: number; height: number } {
    if (!this.svgContainer) {
      return { width: 0, height: 0 };
    }

    return {
      width: this.svgContainer.clientWidth || 0,
      height: this.svgContainer.clientHeight || 0,
    };
  }

  fullScreen(): void {
    const { width, height } = this.getContainerDimensions();

    this.setCanvasDimensions(width, height);
    this.configService.updateConfig({ fullScreen: true });
    this.centerCanvas();
  }

  exitFullScreen(defaultWidth = 800, defaultHeight = 600): void {
    this.setCanvasDimensions(defaultWidth, defaultHeight);

    this.configService.updateConfig({
      fullScreen: false,
      zoom: 1,
    });

    this.centerCanvas();
  }

  centerCanvas(): void {
    const { fullScreen } = this.getConfig();

    if (fullScreen) {
      this.configService.updateConfig({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
    } else {
      const { canvasWidth, canvasHeight, zoom, center } = this.getConfig();
      const { width: containerWidth, height: containerHeight } = this.getContainerDimensions();

      const scaledWidth = canvasWidth * zoom;
      const scaledHeight = canvasHeight * zoom;

      const canvasX = (containerWidth - scaledWidth) / 2;
      const canvasY = (containerHeight - scaledHeight) / 2;

      const x = center ? canvasWidth / 2 : 0;
      const y = center ? canvasHeight / 2 : 0;

      this.configService.updateConfig({ x, y, canvasX, canvasY });
    }
  }

  resetCanvas(): void {
    this.configService.updateConfig({
      x: 0,
      y: 0,
      zoom: 1,
      canvasX: 0,
      canvasY: 0,
    });
  }

  toggleGrid(): void {
    const { enableGrid } = this.getConfig();
    this.configService.updateConfig({ enableGrid: !enableGrid });
  }

  setGridVisible(visible: boolean): void {
    this.configService.updateConfig({ enableGrid: visible });
  }

  setGridSize(size: number): void {
    this.configService.updateConfig({ gridSize: size });
  }

  toggleSnapToGrid(): void {
    const { snapToGrid } = this.getConfig();
    this.configService.updateConfig({ snapToGrid: !snapToGrid });
  }

  getTransform(): Signal<string> {
    return this.transform;
  }

  getTransformString(): string {
    return this.transform();
  }

  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    const { zoom, x, y } = this.getConfig();

    return {
      x: (screenX - x) / zoom,
      y: (screenY - y) / zoom,
    };
  }

  canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    const { zoom, x, y } = this.getConfig();

    return {
      x: canvasX * zoom + x,
      y: canvasY * zoom + y,
    };
  }

  getVisibleBounds(): { left: number; top: number; right: number; bottom: number } {
    const { zoom, x, y } = this.getConfig();
    const { width, height } = this.getContainerDimensions();

    return {
      left: -x / zoom,
      top: -y / zoom,
      right: (-x + width) / zoom,
      bottom: (-y + height) / zoom,
    };
  }

  isPointVisible(x: number, y: number): boolean {
    const bounds = this.getVisibleBounds();
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  isRectVisible(x: number, y: number, width: number, height: number): boolean {
    const bounds = this.getVisibleBounds();

    return !(x + width < bounds.left || x > bounds.right || y + height < bounds.top || y > bounds.bottom);
  }

  getCanvasDimensionsProvider(): () => { width: number; height: number } {
    return () => this.getCanvasDimensions();
  }

  getContainerDimensionsProvider(): () => { width: number; height: number } {
    return () => this.getContainerDimensions();
  }

  protected transformCoordinates(x: number, y: number): { x: number; y: number } {
    return { x, y };
  }

  protected validateZoom(zoom: number): number {
    return Math.max(0.1, Math.min(10, zoom));
  }
}
