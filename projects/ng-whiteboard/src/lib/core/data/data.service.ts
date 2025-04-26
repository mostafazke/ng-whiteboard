import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, combineLatestWith, map, Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { MAX_STACK_SIZE } from '../constants';
import { createElement } from '../elements/element.utils';
import { EventBusService } from '../event-bus/event-bus.service';
import {
  AddImage,
  BoundingBox,
  ElementType,
  FormatType,
  SelectionBox,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
} from '../types';
import { WhiteboardEvent } from '../types/events';
import { debounce, downloadFile } from '../utils/common';
import { getElementBounds } from '../utils/dom';
import { svgToBase64 } from '../utils/drawing';
@Injectable()
export class DataService {
  private undoStack: WhiteboardElement[][] = [];
  private redoStack: WhiteboardElement[][] = [];
  private initialData: WhiteboardElement[] = [];

  private readonly data = new BehaviorSubject<WhiteboardElement[]>([]);
  private readonly draftData = new BehaviorSubject<WhiteboardElement[]>([]);
  private readonly selectedTool = new BehaviorSubject<ToolType>(ToolType.Pen);
  private readonly selectedElementIds = new BehaviorSubject<Set<string>>(new Set());

  private readonly selectionBox = new BehaviorSubject<SelectionBox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  private readonly boundingBox = new BehaviorSubject<BoundingBox | null>(null);
  private renderer: Renderer2;
  svgContainer: SVGSVGElement | null = null;

  readonly data$ = this.data.pipe(
    combineLatestWith(this.draftData),
    map(([data, draft]) => [...data, ...draft])
  );
  readonly selectedTool$ = this.selectedTool.asObservable();
  readonly selectionBox$ = this.selectionBox.asObservable();
  readonly boundingBox$ = this.boundingBox.asObservable();

  private readonly debouncedPushToUndo = debounce(() => this.pushToUndo(), 300);

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

  getElementById(id: string): WhiteboardElement | undefined {
    return this.getData().find((el) => el.id === id);
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
    this.clearSelection();
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
    this.clearSelection();
    this.EventBusService.emit(WhiteboardEvent.Redo);
    return true;
  }

  clear(): void {
    this.setData([]);
    this.pushToUndo();
    this.EventBusService.emit(WhiteboardEvent.Clear);
  }

  // Element Management

  addElements(elements: WhiteboardElement | WhiteboardElement[]) {
    const currentData = this.getData();
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    this.setData([...currentData, ...elementsArray]);
    this.pushToUndo();
    this.EventBusService.emit(WhiteboardEvent.ElementsAdded, elementsArray);
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
      this.setData([...this.data.getValue(), ...draftElements]);
      this.pushToUndo();
      this.draftData.next([]);
    }
  }

  updateElements(elements: Partial<WhiteboardElement> | Partial<WhiteboardElement>[], history = true) {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    const currentData = this.getData();

    elementsArray.forEach((patch) => {
      const index = currentData.findIndex((el) => el.id === patch.id);
      if (index > -1) {
        currentData[index] = { ...currentData[index], ...patch } as WhiteboardElement;
      }
    });

    this.setData(currentData);

    if (history) {
      this.pushToUndo();
      this.EventBusService.emit(WhiteboardEvent.ElementsUpdated, elementsArray as WhiteboardElement[]);
    }
  }

  removeElements(elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[], history = true) {
    const elementsToRemove = Array.isArray(elementsOrIds) ? elementsOrIds : [elementsOrIds];
    const ids = elementsToRemove.map((el) => (typeof el === 'string' ? el : el.id));

    if (elementsToRemove.length) {
      const currentData = this.getData();
      this.EventBusService.emit(WhiteboardEvent.ElementsDeleted);
      const updatedData = currentData.filter((el) => !ids.includes(el.id));
      if (history) {
        this.setData(updatedData);
        this.pushToUndo();
      }
    }
  }

  hasElement(element: WhiteboardElement): boolean {
    return this.getData().some((el) => el.id === element.id);
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

  /**
   * Select elements by reference or ID, with option to append to existing selection
   */
  selectElements(elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[], append = false): void {
    const elements = Array.isArray(elementsOrIds) ? elementsOrIds : [elementsOrIds];
    const selectedIds = elements.map((el) => (typeof el === 'string' ? el : el.id));

    const currentSelection = Array.from(this.selectedElementIds.getValue());
    const newSelection = append ? [...new Set([...currentSelection, ...selectedIds])] : selectedIds;

    this.selectedElementIds.next(new Set(newSelection));
    this.updateBoundingBox();
    this.EventBusService.emit(
      WhiteboardEvent.ElementsSelected,
      newSelection.map((id) => this.getElementById(id)) as WhiteboardElement[]
    );
  }

  toggleSelection(elementOrId: WhiteboardElement | string): void {
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
    const current = new Set(this.selectedElementIds.getValue());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedElementIds.next(current);
    this.updateBoundingBox();
  }

  deselectElement(elementOrId: WhiteboardElement | string): void {
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
    const current = new Set(this.selectedElementIds.getValue());
    current.delete(id);
    this.selectedElementIds.next(current);
    this.updateBoundingBox();
  }

  clearSelection(): void {
    if (this.selectedElementIds.getValue().size > 0) {
      this.selectedElementIds.next(new Set());
      this.clearBoundingBox();
      this.EventBusService.emit(WhiteboardEvent.ElementsSelected, []);
    }
  }

  selectAll(): void {
    const ids = new Set(this.getData().map((el) => el.id));
    this.selectedElementIds.next(ids);
    this.updateBoundingBox();
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedElementIds.getValue());
  }

  getSelectedElements(): WhiteboardElement[] {
    const ids = this.getSelectedIds();
    return this.getData().filter((el) => ids.includes(el.id));
  }

  updateSelectedElements(partial: Partial<WhiteboardElement>): void {
    const selectedElements = this.getSelectedElements();
    selectedElements.forEach((el) => {
      const updatedElement = { ...el, ...partial };
      this.updateElements(updatedElement, false);
    });

    this.updateBoundingBox();
    this.EventBusService.emit(WhiteboardEvent.ElementsSelected, selectedElements);
    this.debouncedPushToUndo();
  }

  transformSelectedElements(transform: (elements: WhiteboardElement[]) => WhiteboardElement[]): void {
    const selectedElements = this.getSelectedElements();
    const updatedElements = transform(selectedElements);
    this.updateElements(updatedElements, false);
    this.updateBoundingBox();
    this.EventBusService.emit(WhiteboardEvent.ElementsSelected, selectedElements);
    this.debouncedPushToUndo();
  }

  // Bounding Box

  updateBoundingBox(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) {
      this.clearBoundingBox();
      return;
    }

    const allBounds = selectedElements.map(getElementBounds);

    const minX = Math.min(...allBounds.map((b) => b.minX));
    const minY = Math.min(...allBounds.map((b) => b.minY));
    const maxX = Math.max(...allBounds.map((b) => b.maxX));
    const maxY = Math.max(...allBounds.map((b) => b.maxY));

    const width = maxX - minX;
    const height = maxY - minY;

    const centerX = minX + width / 2;
    const handleOffset = 20;

    let rotation = 0;
    if (selectedElements.length === 1) {
      rotation = selectedElements[0].rotation || 0;
    }

    const boundingBox: BoundingBox = {
      x: minX,
      y: minY,
      width,
      height,
      handles: {
        topLeft: { x: minX, y: minY },
        topRight: { x: maxX, y: minY },
        bottomLeft: { x: minX, y: maxY },
        bottomRight: { x: maxX, y: maxY },
        rotateHandle: { x: centerX, y: minY - handleOffset },
      },
      rotation,
    };

    this.boundingBox.next(boundingBox);
  }

  getBoundingBox(): BoundingBox | null {
    return this.boundingBox.getValue();
  }

  clearBoundingBox(): void {
    this.boundingBox.next(null);
  }

  // Selection Box

  setSelectionBox(box: SelectionBox): void {
    this.selectionBox.next(box);
  }

  getSelectionBox(): SelectionBox | null {
    return this.selectionBox.getValue();
  }

  clearSelectionBox(): void {
    this.selectionBox.next({ x: 0, y: 0, width: 0, height: 0, visible: false });
  }

  // Visual Elements Management

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

      this.addElements(element);
      this.selectElements(element);
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
