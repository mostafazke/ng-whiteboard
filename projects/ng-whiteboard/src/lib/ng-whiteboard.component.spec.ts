import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgWhiteboardComponent } from './ng-whiteboard.component';
import { ConfigService } from './core/config/config.service';
import { ApiService } from './core/api';
import { ToolsService } from './core/tools';
import { EventBusService } from './core/event-bus/event-bus.service';
import { InstanceService } from './core/canvas/instance.service';
import { ToolType, WhiteboardElement, ElementType } from './core/types';
import { WhiteboardEvent } from './core/types/events';

describe('NgWhiteboardComponent', () => {
  let component: NgWhiteboardComponent;
  let fixture: ComponentFixture<NgWhiteboardComponent>;
  let configService: ConfigService;
  let apiService: ApiService;
  let toolsService: ToolsService;

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgWhiteboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgWhiteboardComponent);
    component = fixture.componentInstance;

    // Wait for component to be fully initialized
    await fixture.whenStable();

    // Get service instances from the component's injector (not TestBed)
    configService = fixture.debugElement.injector.get(ConfigService);
    apiService = fixture.debugElement.injector.get(ApiService);
    toolsService = fixture.debugElement.injector.get(ToolsService);

    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have a unique boardId', () => {
      expect(component.boardId).toBeDefined();
      expect(typeof component.boardId).toBe('string');
      expect(component.boardId.length).toBeGreaterThan(0);
    });

    it('should have config property', () => {
      expect(component.config).toBeDefined();
    });
  });

  describe('Input Properties', () => {
    describe('boardId', () => {
      it('should accept custom boardId', () => {
        const customId = 'custom-board-123';
        component.boardId = customId;
        expect(component.boardId).toBe(customId);
      });

      it('should generate unique boardId if not provided', () => {
        const fixture2 = TestBed.createComponent(NgWhiteboardComponent);
        const component2 = fixture2.componentInstance;

        expect(component.boardId).not.toBe(component2.boardId);
      });
    });

    describe('config', () => {
      it('should set config through input setter', () => {
        const spy = jest.spyOn(configService, 'updateConfig');
        const newConfig = { canvasWidth: 1024, canvasHeight: 768 };

        component.config = newConfig;

        expect(spy).toHaveBeenCalledWith(newConfig, false);
      });

      it('should get config through getter', () => {
        const spy = jest.spyOn(configService, 'getConfig');

        const config = component.config;

        expect(spy).toHaveBeenCalled();
        expect(config).toBeDefined();
      });

      it('should update partial config', () => {
        const spy = jest.spyOn(configService, 'updateConfig');
        const partialConfig = { strokeColor: '#ff0000' };

        component.config = partialConfig;

        expect(spy).toHaveBeenCalledWith(partialConfig, false);
      });

      it('should update multiple config properties', () => {
        const spy = jest.spyOn(configService, 'updateConfig');
        const multiConfig = {
          canvasWidth: 1200,
          canvasHeight: 900,
          strokeColor: '#00ff00',
          strokeWidth: 3,
        };

        component.config = multiConfig;

        expect(spy).toHaveBeenCalledWith(multiConfig, false);
      });
    });

    describe('data', () => {
      const mockElement: WhiteboardElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rx: 5,
        rotation: 0,
        opacity: 100,
        zIndex: 1,
        style: {
          strokeColor: '#000000',
          fillColor: '#ffffff',
          strokeWidth: 2,
          fillStyle: 'solid',
          strokeStyle: 'solid',
        },
      } as WhiteboardElement;

      it('should set data when provided', () => {
        const spy = jest.spyOn(apiService, 'setElements');
        const data = [mockElement];

        component.data = data;

        expect(spy).toHaveBeenCalledWith(data);
      });

      it('should not set data when null', () => {
        const spy = jest.spyOn(apiService, 'setElements');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component.data = null as any;

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not set data when undefined', () => {
        const spy = jest.spyOn(apiService, 'setElements');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component.data = undefined as any;

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not set data when it is the same as current data', () => {
        const data = [mockElement];
        jest.spyOn(apiService, 'getElements').mockReturnValue(data);
        const spy = jest.spyOn(apiService, 'setElements');

        component.data = data;

        expect(spy).not.toHaveBeenCalled();
      });

      it('should set data when it differs from current data', () => {
        const currentData = [mockElement];
        const newData = [{ ...mockElement, id: 'test-2' }] as WhiteboardElement[];

        jest.spyOn(apiService, 'getElements').mockReturnValue(currentData);
        const spy = jest.spyOn(apiService, 'setElements');

        component.data = newData;

        expect(spy).toHaveBeenCalledWith(newData);
      });

      it('should handle empty array', () => {
        const spy = jest.spyOn(apiService, 'setElements');
        jest.spyOn(apiService, 'getElements').mockReturnValue([mockElement]);

        component.data = [];

        expect(spy).toHaveBeenCalledWith([]);
      });

      it('should handle array with multiple elements', () => {
        const spy = jest.spyOn(apiService, 'setElements');
        const multipleElements = [
          mockElement,
          { ...mockElement, id: 'test-2' },
          { ...mockElement, id: 'test-3' },
        ] as WhiteboardElement[];

        component.data = multipleElements;

        expect(spy).toHaveBeenCalledWith(multipleElements);
      });
    });

    describe('selectedTool', () => {
      it('should set selected tool when provided', () => {
        const spy = jest.spyOn(toolsService, 'setActiveTool');
        jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(ToolType.Select);

        component.selectedTool = ToolType.Rectangle;

        expect(spy).toHaveBeenCalledWith(ToolType.Rectangle);
      });

      it('should not set tool when null', () => {
        const spy = jest.spyOn(toolsService, 'setActiveTool');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component.selectedTool = null as any;

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not set tool when undefined', () => {
        const spy = jest.spyOn(toolsService, 'setActiveTool');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component.selectedTool = undefined as any;

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not set tool when it is the same as current tool', () => {
        jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(ToolType.Rectangle);
        const spy = jest.spyOn(toolsService, 'setActiveTool');

        component.selectedTool = ToolType.Rectangle;

        expect(spy).not.toHaveBeenCalled();
      });

      it('should set tool when it differs from current tool', () => {
        jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(ToolType.Select);
        const spy = jest.spyOn(toolsService, 'setActiveTool');

        component.selectedTool = ToolType.Pen;

        expect(spy).toHaveBeenCalledWith(ToolType.Pen);
      });

      it('should handle switching between different tools', () => {
        const spy = jest.spyOn(toolsService, 'setActiveTool');

        jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(ToolType.Select);
        component.selectedTool = ToolType.Rectangle;
        expect(spy).toHaveBeenCalledWith(ToolType.Rectangle);

        jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(ToolType.Rectangle);
        component.selectedTool = ToolType.Ellipse;
        expect(spy).toHaveBeenCalledWith(ToolType.Ellipse);

        jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(ToolType.Ellipse);
        component.selectedTool = ToolType.Pen;
        expect(spy).toHaveBeenCalledWith(ToolType.Pen);
      });

      it('should handle all tool types', () => {
        const spy = jest.spyOn(toolsService, 'setActiveTool');

        const tools = [
          ToolType.Select,
          ToolType.Pen,
          ToolType.Rectangle,
          ToolType.Ellipse,
          ToolType.Line,
          ToolType.Arrow,
          ToolType.Text,
          ToolType.Eraser,
          ToolType.Hand,
        ];

        // Clear any previous calls
        spy.mockClear();

        // For each tool, mock getActiveToolType to return a different tool
        // so the setter will actually call setActiveTool
        tools.forEach((tool) => {
          const differentTool = tool === ToolType.Select ? ToolType.Pen : ToolType.Select;
          jest.spyOn(toolsService, 'getActiveToolType').mockReturnValue(differentTool);
          component.selectedTool = tool;
        });

        expect(spy).toHaveBeenCalledTimes(tools.length);
        tools.forEach((tool) => {
          expect(spy).toHaveBeenCalledWith(tool);
        });
      });
    });
  });

  describe('Output Events', () => {
    it('should have all required output events', () => {
      expect(component.ready).toBeDefined();
      expect(component.destroyed).toBeDefined();
      expect(component.drawStart).toBeDefined();
      expect(component.drawing).toBeDefined();
      expect(component.drawEnd).toBeDefined();
      expect(component.elementsAdded).toBeDefined();
      expect(component.elementsUpdated).toBeDefined();
      expect(component.elementsSelected).toBeDefined();
      expect(component.elementsRemoved).toBeDefined();
      expect(component.elementDoubleClicked).toBeDefined();
      expect(component.undo).toBeDefined();
      expect(component.redo).toBeDefined();
      expect(component.clear).toBeDefined();
      expect(component.dataChange).toBeDefined();
      expect(component.save).toBeDefined();
      expect(component.imageAdded).toBeDefined();
      expect(component.selectedToolChange).toBeDefined();
      expect(component.configChange).toBeDefined();
      expect(component.zoomChange).toBeDefined();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should register boardId on ngOnInit', () => {
      const instanceService = TestBed.inject(InstanceService);
      const spy = jest.spyOn(instanceService, 'register');

      const newComponent = TestBed.createComponent(NgWhiteboardComponent).componentInstance;
      newComponent.ngOnInit();

      expect(spy).toHaveBeenCalledWith(newComponent.boardId, expect.anything());
    });

    it('should unregister boardId on ngOnDestroy', () => {
      const instanceService = TestBed.inject(InstanceService);
      const spy = jest.spyOn(instanceService, 'unregister');

      const newComponent = TestBed.createComponent(NgWhiteboardComponent).componentInstance;
      newComponent.ngOnInit();
      newComponent.ngOnDestroy();

      expect(spy).toHaveBeenCalledWith(newComponent.boardId);
    });

    it('should emit destroyed event on ngOnDestroy', () => {
      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      const spy = jest.spyOn(eventBusService, 'emit');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalledWith(WhiteboardEvent.Destroyed);
    });

    it('should handle multiple instances with different boardIds', () => {
      const instanceService = TestBed.inject(InstanceService);
      const registerSpy = jest.spyOn(instanceService, 'register');

      const component1 = TestBed.createComponent(NgWhiteboardComponent).componentInstance;
      const component2 = TestBed.createComponent(NgWhiteboardComponent).componentInstance;

      component1.ngOnInit();
      component2.ngOnInit();

      expect(registerSpy).toHaveBeenCalledTimes(2);
      expect(component1.boardId).not.toBe(component2.boardId);
    });
  });

  describe('Event Forwarding', () => {
    it('should forward ready event', (done) => {
      component.ready.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.Ready);
      fixture.detectChanges();
    });

    it('should forward drawStart event with payload', (done) => {
      const expectedPayload = { x: 100, y: 200 };

      component.drawStart.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.DrawStart, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward drawing event with payload', (done) => {
      const expectedPayload = { x: 150, y: 250 };

      component.drawing.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.Drawing, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward drawEnd event', (done) => {
      component.drawEnd.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.DrawEnd);
      fixture.detectChanges();
    });

    it('should forward elementsAdded event with payload', (done) => {
      const mockElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;
      const expectedPayload = [mockElement];

      component.elementsAdded.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ElementsAdded, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward elementsUpdated event with payload', (done) => {
      const mockElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;
      const expectedPayload = [mockElement];

      component.elementsUpdated.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ElementsUpdated, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward elementsSelected event with payload', (done) => {
      const mockElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;
      const expectedPayload = [mockElement];

      component.elementsSelected.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ElementsSelected, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward elementsRemoved event with payload', (done) => {
      const mockElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;
      const expectedPayload = [mockElement];

      component.elementsRemoved.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ElementsRemoved, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward elementDoubleClicked event with payload', (done) => {
      const expectedPayload = { target: null, clientX: 100, clientY: 200 };

      component.elementDoubleClicked.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ElementDoubleClicked, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward undo event', (done) => {
      component.undo.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.Undo);
      fixture.detectChanges();
    });

    it('should forward redo event', (done) => {
      component.redo.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.Redo);
      fixture.detectChanges();
    });

    it('should forward clear event', (done) => {
      component.clear.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.Clear);
      fixture.detectChanges();
    });

    it('should forward dataChange event with payload', (done) => {
      const mockElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;
      const expectedPayload = [mockElement];

      component.dataChange.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.DataChange, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward save event with payload', (done) => {
      const expectedPayload = 'saved-data';

      component.save.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.Save, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward imageAdded event with payload', (done) => {
      // The event payload is string | ArrayBuffer, but component casts it to File
      const expectedPayload = 'data:image/png;base64,test';

      component.imageAdded.subscribe((payload) => {
        // The payload is cast to File in the component
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ImageAdded, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward selectedToolChange event with payload', (done) => {
      const expectedPayload = ToolType.Rectangle;

      component.selectedToolChange.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ToolChange, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward configChange event with payload', (done) => {
      // Get the current config and use it as the payload since it needs full WhiteboardConfig type
      const currentConfig = configService.getConfig();
      const expectedPayload = { ...currentConfig, canvasWidth: 1024, canvasHeight: 768 };

      component.configChange.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ConfigChange, expectedPayload);
      fixture.detectChanges();
    });

    it('should forward zoomChange event with payload', (done) => {
      const expectedPayload = {
        zoom: 1.5,
        center: true,
        canvasWidth: 800,
        canvasHeight: 600,
      };

      component.zoomChange.subscribe((payload) => {
        expect(payload).toEqual(expectedPayload);
        done();
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);
      eventBusService.emit(WhiteboardEvent.ZoomChange, expectedPayload);
      fixture.detectChanges();
    });

    it('should properly forward all events through the effect', (done) => {
      let eventCount = 0;
      const totalEvents = 3;

      component.ready.subscribe(() => eventCount++);
      component.undo.subscribe(() => eventCount++);
      component.clear.subscribe(() => {
        eventCount++;
        if (eventCount === totalEvents) {
          done();
        }
      });

      const eventBusService = fixture.debugElement.injector.get(EventBusService);

      // Emit multiple events to verify the effect works
      eventBusService.emit(WhiteboardEvent.Ready);
      TestBed.flushEffects();

      eventBusService.emit(WhiteboardEvent.Undo);
      TestBed.flushEffects();

      eventBusService.emit(WhiteboardEvent.Clear);
      TestBed.flushEffects();

      fixture.detectChanges();
    });
  });
});
