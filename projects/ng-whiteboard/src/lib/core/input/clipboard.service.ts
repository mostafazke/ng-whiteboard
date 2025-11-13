import { Injectable } from '@angular/core';
import { ClipboardData, ClipboardInfo, WhiteboardElement } from '../types';
import { ElementsService } from '../elements/elements.service';

/**
 * Manages clipboard operations for whiteboard elements with localStorage persistence.
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly CLIPBOARD_KEY = 'whiteboard-clipboard';
  private readonly OFFSET_INCREMENT = 20;

  constructor(private elementsService: ElementsService) {}

  copy(elements: WhiteboardElement[]): void {
    if (elements.length === 0) return;

    const clipboardData: ClipboardData = {
      elements: elements,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(this.CLIPBOARD_KEY, JSON.stringify(clipboardData));
    } catch (error) {
      console.error('Failed to copy elements to clipboard:', error);
    }
  }

  cut(elements: WhiteboardElement[]): void {
    this.copy(elements);
  }

  paste(): WhiteboardElement[] {
    const clipboardData = this.getData();
    if (!clipboardData?.elements.length) {
      return [];
    }

    const pastedElements = this.duplicateElementsWithOffset(
      clipboardData.elements,
      this.OFFSET_INCREMENT,
      this.OFFSET_INCREMENT
    );

    this.elementsService.addElements(pastedElements);
    return pastedElements;
  }

  clear(): void {
    try {
      localStorage.removeItem(this.CLIPBOARD_KEY);
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
    }
  }

  hasData(): boolean {
    const data = this.getData();
    return data !== null && data.elements.length > 0;
  }

  getData(): ClipboardData | null {
    try {
      const data = localStorage.getItem(this.CLIPBOARD_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to read clipboard data:', error);
      return null;
    }
  }

  duplicateElements(
    elements: WhiteboardElement[],
    offsetX: number = this.OFFSET_INCREMENT,
    offsetY: number = this.OFFSET_INCREMENT
  ): WhiteboardElement[] {
    if (elements.length === 0) {
      return [];
    }

    const duplicatedElements = this.duplicateElementsWithOffset(elements, offsetX, offsetY);
    this.elementsService.addElements(duplicatedElements);
    return duplicatedElements;
  }

  createDuplicates(
    elements: WhiteboardElement[],
    offsetX: number = this.OFFSET_INCREMENT,
    offsetY: number = this.OFFSET_INCREMENT
  ): WhiteboardElement[] {
    return this.duplicateElementsWithOffset(elements, offsetX, offsetY);
  }

  getClipboardInfo(): ClipboardInfo | null {
    const data = this.getData();
    if (!data) return null;

    return {
      elementCount: data.elements.length,
      timestamp: data.timestamp,
    };
  }

  isDataFresh(maxAgeMs: number = 5 * 60 * 1000): boolean {
    const data = this.getData();
    if (!data) return false;

    return Date.now() - data.timestamp <= maxAgeMs;
  }

  getClipboardElementTypes(): string[] {
    const data = this.getData();
    if (!data) return [];

    const types = data.elements.map((el) => el.type);
    return [...new Set(types)];
  }

  private duplicateElementsWithOffset(
    elements: WhiteboardElement[],
    offsetX: number,
    offsetY: number
  ): WhiteboardElement[] {
    return elements.map((element) => ({
      ...element,
      id: `${element.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + offsetX,
      y: element.y + offsetY,
    }));
  }
}
