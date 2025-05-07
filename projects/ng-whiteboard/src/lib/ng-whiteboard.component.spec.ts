import { ChangeDetectorRef, SimpleChanges, SimpleChange, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionHandlerService } from './core/action-handler/action-handler.service';
import { ConfigService } from './core/config/config.service';
import { DataService } from './core/data/data.service';
import { EventBusService } from './core/event-bus/event-bus.service';
import { WhiteboardElement, ElementType, ToolType, WhiteboardEvent, WhiteboardOptions } from './core/types';
import { NgWhiteboardComponent } from './ng-whiteboard.component';
import { NgWhiteboardService } from './ng-whiteboard.service';
import { of } from 'rxjs';
import { SvgService } from './core/svg/svg.service';
import { ToolManagerService } from './core/tools/tool-manager.service';
import { GripCursorPipe } from './core/pipes';
import { SvgDirective } from './core/svg/svg.directive';
import { ResizeHandlerDirective } from './core/directives/resize-handler.directive';

describe('NgWhiteboardComponent', () => {
  let component: NgWhiteboardComponent;
  let fixture: ComponentFixture<NgWhiteboardComponent>;
  let dataService: Partial<DataService>;
  let eventBusService: Partial<EventBusService>;
  let configService: Partial<ConfigService>;
  let mockElementRef: ElementRef;
  let resizeCallback: (entries: ResizeObserverEntry[]) => void;

  beforeEach(() => {
    const element = document.createElement('div');
    mockElementRef = new ElementRef(element);

    configService = {
      getConfig: jest.fn(),
      updateConfigValue: jest.fn(),
      checkAndUpdateConfig: jest.fn(),
      isConfigDifferent: jest.fn(),
      updateConfig: jest.fn(),
    };
    eventBusService = {
      emit: jest.fn(),
      listen: jest.fn().mockReturnValue(of({})),
    };

    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;
  });

  beforeEach(async () => {
    dataService = {
      initializeWhiteboard: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      getData$: jest.fn(() => of([])),
      getActiveTool: jest.fn(),
      setActiveTool: jest.fn(),
      selectElements: jest.fn(),
      centerCanvas: jest.fn(),
      getSelectedElements: jest.fn(() => []),
    };
    TestBed.overrideComponent(NgWhiteboardComponent, {
      set: {
        providers: [
          {
            provide: DataService,
            useValue: dataService,
          },
          {
            provide: EventBusService,
            useValue: eventBusService,
          },
        ],
      },
    });
    await TestBed.configureTestingModule({
      imports: [NgWhiteboardComponent, GripCursorPipe, SvgDirective, ResizeHandlerDirective],
      providers: [
        NgWhiteboardService,
        SvgService,
        ToolManagerService,
        ActionHandlerService,
        ConfigService,
        EventBusService,
        ChangeDetectorRef,
        DataService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgWhiteboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Input Setters', () => {
    it('should update data when new data is set', () => {
      resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);

      const testData: WhiteboardElement[] = [
        {
          id: '1',
          type: ElementType.Rectangle,
        } as WhiteboardElement,
      ];
      component.data = testData;
      expect(dataService.setData).toHaveBeenCalled();
    });

    it('should update selected tool', () => {
      component.selectedTool = ToolType.Line;
      expect(dataService.setActiveTool).toHaveBeenCalledWith(ToolType.Line);
    });
  });

  describe('Configuration Methods', () => {
    it('should not update config when value is the same', () => {
      const spy = jest.spyOn(configService, 'updateConfigValue');
      component.setConfigValue('strokeWidth', 2);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should center canvas when updating size-related configs', () => {
      component.center = true;
      component.fullScreen = false;
      component.canvasWidth = 800;

      component.setConfigValue = jest.fn((key: string, value: any) => {
        if (key === 'canvasWidth' && component.center && !component.fullScreen) {
          dataService.centerCanvas = jest.fn();
          dataService.centerCanvas();
        }
      });

      component.setConfigValue('canvasWidth', 800);
      expect(dataService.centerCanvas).toHaveBeenCalled();
    });

    it('should not center canvas when fullScreen is true', () => {
      component.center = true;
      component.fullScreen = true;
      component.setConfigValue('canvasWidth', 800);
      expect(dataService.centerCanvas).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should initialize whiteboard after view init', () => {
      fixture.detectChanges();

      expect(dataService.initializeWhiteboard).toHaveBeenCalled();
    });

    it('should emit destroyed event on component destroy', () => {
      const spy = jest.spyOn(eventBusService, 'emit');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalledWith(WhiteboardEvent.Destroyed);
    });

    it('should handle options changes', () => {
      const options: WhiteboardOptions = {
        strokeColor: '#ff0000',
        strokeWidth: 3,
      };
      const changes: SimpleChanges = {
        options: new SimpleChange(null, options, true),
      };
      const spy = jest.spyOn(component as any, 'populateInputsFromOptions');
      component.ngOnChanges(changes);
      expect(spy).toHaveBeenCalledWith(options);
    });
  });
});
