import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { ConfigService } from '../config/config.service';
import { WhiteboardElement, ElementType } from '../types';
import { createElement } from '../elements/element.utils';
import { getCanvasCoordinates } from '../utils/geometry';
import { generateId, remapGroupIds } from '../utils/common';
import { FILE_TYPE_PREFIX } from '../constants';

@Injectable({ providedIn: 'root' })
export class DragDropService {
  constructor(
    private apiService: ApiService,
    private configService: ConfigService
  ) {}

  handleFiles(files: FileList): void {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith(FILE_TYPE_PREFIX.IMAGE)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          if (src) {
            const imageElement = createElement(
              ElementType.Image,
              {
                src,
                x: 100,
                y: 100,
                width: 200,
                height: 200,
                zIndex: this.apiService.getNextZIndex(),
              },
              this.apiService.getActiveLayerId()
            );
            this.apiService.addElements([imageElement]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  handleText(content: string, event: DragEvent, isHtml = false): void {
    const config = this.configService.getConfig();
    const { x, y } = getCanvasCoordinates(config, {
      x: event.clientX,
      y: event.clientY,
    });

    let text = content;
    let style = {
      color: config.strokeColor,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      fontWeight: 'normal' as 'normal' | 'bold',
      fontStyle: 'normal' as 'normal' | 'italic',
    };

    if (isHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const textContent = doc.body.textContent || '';
      text = textContent.trim();

      const firstElement = doc.body.firstElementChild;
      if (firstElement) {
        const computedStyle = window.getComputedStyle(firstElement);
        style = {
          color: computedStyle.color || style.color,
          fontSize: parseInt(computedStyle.fontSize) || style.fontSize,
          fontFamily: computedStyle.fontFamily || style.fontFamily,
          fontWeight:
            computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700 ? 'bold' : 'normal',
          fontStyle: computedStyle.fontStyle === 'italic' ? 'italic' : 'normal',
        };
      }
    }

    if (text) {
      const textElement = createElement(
        ElementType.Text,
        {
          x,
          y: y + style.fontSize * 0.8,
          text,
          style,
          zIndex: this.apiService.getNextZIndex(),
        },
        this.apiService.getActiveLayerId()
      );
      this.apiService.addElements([textElement]);
    }
  }

  handleElements(elements: WhiteboardElement[], event: DragEvent): void {
    const config = this.configService.getConfig();
    const dropPosition = getCanvasCoordinates(config, {
      x: event.clientX,
      y: event.clientY,
    });

    const types = new Set<string>(Object.values(ElementType));
    const layerId = this.apiService.getActiveLayerId();
    const copiedElements = elements
      .filter((el) => !!el && typeof el === 'object' && types.has(el.type))
      .map((el) => ({
        ...el,
        id: generateId(),
        layerId,
        x: dropPosition.x + (Number(el.x) || 0),
        y: dropPosition.y + (Number(el.y) || 0),
        zIndex: this.apiService.getNextZIndex(),
      }));
    if (copiedElements.length === 0) return;

    this.apiService.addElements(remapGroupIds(copiedElements));
  }
}
