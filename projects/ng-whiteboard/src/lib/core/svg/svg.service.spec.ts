import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { Tool, ToolType, WhiteboardConfig, WhiteboardEvent } from '../types';
import { SvgService } from './svg.service';
import { ToolManagerService } from '../tools/tool-manager.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { ConfigService } from '../config/config.service';

describe('SvgService', () => {
  let service: SvgService;
  let eventBusService: jest.Mocked<EventBusService>;
  let configService: jest.Mocked<ConfigService>;
  const currentTool: Tool = {
    type: ToolType.Pen,
    activate: jest.fn(),
    deactivate: jest.fn(),
    handlePointerDown: jest.fn(),
    handlePointerMove: jest.fn(),
    handlePointerUp: jest.fn(),
  };
  beforeEach(() => {
    const toolManagerMock = {
      getCurrentTool: jest.fn().mockReturnValue(currentTool),
    };
    const eventBusMock = {
      emit: jest.fn(),
    };
    const configMock = {
      getConfig: jest.fn().mockReturnValue({ drawingEnabled: true } as WhiteboardConfig),
    };

    TestBed.configureTestingModule({
      providers: [
        SvgService,
        { provide: ToolManagerService, useValue: toolManagerMock },
        { provide: EventBusService, useValue: eventBusMock },
        { provide: ConfigService, useValue: configMock },
      ],
    });

    service = TestBed.inject(SvgService);
    eventBusService = TestBed.inject(EventBusService) as jest.Mocked<EventBusService>;
    configService = TestBed.inject(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit DrawStart event and handle pointer down', () => {
    const pointerEvent = new MouseEvent('pointerdown') as PointerEvent;

    service.onPointerDown(pointerEvent);

    expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.DrawStart, pointerEvent);
    expect(currentTool.handlePointerDown).toHaveBeenCalledWith(pointerEvent);
  });
  it('should emit Drawing event and handle pointer move', () => {
    const pointerEvent = new MouseEvent('pointermove') as PointerEvent;

    service.onPointerMove(pointerEvent);

    expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Drawing, pointerEvent);
    expect(currentTool.handlePointerMove).toHaveBeenCalledWith(pointerEvent);
  });

  it('should emit DrawEnd event and handle pointer up', () => {
    const pointerEvent = new MouseEvent('pointerup') as PointerEvent;

    service.onPointerUp(pointerEvent);

    expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.DrawEnd);
    expect(currentTool.handlePointerUp).toHaveBeenCalledWith(pointerEvent);
  });

  it('should not emit events if drawing is disabled', () => {
    configService.getConfig.mockReturnValue({ drawingEnabled: false } as WhiteboardConfig);
    const pointerEvent = new MouseEvent('pointerdown') as PointerEvent;

    service.onPointerDown(pointerEvent);
    service.onPointerMove(pointerEvent);
    service.onPointerUp(pointerEvent);

    expect(eventBusService.emit).not.toHaveBeenCalled();
  });

  it('should return pointer down observable', () => {
    expect(service.getPointerDown$()).toBeInstanceOf(Observable);
  });

  it('should return pointer move observable', () => {
    expect(service.getPointerMove$()).toBeInstanceOf(Observable);
  });

  it('should return pointer up observable', () => {
    expect(service.getPointerUp$()).toBeInstanceOf(Observable);
  });
});
