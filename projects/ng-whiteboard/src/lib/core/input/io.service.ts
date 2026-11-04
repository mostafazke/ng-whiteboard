import { Injectable } from '@angular/core';
import { createElement } from '../elements/element.utils';
import { EventBusService } from '../event-bus/event-bus.service';
import { AddImage, ElementType, ExportOptions, FormatType, WhiteboardConfig, WhiteboardElement } from '../types';
import { WhiteboardEvent } from '../types/events';
import { downloadFile } from '../utils/common';
import { svgToBase64 } from '../utils/svg';
import { exportBounds, ExportBox } from '../utils/svg/export-bounds';
import { buildExportSvg } from '../utils/svg/export-svg';
import { canCopyImage, dataUrlToBlob } from '../utils/dom/clipboard';
import { effectiveLayerId } from '../utils/layers/layer-membership';
import {
  boardFileKind,
  bytesToDataUrl,
  dataUrlToBytes,
  embedBoardDataInPng,
  embedBoardDataInSvg,
  readBoardDataFromFile,
} from '../utils/files/board-data';
import { CanvasService } from '../canvas/canvas.service';
import { ElementsService } from '../elements/elements.service';
import { SelectionService } from '../elements/selection.service';
import { FILE_TYPE_PREFIX } from '../constants';
import { PanService } from '../viewport/pan.service';
import { ZoomService } from '../viewport/zoom.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { ConfigService } from '../config/config.service';
import { isTheme } from '../config/theme-colors';
import { HistoryService } from '../history/history.service';

const MAX_EXPORT_SIDE = 16384;
const MAX_EXPORT_AREA = 268435456;
const DEFAULT_EXPORT_PADDING = 16;

/**
 * Handles import/export operations for the whiteboard including images, state serialization, and various export formats.
 */
@Injectable({ providedIn: 'root' })
export class IOService {
  constructor(
    private elementsService: ElementsService,
    private canvasService: CanvasService,
    private zoomService: ZoomService,
    private panService: PanService,
    private eventBusService: EventBusService,
    private selectionService: SelectionService,
    private layerManagementService: LayerManagementService,
    private configService: ConfigService,
    private historyService: HistoryService
  ) {}

  addImage(imageInfo: AddImage): void {
    const tempImg = new Image();

    tempImg.onload = () => {
      const { canvasHeight } = this.canvasService.getConfig();
      const imageWidth = tempImg.width;
      const imageHeight = tempImg.height;
      const aspectRatio = tempImg.width / tempImg.height;

      const height = imageHeight > canvasHeight ? canvasHeight - 40 : imageHeight;
      const width = height === canvasHeight - 40 ? (canvasHeight - 40) * aspectRatio : imageWidth;

      let x = (imageInfo.x || 0) - (imageInfo.center ? width / 2 : 0);
      let y = (imageInfo.y || 0) - (imageInfo.center ? height / 2 : 0);

      if (x < 0) x = 0;
      if (y < 0) y = 0;

      const element = createElement(ElementType.Image, {
        src: imageInfo.image,
        width,
        height,
        x,
        y,
        zIndex: this.elementsService.getNextZIndex(),
      });

      this.elementsService.addElements([element]);

      // Config-aware select-after-draw (see ConfigService.resolveSelectAfterDraw). Selection no
      // longer forces the Select tool — selecting is selection state only now.
      if (this.configService.resolveSelectAfterDraw(element.type, element.selectAfterDraw ?? false)) {
        this.selectionService.selectElements([element.id]);
      }

      this.eventBusService.emit(WhiteboardEvent.ImageAdded, element.src);
    };

    tempImg.onerror = () => {
      console.error('Failed to load image');
    };

    tempImg.src = imageInfo.image as string;
  }

  /**
   * Open the browser's file picker and add the chosen image. Without a position the image is
   * centered in the visible viewport. Must run from a user gesture or the browser blocks the picker.
   */
  pickImage(at?: { x: number; y: number }): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (at) {
        void this.importImageFile(file, at.x, at.y);
        return;
      }
      const b = this.canvasService.getVisibleBounds();
      void this.importImageFile(file, (b.left + b.right) / 2, (b.top + b.bottom) / 2, true);
    };
    input.click();
  }

  importImageFile(file: File, x?: number, y?: number, center = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith(FILE_TYPE_PREFIX.IMAGE)) {
        reject(new Error('Invalid file type. Only images are supported.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (result) {
          this.addImage({
            image: result,
            x,
            y,
            center,
          });
          resolve();
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  async importImageFromUrl(url: string, x?: number, y?: number): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const result = event.target?.result;
          if (result) {
            this.addImage({
              image: result,
              x,
              y,
            });
            resolve();
          } else {
            reject(new Error('Failed to process URL'));
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to process URL'));
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to load image from URL: ${error}`);
    }
  }

  /**
   * Exports the board. Raster formats are clamped to 16384px per side and 268,435,456 px in total.
   * For `FormatType.Svg` the vector is downloaded as is, and the returned string is the SVG data URL.
   * With `embedBoardData`, PNG and SVG output also carries the board so `importDataFromFile` can reopen it.
   */
  async save(format: FormatType = FormatType.Base64, name = 'New board', options: ExportOptions = {}): Promise<string> {
    const { svgString, width, height } = this.buildExport(options);
    const embed = options.embedBoardData === true;

    try {
      if (format === FormatType.Svg) {
        const imgSrc = this.svgDataUrl(embed ? embedBoardDataInSvg(svgString, this.exportData()) : svgString);
        this.downloadFile(imgSrc, name, 'svg');
        this.eventBusService.emit(WhiteboardEvent.Save, imgSrc);
        return imgSrc;
      }

      let imageString = await svgToBase64(svgString, width, height, format);
      if (embed && format === FormatType.Png) {
        imageString = bytesToDataUrl(embedBoardDataInPng(dataUrlToBytes(imageString), this.exportData()), 'image/png');
      }

      if (format !== FormatType.Base64) {
        this.downloadFile(imageString, name, this.getFileExtension(format));
      }
      this.eventBusService.emit(WhiteboardEvent.Save, imageString);

      return imageString;
    } catch (error) {
      console.error('Failed to save whiteboard:', error);
      throw error;
    }
  }

  async renderExport(
    format: FormatType.Png | FormatType.Svg,
    options: ExportOptions = {}
  ): Promise<{ dataUrl: string; width: number; height: number }> {
    const { svgString, width, height } = this.buildExport(options);
    const dataUrl =
      format === FormatType.Svg ? this.svgDataUrl(svgString) : await svgToBase64(svgString, width, height, format);
    return { dataUrl, width, height };
  }

  async copyToClipboard(format: FormatType.Png | FormatType.Svg, options: ExportOptions = {}): Promise<void> {
    if (format === FormatType.Svg) {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard is not supported in this browser');
      }
      await navigator.clipboard.writeText(this.buildExport(options).svgString);
      return;
    }

    if (!canCopyImage()) {
      throw new Error('Copying images to the clipboard is not supported in this browser');
    }
    const blob = this.renderExport(FormatType.Png, options).then(({ dataUrl }) => dataUrlToBlob(dataUrl));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  }

  private roundOutward(box: ExportBox): ExportBox {
    const x = Math.floor(box.x);
    const y = Math.floor(box.y);
    return {
      x,
      y,
      width: Math.ceil(box.x + box.width) - x,
      height: Math.ceil(box.y + box.height) - y,
    };
  }

  private svgDataUrl(svgString: string): string {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  }

  private getExportableElements(onlySelected: boolean): WhiteboardElement[] {
    const layers = this.layerManagementService.layers();
    const visible = this.elementsService.getElements().filter((element) => {
      if (element.isDeleting) return false;
      const layerId = effectiveLayerId(element, layers);
      return !layerId || !!layers.find((l) => l.id === layerId)?.visible;
    });
    if (!onlySelected) return visible;

    const selected = new Set(this.selectionService.getSelectedIds());
    const picked = visible.filter((element) => selected.has(element.id));
    return picked.length > 0 ? picked : visible;
  }

  private buildExport(options: ExportOptions): { svgString: string; width: number; height: number } {
    const svgElement = this.canvasService.getCanvas().getElementById('svgcontent') as SVGSVGElement;
    if (!svgElement) {
      throw new Error('SVG content not found');
    }

    const { background = true, onlySelected = false } = options;
    const scale =
      typeof options.scale === 'number' && Number.isFinite(options.scale) && options.scale > 0 ? options.scale : 1;
    const padding =
      typeof options.padding === 'number' && Number.isFinite(options.padding) && options.padding >= 0
        ? options.padding
        : DEFAULT_EXPORT_PADDING;
    const exportable = this.getExportableElements(onlySelected);
    const { canvasWidth, canvasHeight } = this.canvasService.getConfig();
    const tight = exportBounds(exportable, padding);
    const box: ExportBox = tight ? this.roundOutward(tight) : { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    const fit = Math.min(
      scale,
      MAX_EXPORT_SIDE / box.width,
      MAX_EXPORT_SIDE / box.height,
      Math.sqrt(MAX_EXPORT_AREA / (box.width * box.height))
    );
    const round = fit < scale ? Math.floor : Math.round;
    const width = Math.max(1, round(box.width * fit));
    const height = Math.max(1, round(box.height * fit));

    const clone = buildExportSvg(svgElement, {
      box,
      width,
      height,
      keepElementIds: new Set(exportable.map((e) => e.id)),
      background,
    });

    return { svgString: new XMLSerializer().serializeToString(clone), width, height };
  }

  async exportAsPng(name = 'whiteboard'): Promise<string> {
    return this.save(FormatType.Png, name);
  }

  async exportAsJpeg(name = 'whiteboard'): Promise<string> {
    return this.save(FormatType.Jpeg, name);
  }

  async exportAsSvg(name = 'whiteboard'): Promise<string> {
    return this.save(FormatType.Svg, name);
  }

  async exportAsBase64(): Promise<string> {
    return this.save(FormatType.Base64);
  }

  exportData(): string {
    const elements = this.elementsService.getElements();
    const canvasConfig = this.canvasService.getConfig();
    const layerState = this.layerManagementService.exportLayerState(elements);
    const editorConfig = this.configService.getEditorConfig();

    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      elements: elements,
      layers: layerState,
      canvas: {
        width: canvasConfig.canvasWidth,
        height: canvasConfig.canvasHeight,
        backgroundColor: canvasConfig.backgroundColor,
        fullScreen: canvasConfig.fullScreen,
        center: canvasConfig.center,
      },
      viewport: {
        zoom: canvasConfig.zoom,
        x: canvasConfig.x,
        y: canvasConfig.y,
        canvasX: canvasConfig.canvasX,
        canvasY: canvasConfig.canvasY,
      },
      drawing: {
        strokeColor: canvasConfig.strokeColor,
        strokeWidth: canvasConfig.strokeWidth,
        fill: canvasConfig.fill,
        lineJoin: canvasConfig.lineJoin,
        lineCap: canvasConfig.lineCap,
        dasharray: canvasConfig.dasharray,
        dashoffset: canvasConfig.dashoffset,
        penType: canvasConfig.penType,
      },
      grid: {
        enabled: canvasConfig.enableGrid,
        size: canvasConfig.gridSize,
        snapToGrid: canvasConfig.snapToGrid,
      },
      text: {
        fontFamily: canvasConfig.fontFamily,
        fontSize: canvasConfig.fontSize,
      },
      editor: { title: editorConfig.title },
      settings: {
        drawingEnabled: canvasConfig.drawingEnabled,
        keyboardShortcutsEnabled: canvasConfig.keyboardShortcutsEnabled,
        ...(canvasConfig.theme ? { theme: canvasConfig.theme } : {}),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  exportDataAsFile(filename = 'whiteboard-export'): void {
    const jsonData = this.exportData();
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
    this.downloadFile(dataUrl, filename, 'json');
    this.eventBusService.emit(WhiteboardEvent.Save, jsonData);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error('Invalid data format: elements array not found');
      }

      const before = this.elementsService.getElements();
      const batch = this.historyService.startBatch(
        'Open board',
        before,
        this.layerManagementService.exportLayerState(before)
      );
      try {
        this.elementsService.clear();

        if (data.layers) {
          this.layerManagementService.importLayerState(data.layers);
        } else {
          this.layerManagementService.reset();
        }

        this.elementsService.setElements(data.elements);
      } finally {
        const after = this.elementsService.getElements();
        batch.execute(after, this.layerManagementService.exportLayerState(after));
      }

      if (data.canvas) {
        const { canvas } = data;

        if (canvas.width && canvas.height) {
          this.canvasService.setCanvasDimensions(canvas.width, canvas.height);
        }

        if (canvas.backgroundColor !== undefined) {
          this.configService.updateConfig({ backgroundColor: canvas.backgroundColor }, false);
        }

        if (canvas.fullScreen !== undefined) {
          this.configService.updateConfig({ fullScreen: canvas.fullScreen }, false);
        }

        if (canvas.center !== undefined) {
          this.configService.updateConfig({ center: canvas.center }, false);
        }
      }

      if (data.viewport) {
        const { viewport } = data;

        if (viewport.zoom !== undefined) {
          this.zoomService.zoom(viewport.zoom);
        }

        if (viewport.x !== undefined && viewport.y !== undefined) {
          this.panService.panTo(viewport.x, viewport.y);
        }

        if (viewport.canvasX !== undefined && viewport.canvasY !== undefined) {
          this.configService.updateConfig(
            {
              canvasX: viewport.canvasX,
              canvasY: viewport.canvasY,
            },
            false
          );
        }
      }

      if (data.drawing) {
        const { drawing } = data;
        const drawingConfig: Partial<WhiteboardConfig> = {};

        if (drawing.strokeColor !== undefined) drawingConfig.strokeColor = drawing.strokeColor;
        if (drawing.strokeWidth !== undefined) drawingConfig.strokeWidth = drawing.strokeWidth;
        if (drawing.fill !== undefined) drawingConfig.fill = drawing.fill;
        if (drawing.lineJoin !== undefined) drawingConfig.lineJoin = drawing.lineJoin;
        if (drawing.lineCap !== undefined) drawingConfig.lineCap = drawing.lineCap;
        if (drawing.dasharray !== undefined) drawingConfig.dasharray = drawing.dasharray;
        if (drawing.dashoffset !== undefined) drawingConfig.dashoffset = drawing.dashoffset;
        if (drawing.penType !== undefined) drawingConfig.penType = drawing.penType;

        this.configService.updateConfig(drawingConfig, false);
      }

      if (data.grid) {
        const { grid } = data;
        const gridConfig: Partial<WhiteboardConfig> = {};

        if (grid.enabled !== undefined) gridConfig.enableGrid = grid.enabled;
        if (grid.size !== undefined) gridConfig.gridSize = grid.size;
        if (grid.snapToGrid !== undefined) gridConfig.snapToGrid = grid.snapToGrid;

        this.configService.updateConfig(gridConfig, false);
      }

      if (data.text) {
        const { text } = data;
        const textConfig: Partial<WhiteboardConfig> = {};

        if (text.fontFamily !== undefined) textConfig.fontFamily = text.fontFamily;
        if (text.fontSize !== undefined) textConfig.fontSize = text.fontSize;

        this.configService.updateConfig(textConfig, false);
      }

      if (data.editor) {
        if (typeof data.editor.title === 'string') {
          this.configService.updateEditorConfigValue('title', data.editor.title);
        }
      }

      if (data.settings) {
        const { settings } = data;
        const settingsConfig: Partial<WhiteboardConfig> = {};

        if (settings.drawingEnabled !== undefined) settingsConfig.drawingEnabled = settings.drawingEnabled;
        if (settings.keyboardShortcutsEnabled !== undefined) {
          settingsConfig.keyboardShortcutsEnabled = settings.keyboardShortcutsEnabled;
        }
        if (isTheme(settings.theme)) settingsConfig.theme = settings.theme;

        this.configService.updateConfig(settingsConfig, false);
      }

      this.configService.updateConfig({}, true);
      this.eventBusService.emit(WhiteboardEvent.ElementsAdded, data.elements);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  /** Opens a `.json` board file, or a PNG/SVG image exported with board data. */
  async importDataFromFile(file: File): Promise<void> {
    if (!boardFileKind(file)) {
      throw new Error('Invalid file type. Only board files (.json) and exported PNG or SVG images are supported.');
    }
    const json = await readBoardDataFromFile(file);
    if (!json) throw new Error('This image has no board data.');
    this.importData(json);
  }

  private downloadFile(dataUrl: string, name: string, extension: string): void {
    const fileName = `${name}.${extension}`;
    downloadFile(dataUrl, fileName);
  }

  private getFileExtension(format: FormatType): string {
    switch (format) {
      case FormatType.Png:
        return 'png';
      case FormatType.Jpeg:
        return 'jpg';
      case FormatType.Svg:
        return 'svg';
      case FormatType.Base64:
        return 'txt';
      default:
        return 'png';
    }
  }

  async importMultipleImages(files: FileList, spacing = 50): Promise<void> {
    const promises: Promise<void>[] = [];
    let currentX = 0;
    let currentY = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      promises.push(this.importImageFile(file, currentX, currentY));

      currentX += 200 + spacing;
      if (currentX > 800) {
        currentX = 0;
        currentY += 200 + spacing;
      }
    }

    await Promise.all(promises);
  }

  protected processImage(imageData: string): string {
    return imageData;
  }
}
