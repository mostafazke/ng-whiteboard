/*
 * Public API Surface of ng-whiteboard
 */

// Main component and service
export * from './lib/ng-whiteboard.service';
export * from './lib/ng-whiteboard.component';

// Core types and configurations
export * from './lib/core/types';
export * from './lib/core/config';

export * from './lib/core/api';

// Shapes
export { BUILT_IN_SHAPES } from './lib/core/elements/shapes/built-in-shapes';
export type { AvailableShape } from './lib/core/elements/shapes/shape-registry.service';
export type { ShapeElement } from './lib/core/elements/shape-element';
export { normalizeShapePath } from './lib/core/utils/svg/shape-path';
