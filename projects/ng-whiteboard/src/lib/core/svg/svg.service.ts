import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToolManagerService } from '../tools/tool-manager.service';
import { WhiteboardEvent } from '../types';
import { EventBusService } from '../event-bus/event-bus.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SvgService {
  private pointerDownSubject = new Subject<PointerEvent>();
  private pointerMoveSubject = new Subject<PointerEvent>();
  private pointerUpSubject = new Subject<PointerEvent>();

  constructor(
    private toolManager: ToolManagerService,
    private configService: ConfigService,
    private EventBusService: EventBusService
  ) {}

  onPointerDown(info: PointerEvent) {
    if (!this.canDraw()) {
      return;
    }

    this.EventBusService.emit(WhiteboardEvent.DrawStart, info);

    const currentTool = this.toolManager.getCurrentTool();
    if (currentTool && currentTool.handlePointerDown) {
      currentTool.handlePointerDown(info);
    }
    this.pointerDownSubject.next(info);
  }

  onPointerMove(info: PointerEvent) {
    if (!this.canDraw()) {
      return;
    }
    this.EventBusService.emit(WhiteboardEvent.Drawing, info);
    const currentTool = this.toolManager.getCurrentTool();
    if (currentTool && currentTool.handlePointerMove) {
      currentTool.handlePointerMove(info);
    }
    this.pointerMoveSubject.next(info);
  }

  onPointerUp(info: PointerEvent) {
    if (!this.canDraw()) {
      return;
    }

    this.EventBusService.emit(WhiteboardEvent.DrawEnd);
    const currentTool = this.toolManager.getCurrentTool();
    if (currentTool && currentTool.handlePointerUp) {
      currentTool.handlePointerUp(info);
    }
    this.pointerUpSubject.next(info);
  }

  getPointerDown$() {
    return this.pointerDownSubject.asObservable();
  }

  getPointerMove$() {
    return this.pointerMoveSubject.asObservable();
  }

  getPointerUp$() {
    return this.pointerUpSubject.asObservable();
  }

  private canDraw(): boolean {
    return this.configService.getConfig().drawingEnabled;
  }
}
