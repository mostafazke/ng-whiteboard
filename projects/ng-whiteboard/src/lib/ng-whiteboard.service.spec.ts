import { TestBed } from '@angular/core/testing';
import { ApiService } from './core/api';
import { InstanceService } from './core/canvas/instance.service';
import { ShapeElement } from './core/elements/shape-element';
import { ShapeRegistryService } from './core/elements/shapes';
import { ElementType } from './core/types';
import { NgWhiteboardService } from './ng-whiteboard.service';

describe('NgWhiteboardService shapes', () => {
  let service: NgWhiteboardService;
  let api: ApiService;
  let registry: ShapeRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NgWhiteboardService, ApiService] });
    service = TestBed.inject(NgWhiteboardService);
    api = TestBed.inject(ApiService);
    registry = TestBed.inject(ShapeRegistryService);
    TestBed.inject(InstanceService).register('board', api);
    service.setActiveBoard('board');
  });

  afterEach(() => {
    TestBed.inject(InstanceService).unregister('board');
    jest.restoreAllMocks();
  });

  it('lists the available shapes of the active board', () => {
    expect(service.getAvailableShapes()).toEqual(registry.shapes());
    expect(service.getAvailableShapes()).toHaveLength(12);
  });

  it('adds a shape element carrying the registry path', () => {
    const element = service.addShape('star', { x: 10, y: 20, width: 100, height: 80 });

    expect(element).toMatchObject({
      type: ElementType.Shape,
      shapeId: 'star',
      path: registry.get('star')?.path,
      x: 10,
      y: 20,
      width: 100,
      height: 80,
    });
    const added = api.getElementById(element?.id ?? '');
    expect(added).toMatchObject({ type: ElementType.Shape, shapeId: 'star', path: registry.get('star')?.path });
    expect(added?.layerId).toBe(api.getActiveLayerId());
  });

  it('styles a shape with the board drawing style', () => {
    api.updateConfig({ strokeColor: '#ff0000', strokeWidth: 5, fill: '#00ff00', dasharray: '4 2', dashoffset: 1 });

    const element = service.addShape('star');

    expect(element?.style).toMatchObject({
      strokeColor: '#ff0000',
      strokeWidth: 5,
      fill: '#00ff00',
      dasharray: '4 2',
      dashoffset: 1,
      lineJoin: api.getConfig().lineJoin,
    });
  });

  it('lets props.style override the board drawing style', () => {
    api.updateConfig({ strokeColor: '#ff0000', fill: '#00ff00' });

    const element = service.addShape('star', { style: { fill: '#123456' } });

    expect(element?.style).toMatchObject({ strokeColor: '#ff0000', fill: '#123456' });
  });

  it('falls back to the default size when width is undefined', () => {
    const element = service.addShape('star', { width: undefined, height: undefined });
    const aspectRatio = registry.get('star')?.aspectRatio ?? 1;

    expect(element?.width).toBe(100);
    expect(element?.height).toBeCloseTo(100 / aspectRatio);
    expect(Number.isFinite(element?.height)).toBe(true);
  });

  it('keeps the shape identity when props try to override it', () => {
    const element = service.addShape('star', {
      type: ElementType.Rectangle,
      shapeId: 'heart',
      path: 'M0 0 Z',
    } as unknown as Partial<ShapeElement>);

    expect(element).toMatchObject({ type: ElementType.Shape, shapeId: 'star', path: registry.get('star')?.path });
  });

  it('returns null and warns for an unknown shape', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const before = api.getElements().length;

    expect(service.addShape('nope')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(api.getElements()).toHaveLength(before);
  });
});
