import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, combineLatestWith, map, Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { ITEM_PREFIX, MAX_STACK_SIZE } from '../constants';
import { createElement } from '../elements/element.utils';
import { EventBusService } from '../event-bus/event-bus.service';
import { AddImage, ElementType, FormatType, ToolType, WhiteboardConfig, WhiteboardElement } from '../types';
import { WhiteboardEvent } from '../types/events';
import { debounce, downloadFile, svgToBase64 } from '../utils';

@Injectable()
export class DataService {
  private undoStack: WhiteboardElement[][] = [];
  private redoStack: WhiteboardElement[][] = [];
  private initialData: WhiteboardElement[] = [];
  private data: BehaviorSubject<WhiteboardElement[]> = new BehaviorSubject<WhiteboardElement[]>([]);
  private draftData: BehaviorSubject<WhiteboardElement[]> = new BehaviorSubject<WhiteboardElement[]>([]);
  private selectedTool: BehaviorSubject<ToolType> = new BehaviorSubject<ToolType>(ToolType.Pen);
  private selectedElement: BehaviorSubject<WhiteboardElement | null> = new BehaviorSubject<WhiteboardElement | null>(
    null
  );

  svgContainer: SVGSVGElement | null = null;

  data$ = this.data.pipe(
    combineLatestWith(this.draftData),
    map(([data, draftData]) => [...data, ...draftData])
  );
  selectedTool$ = this.selectedTool.asObservable();

  private renderer: Renderer2;

  private debouncedPushToUndo = debounce(this.pushToUndo.bind(this), 300);

  constructor(
    private EventBusService: EventBusService,
    private configService: ConfigService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  // Initialization & Setup

  initializeWhiteboard(svgContainer: SVGSVGElement): void {
    this.svgContainer = svgContainer;
    this.initialData = JSON.parse(JSON.stringify(this.data.getValue()));
    this.EventBusService.emit(WhiteboardEvent.Ready);
  }

  getCanvas(): SVGSVGElement {
    if (!this.svgContainer) {
      throw new Error('SVG container not initialized');
    }
    return this.svgContainer;
  }

  getConfig(): WhiteboardConfig {
    return this.configService.getConfig();
  }

  // Data Management

  getData(): WhiteboardElement[] {
    return this.data.getValue();
  }

  getData$(): Observable<WhiteboardElement[]> {
    return this.data$;
  }

  setData(data: WhiteboardElement[]) {
    this.data.next(data);
    this.EventBusService.emit(WhiteboardEvent.DataChange, data);
  }

  getDraftData(): WhiteboardElement[] {
    return this.draftData.getValue();
  }

  pushToUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.getData())));
    if (this.undoStack.length > MAX_STACK_SIZE) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(): boolean {
    if (!this.undoStack.length) {
      return false;
    }
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState as WhiteboardElement[]);
    if (this.undoStack.length) {
      this.setData(JSON.parse(JSON.stringify(this.undoStack[this.undoStack.length - 1])));
    } else {
      this.setData(JSON.parse(JSON.stringify(this.initialData)));
    }
    this.selectElement(null);
    this.EventBusService.emit(WhiteboardEvent.Undo);
    return true;
  }

  redo(): boolean {
    if (!this.redoStack.length) {
      return false;
    }
    const currentState = this.redoStack.pop() as WhiteboardElement[];
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    if (this.undoStack.length > MAX_STACK_SIZE) {
      this.undoStack.shift();
    }
    this.setData(currentState);
    this.selectElement(null);
    this.EventBusService.emit(WhiteboardEvent.Redo);
    return true;
  }

  clear(): void {
    this.setData([]);
    this.pushToUndo();
    this.EventBusService.emit(WhiteboardEvent.Clear);
  }

  // Element Management

  addElement(element: WhiteboardElement) {
    const currentData = this.getData();
    this.setData([...currentData, element]);
    this.EventBusService.emit(WhiteboardEvent.ElementAdded, element);
  }

  addElements(elements: WhiteboardElement[]) {
    const currentData = this.getData();
    this.setData([...currentData, ...elements]);
  }

  addToDraft(element: WhiteboardElement): void {
    this.draftData.next([...this.draftData.getValue(), element]);
  }

  updateDraft(element: WhiteboardElement): void {
    const draftElements = this.draftData.getValue();
    const index = draftElements.findIndex((el) => el.id === element.id);
    if (index > -1) {
      draftElements[index] = element;
      this.draftData.next(draftElements);
    }
  }

  commitDraftToData(): void {
    const draftElements = this.draftData.getValue();
    if (draftElements.length) {
      this.data.next([...this.data.getValue(), ...draftElements]);
      this.draftData.next([]);
      this.EventBusService.emit(WhiteboardEvent.DataChange, this.data.getValue());
    }
  }

  updateElement(element: WhiteboardElement, history = true) {
    const currentData = this.getData();
    const index = currentData.findIndex((el) => el.id === element.id);
    if (index > -1) {
      currentData[index] = element;
      this.setData(currentData);
      if (history) {
        this.pushToUndo();
        this.EventBusService.emit(WhiteboardEvent.ElementUpdated, element);
      }
    }
  }

  removeElement(id: string) {
    const currentData = this.getData();
    const index = currentData.findIndex((el) => el.id === id);
    if (index > -1) {
      this.EventBusService.emit(WhiteboardEvent.ElementDeleted, currentData[index]);
      currentData.splice(index, 1);
      this.setData(currentData);
      this.pushToUndo();
    }
  }

  hasElement(element: WhiteboardElement): boolean {
    return this.getData().some((el) => el.id === element.id);
  }

  getElementBbox(element: WhiteboardElement): DOMRect {
    const elementId = `${ITEM_PREFIX}${element.id}`;
    const el = this.svgContainer?.querySelector(`#${elementId}`) as SVGGraphicsElement;
    if (el) {
      return el.getBBox();
    }
    throw new Error(`Element with id ${elementId} not found`);
  }

  // Tool management

  getActiveTool(): ToolType {
    return this.selectedTool.getValue();
  }

  setActiveTool(tool: ToolType) {
    this.selectedTool.next(tool);
    this.EventBusService.emit(WhiteboardEvent.ToolChange, tool);
  }

  // Selection management

  getSelectedElement(): WhiteboardElement | null {
    return this.selectedElement.getValue();
  }

  selectElement(element: WhiteboardElement | null): void {
    this.resetGrips();

    if (element) {
      this.selectedElement.next(element);
      this.setActiveTool(ToolType.Select);
      this.selectedTool.next(ToolType.Select);
      const currentBBox = this.getElementBbox(element);
      this.showGrips(currentBBox);
      this.EventBusService.emit(WhiteboardEvent.ElementSelected, element);
    } else {
      this.selectedElement.next(null);
      this.EventBusService.emit(WhiteboardEvent.ElementSelected, null);
    }
  }

  updateSelectedElement(partialElement: Partial<WhiteboardElement>) {
    const selectedElement = this.getSelectedElement();
    if (!selectedElement) {
      return;
    }
    const updatedElement = { ...selectedElement, ...partialElement } as WhiteboardElement;

    this.selectedElement.next(updatedElement);
    this.updateElement(updatedElement, false);

    this.EventBusService.emit(WhiteboardEvent.ElementSelected, updatedElement);
    this.debouncedPushToUndo();
  }

  // Mouse & Coordinate Handling

  getCanvasCoordinates([x, y]: [number, number]): [number, number] {
    const { zoom, x: configX, y: configY, elementsTranslation } = this.getConfig();
    const translatedX = (x - configX) / zoom - elementsTranslation.x;
    const translatedY = (y - configY) / zoom - elementsTranslation.y;
    return [translatedX, translatedY];
  }

  // Visual Elements Management

  showGrips(bbox: DOMRect) {
    const currentElement = this.getSelectedElement();
    if (!currentElement) {
      return;
    }
    this.configService.updateConfig({
      rubberBox: {
        x: bbox.x - ((currentElement.style.strokeWidth as number) || 0) * 0.5,
        y: bbox.y - ((currentElement.style.strokeWidth as number) || 0) * 0.5,
        width: bbox.width + (currentElement.style.strokeWidth as number) || 0,
        height: bbox.height + (currentElement.style.strokeWidth as number) || 0,
        display: 'block',
      },
    });
  }

  resetGrips(): void {
    this.configService.updateConfig({
      rubberBox: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        display: 'none',
      },
    });
  }

  setCanvasDimensions(width: number, height: number): void {
    this.configService.updateConfig({ canvasWidth: width, canvasHeight: height });
  }

  setCanvasPosition(x: number, y: number): void {
    this.configService.updateConfig({ x, y });
  }

  updateGridTranslation(dx: number, dy: number): void {
    this.configService.updateConfig({ gridTranslation: { x: dx, y: dy } });
  }

  updateElementsTranslation(dx: number, dy: number): void {
    this.configService.updateConfig({ elementsTranslation: { x: dx, y: dy } });
  }

  fullScreen(): void {
    const containerWidth = this.svgContainer?.clientWidth || 0;
    const containerHeight = this.svgContainer?.clientHeight || 0;
    this.setCanvasDimensions(containerWidth, containerHeight);
  }

  centerCanvas(): void {
    const { canvasWidth, canvasHeight, zoom } = this.getConfig();
    const containerWidth = this.svgContainer?.clientWidth || 0;
    const containerHeight = this.svgContainer?.clientHeight || 0;

    const centerX = (containerWidth - canvasWidth * zoom) / 2;
    const centerY = (containerHeight - canvasHeight * zoom) / 2;

    this.setCanvasPosition(centerX, centerY);
  }

  toggleGrid(): void {
    const { enableGrid } = this.getConfig();
    this.configService.updateConfig({ enableGrid: !enableGrid });
  }

  // Actions

  addImage(imageInfo: AddImage): void {
    const tempImg = new Image();
    tempImg.onload = () => {
      const svgHeight = this.getConfig().canvasHeight;
      const imageWidth = tempImg.width;
      const imageHeight = tempImg.height;
      const aspectRatio = tempImg.width / tempImg.height;
      const height = imageHeight > svgHeight ? svgHeight - 40 : imageHeight;
      const width = height === svgHeight - 40 ? (svgHeight - 40) * aspectRatio : imageWidth;

      let x = imageInfo.x || (imageWidth - width) * (imageInfo.x || 0);
      let y = imageInfo.y || (imageHeight - height) * (imageInfo.y || 0);

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }

      const element = createElement(ElementType.Image, {
        src: imageInfo.image,
        width,
        height,
        x,
        y,
      });

      this.addElement(element);
      this.selectElement(element);
      this.pushToUndo();
      this.EventBusService.emit(WhiteboardEvent.ImageAdded, element.src);
    };
    tempImg.src = imageInfo.image as string;
  }

  async save(format: FormatType, name = 'New board'): Promise<void> {
    const svgElement = this.getCanvas().getElementById('svgcontent') as SVGSVGElement;
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

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const imageString = await svgToBase64(
      svgString,
      this.getConfig().canvasWidth,
      this.getConfig().canvasHeight,
      format
    );
    switch (format) {
      case FormatType.Base64:
        this.EventBusService.emit(WhiteboardEvent.Save, imageString);
        break;
      case FormatType.Svg: {
        const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        downloadFile(imgSrc, name);
        this.EventBusService.emit(WhiteboardEvent.Save, imgSrc);
        break;
      }
      default:
        downloadFile(imageString, name);
        this.EventBusService.emit(WhiteboardEvent.Save, imageString);
        break;
    }
  }
}
