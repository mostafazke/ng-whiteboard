import { Injectable, Signal, computed, inject } from '@angular/core';
import { ConfigService } from '../../config/config.service';
import { ShapeDefinition, WhiteboardConfig } from '../../types/config';
import { NormalizedShapePath, normalizeShapePath } from '../../utils/svg/shape-path';
import { BUILT_IN_SHAPES } from './built-in-shapes';

export interface AvailableShape {
  id: string;
  name: string;
  /** Normalized path, coordinates in the unit square. */
  path: string;
  /** Width / height of the source path. */
  aspectRatio: number;
}

const sameShapes = (a: AvailableShape[], b: AvailableShape[]) =>
  a.length === b.length &&
  a.every((shape, i) => shape.id === b[i].id && shape.name === b[i].name && shape.path === b[i].path);

@Injectable({ providedIn: 'root' })
export class ShapeRegistryService {
  private configService = inject(ConfigService);
  private normalized = new Map<string, NormalizedShapePath | null>();

  readonly shapes: Signal<AvailableShape[]> = computed(
    () => {
      const config = this.configService.getConfigSignal()();
      return this.definitions(config).flatMap((definition) => {
        const normalized = this.normalize(definition);
        return normalized ? [{ id: definition.id, name: definition.name, ...normalized }] : [];
      });
    },
    { equal: sameShapes }
  );

  get(id: string): AvailableShape | undefined {
    return this.shapes().find((shape) => shape.id === id);
  }

  activeShape(): AvailableShape | undefined {
    const shapeId = this.configService.getConfigSignal()().shapeId;
    return (shapeId !== undefined && this.get(shapeId)) || this.shapes()[0];
  }

  private definitions(config: WhiteboardConfig): ShapeDefinition[] {
    const builtIn = config.builtInShapes ?? true;
    const definitions: ShapeDefinition[] =
      builtIn === true
        ? [...BUILT_IN_SHAPES]
        : builtIn === false
          ? []
          : builtIn.flatMap((id) => BUILT_IN_SHAPES.filter((shape) => shape.id === id));

    for (const custom of config.shapes ?? []) {
      const index = definitions.findIndex((shape) => shape.id === custom.id);
      if (index >= 0) definitions[index] = custom;
      else definitions.push(custom);
    }
    return definitions;
  }

  private normalize(definition: ShapeDefinition): NormalizedShapePath | null {
    if (!this.normalized.has(definition.path)) {
      const result = normalizeShapePath(definition.path);
      if (!result) console.warn(`ng-whiteboard: skipping shape "${definition.id}", its path is invalid.`);
      this.normalized.set(definition.path, result);
    }
    return this.normalized.get(definition.path) ?? null;
  }
}
