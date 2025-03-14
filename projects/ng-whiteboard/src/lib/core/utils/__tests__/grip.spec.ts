import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../../config/config.service';
import { ElementType, WhiteboardElement } from '../../types';
import { resetGrips, showGrips } from '../grip';
import { EventBusService } from '../../event-bus/event-bus.service';

describe('Grip Utils', () => {
  let configService: ConfigService;
  let eventBusMock: any;

  beforeEach(() => {
    eventBusMock = {
      emit: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [ConfigService, { provide: EventBusService, useValue: eventBusMock }],
    });
    configService = TestBed.inject(ConfigService);
  });

  describe('showGrips', () => {
    it('should update config with correct rubber box dimensions for element without stroke width', () => {
      const bbox = { x: 10, y: 20, width: 100, height: 200 } as DOMRect;

      const element: WhiteboardElement = {
        type: ElementType.Rectangle,
        style: {
          strokeWidth: 0,
        },
      } as WhiteboardElement;

      showGrips(configService, bbox, element);

      expect(configService.getConfig().rubberBox).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        display: 'block',
      });
    });

    it('should update config with correct rubber box dimensions accounting for stroke width', () => {
      const bbox = { x: 10, y: 20, width: 100, height: 200 } as DOMRect;
      const element: WhiteboardElement = {
        type: ElementType.Rectangle,
        style: {
          strokeWidth: 4,
        },
      } as WhiteboardElement;

      showGrips(configService, bbox, element);

      expect(configService.getConfig().rubberBox).toEqual({
        x: 8,
        y: 18,
        width: 104,
        height: 204,
        display: 'block',
      });
    });
  });

  describe('resetGrips', () => {
    it('should reset rubber box to default state', () => {
      resetGrips(configService);

      expect(configService.getConfig().rubberBox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        display: 'none',
      });
    });

    it('should reset grips after showing them', () => {
      const bbox = { x: 10, y: 20, width: 100, height: 200 } as DOMRect;
      const element: WhiteboardElement = {
        type: ElementType.Rectangle,
        style: {},
      } as WhiteboardElement;

      showGrips(configService, bbox, element);
      resetGrips(configService);

      expect(configService.getConfig().rubberBox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        display: 'none',
      });
    });
  });
});
