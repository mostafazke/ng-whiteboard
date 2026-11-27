import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../../config/config.service';
import { normalizeShapePath } from '../../utils/svg/shape-path';
import { BUILT_IN_SHAPES } from './built-in-shapes';
import { ShapeRegistryService } from './shape-registry.service';

const CLOUD = 'M25 60 C10 60 10 40 25 40 C25 20 50 20 55 35 C65 25 85 30 80 45 C95 45 95 60 80 60 Z';

describe('ShapeRegistryService', () => {
  let registry: ShapeRegistryService;
  let config: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConfigService, ShapeRegistryService] });
    registry = TestBed.inject(ShapeRegistryService);
    config = TestBed.inject(ConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  const ids = () => registry.shapes().map((s) => s.id);

  it('exposes the 12 built-in shapes by default, normalized', () => {
    const shapes = registry.shapes();
    expect(shapes).toHaveLength(12);
    expect(ids()).toEqual(BUILT_IN_SHAPES.map((s) => s.id));
    const star = registry.get('star');
    const normalized = normalizeShapePath(BUILT_IN_SHAPES.find((s) => s.id === 'star')?.path ?? '');
    expect(star?.path).toBe(normalized?.path);
    expect(star?.aspectRatio).toBe(normalized?.aspectRatio);
  });

  it('has no shapes when built-ins are off and none are configured', () => {
    config.updateConfig({ builtInShapes: false });
    expect(registry.shapes()).toEqual([]);
    expect(registry.activeShape()).toBeUndefined();
  });

  it('keeps only the listed built-ins, in the listed order', () => {
    config.updateConfig({ builtInShapes: ['star', 'heart'] });
    expect(ids()).toEqual(['star', 'heart']);
  });

  it('lists a built-in only once when its id is repeated', () => {
    config.updateConfig({ builtInShapes: ['star', 'star'] });
    expect(ids()).toEqual(['star']);
  });

  it('appends custom shapes after the built-ins', () => {
    config.updateConfig({ shapes: [{ id: 'cloud', name: 'Cloud', path: CLOUD }] });
    expect(ids()).toHaveLength(13);
    expect(ids()[12]).toBe('cloud');
    expect(registry.get('cloud')?.name).toBe('Cloud');
  });

  it('lets a custom shape replace a built-in with the same id in place', () => {
    const path = 'M0 0 L10 0 L10 10 Z';
    config.updateConfig({ shapes: [{ id: 'star', name: 'My star', path }] });
    expect(ids()).toEqual(BUILT_IN_SHAPES.map((s) => s.id));
    expect(registry.get('star')).toEqual({ id: 'star', name: 'My star', ...normalizeShapePath(path) });
  });

  it('skips a shape with an invalid path and warns once', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    config.updateConfig({
      shapes: [
        { id: 'flat', name: 'Flat', path: 'M0 0 L10 0' },
        { id: 'cloud', name: 'Cloud', path: CLOUD },
      ],
    });
    expect(ids()).not.toContain('flat');
    expect(ids()).toContain('cloud');

    config.updateConfig({ zoom: 2 });
    registry.shapes();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('updates the shapes signal when the config changes at runtime', () => {
    expect(ids()).not.toContain('cloud');
    config.updateConfig({ shapes: [{ id: 'cloud', name: 'Cloud', path: CLOUD }] });
    expect(ids()).toContain('cloud');
    config.updateConfig({ shapes: [], builtInShapes: ['heart'] });
    expect(ids()).toEqual(['heart']);
  });

  it('resolves the active shape from shapeId, falling back to the first shape', () => {
    expect(registry.activeShape()?.id).toBe('triangle');
    config.updateConfig({ shapeId: 'heart' });
    expect(registry.activeShape()?.id).toBe('heart');
    config.updateConfig({ shapeId: 'unknown' });
    expect(registry.activeShape()?.id).toBe('triangle');
  });
});
