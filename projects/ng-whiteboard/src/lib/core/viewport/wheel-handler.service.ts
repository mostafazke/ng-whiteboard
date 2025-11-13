import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { PAN_SENSITIVITY } from '../constants';

/**
 * Handles mouse wheel events for zoom and pan operations.
 */
@Injectable()
export class WheelHandlerService {
  private apiService = inject(ApiService);

  handleWheel(event: WheelEvent): void {
    event.preventDefault();

    if (event.ctrlKey) {
      this.handleZoom(event);
    } else if (event.shiftKey) {
      this.handleHorizontalPan(event);
    } else {
      this.handleVerticalPan(event);
    }
  }

  private handleZoom(event: WheelEvent): void {
    const zoomDirection = event.deltaY < 0 ? 1 : -1;

    if (zoomDirection > 0) {
      this.apiService.zoomIn();
    } else {
      this.apiService.zoomOut();
    }
  }

  private handleHorizontalPan(event: WheelEvent): void {
    const config = this.apiService.getConfig();
    const panDelta = (event.deltaY * PAN_SENSITIVITY) / config.zoom;
    this.apiService.pan(panDelta, 0);
  }

  private handleVerticalPan(event: WheelEvent): void {
    const config = this.apiService.getConfig();
    const panDelta = (event.deltaY * PAN_SENSITIVITY) / config.zoom;
    this.apiService.pan(0, panDelta);
  }
}
