import { Injectable } from '@angular/core';
import { createElement } from '../elements/element.utils';
import { EventBusService } from '../event-bus/event-bus.service';
import { AddImage, ElementType, FormatType, WhiteboardConfig, EditorConfig } from '../types';
import { WhiteboardEvent } from '../types/events';
import { downloadFile } from '../utils/common';
import { svgToBase64 } from '../utils/svg';
import { CanvasService } from '../canvas/canvas.service';
import { ElementsService } from '../elements/elements.service';
import { SelectionService } from '../elements/selection.service';
import { PanService } from '../viewport/pan.service';
import { ZoomService } from '../viewport/zoom.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { ConfigService } from '../config/config.service';

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
    private configService: ConfigService
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

      let x = imageInfo.x || 0;
      let y = imageInfo.y || 0;

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

      if (element.selectAfterDraw) {
        this.selectionService.selectElements([element.id]);
      }

      this.eventBusService.emit(WhiteboardEvent.ImageAdded, element.src);
    };

    tempImg.onerror = () => {
      console.error('Failed to load image');
    };

    tempImg.src = imageInfo.image as string;
  }

  importImageFile(file: File, x?: number, y?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
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

  async save(format: FormatType = FormatType.Base64, name = 'New board'): Promise<string> {
    const canvas = this.canvasService.getCanvas();
    const svgElement = canvas.getElementById('svgcontent') as SVGSVGElement;

    if (!svgElement) {
      throw new Error('SVG content not found');
    }

    const svgClone = this.prepareSvgForExport(svgElement);
    const svgString = new XMLSerializer().serializeToString(svgClone);

    const { canvasWidth, canvasHeight } = this.canvasService.getConfig();

    try {
      const imageString = await svgToBase64(svgString, canvasWidth, canvasHeight, format);

      switch (format) {
        case FormatType.Base64:
          this.eventBusService.emit(WhiteboardEvent.Save, imageString);
          break;

        case FormatType.Svg: {
          const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
          this.downloadFile(imgSrc, name, 'svg');
          this.eventBusService.emit(WhiteboardEvent.Save, imgSrc);
          break;
        }

        default:
          this.downloadFile(imageString, name, this.getFileExtension(format));
          this.eventBusService.emit(WhiteboardEvent.Save, imageString);
          break;
      }

      return imageString;
    } catch (error) {
      console.error('Failed to save whiteboard:', error);
      throw error;
    }
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
    const layerState = this.layerManagementService.exportLayerState();
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
      editor: editorConfig,
      settings: {
        drawingEnabled: canvasConfig.drawingEnabled,
        keyboardShortcutsEnabled: canvasConfig.keyboardShortcutsEnabled,
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

      this.elementsService.clear();

      if (data.layers) {
        this.layerManagementService.importLayerState(data.layers);
      }

      this.elementsService.setElements(data.elements);

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
        const editorKeys = Object.keys(data.editor) as Array<keyof EditorConfig>;
        editorKeys.forEach((key) => {
          this.configService.updateEditorConfigValue(key, data.editor[key]);
        });
      }

      if (data.settings) {
        const { settings } = data;
        const settingsConfig: Partial<WhiteboardConfig> = {};

        if (settings.drawingEnabled !== undefined) settingsConfig.drawingEnabled = settings.drawingEnabled;
        if (settings.keyboardShortcutsEnabled !== undefined) {
          settingsConfig.keyboardShortcutsEnabled = settings.keyboardShortcutsEnabled;
        }

        this.configService.updateConfig(settingsConfig, false);
      }

      this.configService.updateConfig({}, true);
      this.eventBusService.emit(WhiteboardEvent.ElementsAdded, data.elements);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  importDataFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file.type.includes('json')) {
        reject(new Error('Invalid file type. Only JSON files are supported.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (result && typeof result === 'string') {
          try {
            this.importData(result);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
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

  private prepareSvgForExport(svgElement: SVGSVGElement): SVGSVGElement {
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

    const selectorParentGroup = svgClone.querySelector('#selectorParentGroup');
    if (selectorParentGroup) {
      selectorParentGroup.remove();
    }

    const contentBackground = svgClone.querySelector('#contentBackground');
    if (contentBackground) {
      contentBackground.removeAttribute('opacity');
    }

    svgClone.setAttribute('x', '0');
    svgClone.setAttribute('y', '0');

    return svgClone;
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
