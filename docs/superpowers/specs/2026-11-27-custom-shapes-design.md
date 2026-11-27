# Custom shapes: built-in shape set + user-registered SVG paths

Closes #226 ("How to add custom SVG rather than RECT and ELLIPSE": polygon, star, ...).

## Intent

Today the only closed shapes are Rectangle and Ellipse. Users want stars, polygons and other common shapes, and they want to bring their own. We ship a small set of the most-used shapes, and let consumers register more by giving an SVG path `d` string. Every shape, built-in or registered, behaves exactly like a Rectangle: draw by dragging, select, move, resize, rotate, flip, stroke/fill/dash/opacity, undo/redo, copy/paste, erase, arrow binding, export, and live collaboration.

Reference for the idea (not for the assets): Method Draw's shape library (https://github.com/methodofaction/Method-Draw, `src/js/shapelib`).

## Goals

- A built-in set of about 12 common shapes: triangle, right triangle, diamond, pentagon, hexagon, octagon, 5-point star, heart, cross, parallelogram, trapezoid, speech bubble.
- A consumer API: register shapes as `{ id, name, path }`, where `path` is any valid SVG path `d` string in any coordinate space. Example: `{ id: 'pentagon', name: 'Pentagon', path: 'm0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z' }`.
- Consumers can restrict which built-in shapes appear.
- Registered shapes appear in the editor toolbar next to the built-ins and behave identically.
- Boards stay portable. A board containing a shape renders, exports and syncs correctly even in an app that never registered that shape.

## Non-goals

- No shape categories, and no port of Method Draw's ~290-shape library. We decided against both to keep the bundle small and the UI simple.
- No full element-type plugin system. Consumers cannot supply custom rendering, hit-testing, tools or property panels. Shapes are path definitions only.
- No multi-path or multi-color shapes. One path, styled by the element's stroke and fill.
- No precise path-outline hit-testing. Shapes use the bounding box, the same as Rectangle and Ellipse.
- No per-shape adjustable parameters (star point count, polygon sides, corner radius).

## Anti-goals

- Shapes must not add noticeable weight to the library bundle. The built-in set should stay at a few KB.
- Strokes must not distort when a shape is stretched: no non-uniform stroke width, and stroke width must keep scaling with zoom like other elements.
- Loading a board with an unknown `shapeId` must never crash or blank the board.

## Constraints (from the codebase)

- Element types are a closed `ElementType` enum. They are wired through `elements/element.utils.ts` (`elementUtilsMap`), the canvas `@switch` in `components/canvas/whiteboard-canvas.component.html:88`, `components/editor/utils/shape-capabilities.ts`, and `elements/connection-points.service.ts` (`isConnectable`, around line 275).
- Tools are a closed `ToolType` enum. They are wired through `tools/tool-factory.service.ts`, `tools/tools.service.ts` (`DEFAULT_TOOLS`), `types/tool-icons.ts` (`TOOL_ICONS`, exhaustive), `input/tool-shortcuts.ts`, and the toolbar `icons` map.
- Tools read their options from the global `WhiteboardConfig` (the `RectangleTool` reads `cornerRadius`, for example). Consumers set config through the `<ng-whiteboard [config]>` input or `NgWhiteboardService.updateConfig()`. There is no `provide…()` / InjectionToken pattern in the library.
- **Zoom is implemented with the root SVG `viewBox`.** So rendering a 0..1 path with `transform: scale(w,h)` plus `vector-effect: non-scaling-stroke` would stop strokes scaling with zoom. The path must instead be scaled into real coordinates (see Design).
- Resize goes through `ElementUtil.resize` mutating `x/y/width/height` (`tools/select-tool.ts:432`). Multi-select scale and flips are generic over `width/height` and `scaleX/scaleY`.
- SVG/PNG export clones the live DOM, and clipboard/history/`exportData` store raw element JSON. So anything rendered and stored on the element works automatically.
- All 10 keyboard digit slots are already taken (`input/tool-shortcuts.ts:41`).
- Icons are a compile-time `IconName` union of raw SVG strings (`components/editor/icon/icons.ts`).

## Approaches considered

1. **A new `Shape` element type that stores its own normalized path (chosen).** The element carries `shapeId` and the normalized path, so it is self-contained. Rendering, export, collaboration and loading never depend on the registry. Cost: roughly 100–500 bytes per element.
2. **A `Shape` element that stores only `shapeId`**, with the path resolved from a registry at render time. Data is smaller, but a board opened in an app without that shape registered can't render it, and collaborators whose apps register different shapes would see different boards. Rejected: it breaks portability.
3. **Reuse the Pen element with a fixed path.** Least new code, but Pen has its own rendering pipeline (brushes, filters, masks) and property set, so shapes would inherit freehand behavior. Rejected.

## Design

### Shape definition and normalization

```ts
export interface ShapeDefinition {
  id: string;      // unique; registered ids override built-ins with the same id
  name: string;    // used for tooltip / aria-label
  path: string;    // any valid SVG path d string, any coordinate space
}
```

At registration, each definition is normalized once into a `NormalizedShape`:

- Parse the `d` string, covering all commands (M L H V C S Q T A Z, both relative and absolute).
- Convert it to absolute commands, and convert arcs (`A`) to cubic Béziers. Arcs cannot be scaled non-uniformly, and cubics can.
- Compute the **tight** bounding box, including Bézier extrema rather than just control points.
- Map the path into a 0..1 unit box.
- Store the result as a compact absolute `d` string plus `aspectRatio` (natural width / height).

This is a pure function in `utils/` with no DOM dependency, so it works under SSR and in tests. Invalid or empty paths are rejected with a console warning and skipped. They must not throw.

### Element model

```ts
export interface ShapeElement extends BaseElement {
  type: ElementType.Shape;   // 'shape'
  shapeId: string;           // informational: which definition it came from
  path: string;              // normalized 0..1 absolute path (self-contained)
  width: number;
  height: number;
}
```

`ShapeElementUtil` (`elements/shape-element.ts`) mirrors `RectangleElementUtil`: `create`, `resize` and `getBounds` are identical in logic, and `hitTest` uses `hitTestBoundingBox`. It is registered in `elementUtilsMap` and added to the `WhiteboardElements` map.

### Rendering

A new `@case (types.Shape)` in the canvas template renders `<path [attr.d]="item.path | shapePath: item.width : item.height">`. Stroke, fill, dash, linejoin and stroke-width bindings match the Rectangle case. `shapePath` is a pure pipe that scales the normalized absolute coordinates by `width` and `height`, which is a cheap numeric map over the commands. Because the output is real coordinates, stroke and zoom behave like every other element, and SVG/PNG export works unchanged.

### Built-in shapes

`elements/shapes/built-in-shapes.ts` exports `BUILT_IN_SHAPES: ShapeDefinition[]`, about 12 hand-authored, clean paths, together a few KB. They are not copied from Method Draw. Ids: `triangle`, `right-triangle`, `diamond`, `pentagon`, `hexagon`, `octagon`, `star`, `heart`, `cross`, `parallelogram`, `trapezoid`, `speech-bubble`.

### Configuration (public API)

New `WhiteboardConfig` fields:

```ts
shapes?: ShapeDefinition[];          // extra shapes, appended after built-ins
builtInShapes?: string[] | boolean;  // true (default) = all; false = none; string[] = only these ids, in this order
shapeId?: string;                    // the shape the Shape tool draws; default: first available shape
```

- A `ShapeRegistryService` (per board, provided alongside the other services) derives the available, normalized shape list from config as a signal.
- Consumers use the existing `[config]` input or `NgWhiteboardService.updateConfig({ shapes: [...] })`. No new API pattern.
- Export from the public `index.ts`: `ShapeDefinition`, `ShapeElement`, `BUILT_IN_SHAPES`, and the normalization function (so consumers can validate paths).
- *(Claude's call)* For programmatic creation, add `NgWhiteboardService.addShape(shapeId, props)`. It looks up the board's registry, copies the normalized path, and adds the element. If the id is unknown, it warns and returns `null`. Document that a raw `ShapeElement` passed to `addElements` must carry a normalized 0..1 `path`, meaning output of the exported normalizer. The render pipe does **not** re-normalize, which keeps the parser out of the render path.

### Tool

`ToolType.Shape = 'shape'` and a `ShapeTool` (`tools/shape-tool.ts`) modeled on `RectangleTool`:

- On pointer down, it creates a `ShapeElement` from the registry entry for `config.shapeId`, copying the normalized path into the element. If no shape is available, the tool does nothing.
- Drag behaves like Rectangle, with Alt drawing from the center and snap-to-grid supported.
- **Shift keeps the shape's natural aspect ratio**, not a square, so a star stays a star.

Other wiring:
- `ToolFactory`, `DEFAULT_TOOLS` and `TOOL_ICONS` get entries.
- In `tool-shortcuts.ts` it is added to `SHAPE_TOOLS` with `numbered: false` and the letter key `s`. If `s` is taken, the builder picks a free letter.
- It is included in `toolbarTools` filtering like any other tool.

### Editor UI

- **Toolbar:** one new **Shapes** button in the shape group. Its icon is the current `shapeId`'s path. Clicking it opens a grid popover of all available shapes: built-ins first, then registered shapes.
  - Picking a shape sets `shapeId` and activates `ToolType.Shape`.
  - The popover reuses the existing flyout patterns: positioning, focus-first-item, arrow-key navigation, close on blur or Escape.
  - *(Claude's call)* In compact mode, the existing shape flyout becomes one panel: the Rectangle/Ellipse/Line/Arrow row on top and the shape grid below it. There is no second-level popover; one panel with one focus and keyboard model is simpler to build and test. The collapsed trigger keeps its current "last used" behavior, so after picking a star it shows the star icon.
- **Icons:** `IconComponent` gains a way to render an arbitrary path, such as a `path` input that renders `<svg viewBox="0 0 1 1">` with `vector-effect="non-scaling-stroke"` and `stroke="currentColor"`. Shape icons are generated from the normalized path. Using non-scaling stroke here is fine because icons are not zoomed.
- **Properties panel:** `ELEMENT_SECTIONS[Shape]` and `TOOL_SECTIONS[Shape]` are `stroke, fill, strokeWidth, strokeStyle, opacity`, the same as Ellipse.

### Arrow binding

Add `ElementType.Shape` to `isConnectable` in `connection-points.service.ts`. It uses the existing bounding-box fallback for connection points and closest edge point, which is consistent with bounding-box hit-testing.

### Robustness

- Elements render from their own `path`, so an unknown or unregistered `shapeId` still renders.
- An element with a missing or invalid `path` renders nothing and must not crash bounds or selection code, which still uses `x/y/width/height`.
- *(Claude's call)* Add a general guard so that elements of an **unknown `type`** are skipped, with a single warning, instead of crashing when `getElementUtil` returns `undefined`. This protects future versions when they meet element types from newer versions. 6.0.x clients cannot be fixed retroactively.

### Demo and docs

- Add a "Custom shapes" example in `projects/demo` that registers one or two custom shapes (for example the pentagon path above, or a cloud).
- Document `shapes`, `builtInShapes`, `shapeId` and `ToolType.Shape` in the API reference (`projects/demo/src/app/documentation/pages/api-reference`), and update tool lists where ToolType is enumerated in the demo.
- After release, reply to #226 with a usage snippet and close it.

### Release

The user chose to ship this as a **major release (7.0.0)**. The feature commit is `feat!:` with a `BREAKING CHANGE:` footer. The footer covers:
- `ElementType` and `ToolType` gain `Shape`, so exhaustive switches and `Record<…>` maps in consumer code must handle it.
- The toolbar gains a Shapes button and an `s` shortcut by default. Use `toolbarTools` to hide them.
- 6.x clients cannot render or safely receive shape elements, for example in live collaboration. Upgrade every client together.

The Shapes button is **on by default**.

### Testing

- Unit tests:
  - The normalizer: relative and absolute commands, H/V/S/T, arcs, a tight bbox for curves, invalid input.
  - The `shapePath` pipe.
  - `ShapeElementUtil`, following the existing `__tests__/*-element.test.ts` pattern.
  - `ShapeTool`: drag, Shift aspect, Alt center, snap.
  - The registry: merge order, `builtInShapes` filtering, id override.
  - Toolbar popover: open, pick, keyboard navigation.
  - The connectable check.
- Canvas render test for the new case.

## Left to the builder

- The exact path data and visual design of the 12 built-in shapes. They must be clean and visually balanced in a square box.
- The path parser/normalizer implementation: hand-written or a small dependency. A dependency must be tiny, tree-shakable, MIT/compatible, and justified against bundle size.
- The keyboard letter for the Shape tool, if `s` conflicts.
- The popover's exact layout (columns, sizes) within the existing editor visual language.
- Commit granularity. Use conventional commits and no AI attribution trailers.
