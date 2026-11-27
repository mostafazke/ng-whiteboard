# Custom Shapes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Shape` element and tool that draw any SVG path stretched to a box. Ship 12 built-in shapes, and let consumers register their own through `WhiteboardConfig.shapes`.

**Architecture:** A pure normalizer converts any `d` string to absolute commands, turns arcs into cubics, and maps the path into a 0..1 box. Each `ShapeElement` stores that normalized path, so boards stay self-contained. At render time a pure pipe scales the path to `width × height` in real coordinates. A per-board `ShapeRegistryService` derives the available shapes from config, and the editor toolbar gets a Shapes grid.

**Tech Stack:** Angular 20 (standalone components, signals, OnPush), Jest via Nx (`@nx/jest`), and SVG rendering.

**Spec:** `docs/superpowers/specs/2026-11-27-custom-shapes-design.md`

## Global Constraints

- Release: **7.0.0**. Task 2's commit is `feat(shapes)!:` with a `BREAKING CHANGE:` footer (exact text in Task 2). All other commits are conventional: `feat(shapes):`, `test:`, `docs:`.
- No AI attribution trailers in commits.
- No new runtime dependency unless it is tiny, tree-shakable and MIT-compatible. The default is a hand-written parser.
- Built-in shapes are hand-authored and must not be copied from Method Draw. Built-in ids, in order: `triangle`, `right-triangle`, `diamond`, `pentagon`, `hexagon`, `octagon`, `star`, `heart`, `cross`, `parallelogram`, `trapezoid`, `speech-bubble`.
- Property sections for Shape match Ellipse: element `stroke, fill, strokeWidth, strokeStyle, opacity`; tool `stroke, fill, strokeWidth, strokeStyle`.
- The Shape tool is `numbered: false` with key `s`, and the Shapes button is on by default.
- Comments only for complex code (user rule).
- All paths below are relative to `projects/ng-whiteboard/src/lib/` unless they start with `projects/` or `docs/`.
- Run a single test file with: `npx nx test ng-whiteboard --testFile=<path>`.

## Review Focus

1. **Real-world `d` strings:** paths with no separators (`m1-2.5.5`), exponents (`1e-5`), implicit repeated commands after `M`/`L`, and lowercase relative arcs with flag shorthand (`a1 1 0 011 1`) must parse correctly. The test is in Task 1.
2. **Degenerate paths:** a path with zero width or height (for example `M0 0 L10 0`) must not produce NaN or Infinity. The normalizer returns `null` and the registry skips it with one warning. The test is in Task 1, plus a skip test in Task 3.
3. **Loaded boards with unknown element types or a shape missing `path`:** these must not crash bounds or selection code, and the unknown type is dropped with one warning. Tests are in Task 2 (guard) and Task 4 (an empty `path` renders nothing).
4. **Config changed at runtime** (shapes added or removed through `updateConfig`): the toolbar grid and the tool must reflect the change, and a duplicate id overrides the built-in. Tests are in Task 3.
5. **No shapes available** (`builtInShapes: false` and no `shapes`): the Shape tool must do nothing on pointer down and the Shapes button must be hidden. Tests are in Task 5 (tool) and Task 6 (toolbar).

---

### Task 1: Path normalizer and scaler

**Files:**
- Create: `core/utils/svg/shape-path.ts`
- Modify: `core/utils/svg/index.ts` (export)
- Test: `core/utils/svg/shape-path.spec.ts`

**Interfaces:**
- Produces:
  - `interface NormalizedShapePath { path: string; aspectRatio: number }`. Here `path` contains only absolute `M L C Q Z` commands, with every coordinate in [0,1], and `aspectRatio` is natural width ÷ height.
  - `normalizeShapePath(d: string): NormalizedShapePath | null`
  - `scaleShapePath(path: string, width: number, height: number): string`

- [ ] **Step 1: Write the failing tests in `shape-path.spec.ts`**
  - `normalizes the issue pentagon`: `normalizeShapePath('m0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z')`. The result path starts with `M0 0`, every number is within [0,1] (parse all numbers out with a regex), and `aspectRatio` is approximately `297.99/298.82` (`toBeCloseTo(…, 3)`).
  - `handles H V S T and relative commands`: `'M10 10 h20 v20 H10 Z'` gives exactly the normalized path `'M0 0 L1 0 L1 1 L0 1 Z'`.
  - `tight bbox for curves`: `'M0 0 C0 -10 10 -10 10 0 Z'`. The true top extreme is y = -7.5, not -10. Assert `aspectRatio` is close to `10/7.5`.
  - `converts arcs to cubics`: `'M0 50 A50 50 0 0 1 100 50 Z'` gives a path with no `A`, containing `C`, and `aspectRatio` close to `2`.
  - `parses compact syntax`: `'m0 0l10-5.5.5 1e1z'`. The result is non-null and every value is finite. This is Review Focus 1.
  - `rejects degenerate and invalid`: `normalizeShapePath('M0 0 L10 0')`, `normalizeShapePath('')` and `normalizeShapePath('garbage')` each return `null`. This is Review Focus 2.
  - `scaleShapePath`: `scaleShapePath('M0 0 L1 0 L1 1 Z', 200, 50)` equals `'M0 0 L200 0 L200 50 Z'`.

- [ ] **Step 2: Run and verify they fail**
  Run: `npx nx test ng-whiteboard --testFile=projects/ng-whiteboard/src/lib/core/utils/svg/shape-path.spec.ts`
  Expected: FAIL (module not found).

- [ ] **Step 3: Implement `normalizeShapePath` and `scaleShapePath`**
  - Tokenizer: regex `/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g`. Arc flags are single digits, so read them one character at a time when parsing an `A` segment.
  - Convert to absolute and expand H/V to L, S to C (reflecting the previous control point) and T to Q. Implicit repeats follow the SVG rules: extra pairs after `M` are `L`.
  - Arc to cubic: use the standard SVG endpoint-to-center conversion (spec F.6.5), then split into segments of at most 90° with `k = 4/3·tan(θ/4)`.
  - Tight bbox: endpoints plus the extrema of each quadratic and cubic, found by solving the derivative per axis and keeping roots in (0,1).
  - Return `null` if there are no drawable segments, if width or height is below `1e-9`, or if any value is non-finite.
  - Output numbers rounded to 4 decimals, with trailing zeros stripped.
  - `scaleShapePath` multiplies x coordinates by `width` and y coordinates by `height`. Command letters keep their arity: M and L take 1 point, Q takes 2, C takes 3.

- [ ] **Step 4: Run and verify they pass** (same command; expected PASS).

- [ ] **Step 5: Commit**
  `git commit -m "feat(shapes): add svg path normalizer and scaler"`

---

### Task 2: Shape element type and unknown-type guard

**Files:**
- Create: `core/elements/shape-element.ts`
- Modify:
  - `core/types/elements.ts:13-31` (enum and type map)
  - `core/elements/index.ts`
  - `core/elements/element.utils.ts:10-18`
  - `core/components/editor/utils/shape-capabilities.ts:16-24` (`ELEMENT_SECTIONS`)
  - `core/elements/connection-points.service.ts` (`isConnectable`, around line 275)
  - `core/elements/elements.service.ts` (`addElements` around line 200, `setElements` around line 365)
- Test:
  - `core/elements/__tests__/shape-element.test.ts`
  - `core/elements/elements.service.spec.ts` (add cases; create the file if it doesn't exist)
  - `core/elements/connection-points.service.spec.ts` (add a case if the file exists, otherwise use the Shape util test)

**Interfaces:**
- Produces:
  - `ElementType.Shape = 'shape'`
  - `interface ShapeElement extends BaseElement { type: ElementType.Shape; shapeId: string; path: string; width: number; height: number }`
  - `class ShapeElementUtil implements ElementUtil<ShapeElement>`, with `create` defaults of `shapeId: ''`, `path: ''`, `width: 1`, `height: 1`, `selectAfterDraw: true`, otherwise the same as Rectangle
  - `isKnownElementType(type: unknown): type is ElementType`, exported from `element.utils.ts`

- [ ] **Step 1: Write failing tests**
  - In `shape-element.test.ts`, copy the structure of `rectangle-element.test.ts`: create defaults, create with props, resize for each of N/S/E/W/NE/SW, `getBounds`, and `hitTest` inside/outside. Also assert `create({ shapeId: 'star', path: 'M0 0 L1 1 Z' }).path === 'M0 0 L1 1 Z'`.
  - In `elements.service.spec.ts`: `setElements([rect, { ...rect, id: 'x', type: 'bogus' }])` keeps only `rect`, and `console.warn` is called once. The same goes for `addElements`. This is Review Focus 3.
  - Connectable: `isConnectable` returns `true` for a shape element.

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Add the enum member and the type-map entry.
  - Add `ShapeElementUtil`, reusing Rectangle's resize and bounds logic. It is acceptable to extract a shared helper `resizeBox`/`boxBounds` inside `rectangle-element.ts` and import it.
  - Register the util in `elementUtilsMap`.
  - Add `ELEMENT_SECTIONS[ElementType.Shape] = ['stroke','fill','strokeWidth','strokeStyle','opacity']`.
  - Add Shape to `isConnectable`.
  - Filter unknown types at the start of `addElements` and `setElements`, warning once per call with the list of distinct unknown types.
  - Then run `npx tsc -p projects/ng-whiteboard/tsconfig.lib.json --noEmit` and fix every exhaustive `Record<ElementType, …>` it flags.

- [ ] **Step 4: Run the test files plus the full suite**
  Run: `npx nx test ng-whiteboard`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```
  git commit -m "feat(shapes)!: add shape element type" -m "BREAKING CHANGE: ElementType and ToolType gain a Shape member; exhaustive switches and Record<ElementType|ToolType, …> maps in consumer code must handle it. The editor toolbar shows a new Shapes button and binds the 's' key by default (hide via toolbarTools). 6.x clients cannot render or safely receive shape elements (e.g. in live collaboration); upgrade all clients together."
  ```

---

### Task 3: Built-in shapes, registry, config and public API

**Files:**
- Create:
  - `core/elements/shapes/built-in-shapes.ts`
  - `core/elements/shapes/shape-registry.service.ts`
  - `core/elements/shapes/index.ts`
- Modify:
  - `core/types/config.ts:39-86` (new fields and `ShapeDefinition`)
  - `core/config/config.service.ts:18-46` (defaults)
  - `ng-whiteboard.component.ts:73` (providers)
  - `core/api/api.service.ts`
  - `ng-whiteboard.service.ts`
  - `projects/ng-whiteboard/src/index.ts`
- Test:
  - `core/elements/shapes/shape-registry.service.spec.ts`
  - `core/elements/shapes/built-in-shapes.spec.ts`
  - `ng-whiteboard.service.spec.ts` (add cases; create the file if it doesn't exist)

**Interfaces:**
- Consumes: `normalizeShapePath` (Task 1); `ShapeElement` and `createElement` (Task 2).
- Produces:
  - `interface ShapeDefinition { id: string; name: string; path: string }` in `core/types/config.ts`.
  - `WhiteboardConfig` gains `shapes?: ShapeDefinition[]`, `builtInShapes?: string[] | boolean` (default `true`) and `shapeId?: string`.
  - `interface AvailableShape { id: string; name: string; path: string; aspectRatio: number }`, where `path` is the normalized path.
  - `BUILT_IN_SHAPES: readonly ShapeDefinition[]`
  - `ShapeRegistryService` with:
    - `readonly shapes: Signal<AvailableShape[]>`
    - `get(id: string): AvailableShape | undefined`
    - `activeShape(): AvailableShape | undefined`, which resolves `config.shapeId` and falls back to the first available shape.
  - `ApiService.getAvailableShapes(): AvailableShape[]`, `ApiService.getActiveShape(): AvailableShape | undefined` and `ApiService.addShape(shapeId: string, props?: Partial<ShapeElement>): ShapeElement | null`.
  - `NgWhiteboardService.getAvailableShapes()` and `NgWhiteboardService.addShape(shapeId, props?)`, which delegate to the active board like the existing methods.
  - Public exports: `ShapeDefinition`, `ShapeElement`, `AvailableShape`, `BUILT_IN_SHAPES`, `normalizeShapePath`.

- [ ] **Step 1: Write failing tests**
  - `built-in-shapes.spec.ts`:
    - The ids equal the 12 ids in Global Constraints, in that order.
    - Each path normalizes to non-null.
    - `star` and `pentagon` have `aspectRatio` close to their geometric values (±0.05).
  - Registry spec (set config through `ConfigService.updateConfig`):
    - The default gives 12 shapes.
    - `builtInShapes: false` with no `shapes` gives `[]`.
    - `builtInShapes: ['star','heart']` gives exactly those, in that order.
    - `shapes: [{id:'cloud',…}]` is appended after the built-ins.
    - `shapes: [{id:'star', name:'My star', path:…}]` replaces the built-in star in its original position.
    - An invalid path is skipped with one `console.warn`.
    - Changing config at runtime updates the `shapes()` signal.
    - `activeShape()` falls back to the first shape when `shapeId` is unknown.
    - These cover Review Focus 2 and 4.
  - Service spec:
    - `addShape('star', {x:10,y:20,width:100,height:80})` adds a `ShapeElement` whose `shapeId` is `'star'` and whose `path` equals the registry path.
    - `addShape('nope')` returns `null` and warns.

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Author the 12 shape paths, each balanced in a square, with clean integer or one-decimal coordinates.
  - The registry is a `computed` over `ConfigService`'s config signal. Normalization results are memoized by `path` string.
  - Provide the registry next to `ConfigService` in the providers array.
  - Add the config defaults: `builtInShapes: true`, and `shapes` and `shapeId` undefined.
  - Wire the `ApiService` and `NgWhiteboardService` methods, and add the public exports.

- [ ] **Step 4: Run the tests (PASS), then the full suite.**

- [ ] **Step 5: Commit**
  `git commit -m "feat(shapes): add built-in shapes, registry and config"`

---

### Task 4: Render shapes on the canvas

**Files:**
- Create: `core/pipes/shape-path.pipe.ts`
- Modify:
  - `core/pipes/index.ts`
  - `core/components/canvas/whiteboard-canvas.component.html:192-221` (add a case after Ellipse)
  - `core/components/canvas/whiteboard-canvas.component.ts` (pipe import)
- Test:
  - `core/pipes/shape-path.pipe.spec.ts`
  - `core/components/canvas/whiteboard-canvas.component.spec.ts` (add cases)

**Interfaces:**
- Consumes: `scaleShapePath` (Task 1) and `ShapeElement` (Task 2).
- Produces: a pure pipe `shapePath` used as `path | shapePath: width : height`, returning `string`. An empty or falsy path returns `''`.

- [ ] **Step 1: Write failing tests**
  - Pipe: `transform('M0 0 L1 1 Z', 10, 20)` returns `'M0 0 L10 20 Z'`, and `transform('', 10, 20)` returns `''`.
  - Canvas: a shape element with `path:'M0 0 L1 0 L1 1 Z'`, `width:100`, `height:50`, `style.fill:'red'` renders `g[data-wb-id] path` with `d="M0 0 L100 0 L100 50 Z"`, `fill="red"`, and stroke attributes matching the Rectangle case.
  - Canvas: a shape with `path:''` renders without throwing. This is Review Focus 3.

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Add the pipe.
  - Add `@case (types.Shape)`, which renders `<g><path …></g>` with the same attribute bindings as the Rectangle case except `rx/width/height`.

- [ ] **Step 4: Run the tests (PASS).**

- [ ] **Step 5: Commit**
  `git commit -m "feat(shapes): render shape elements"`

---

### Task 5: Shape tool

**Files:**
- Create: `core/tools/shape-tool.ts`
- Modify:
  - `core/types/tools.ts:3-15`
  - `core/types/tool-icons.ts:4`
  - `core/tools/index.ts`
  - `core/tools/tool-factory.service.ts:25-57`
  - `core/tools/tools.service.ts:16-116` (entry after Ellipse; renumber `order`)
  - `core/input/tool-shortcuts.ts:19-39`
  - `core/components/editor/utils/shape-capabilities.ts:26-33` (`TOOL_SECTIONS`)
- Test:
  - `core/tools/__tests__/shape-tool.test.ts`
  - `core/tools/tool-factory.service.spec.ts` (add a case)
  - `core/input/tool-shortcuts.spec.ts` (add a case if the file exists)

**Interfaces:**
- Consumes: `ApiService.getActiveShape()` (Task 3) and `createElement(ElementType.Shape, …)` (Task 2).
- Produces:
  - `ToolType.Shape = 'shape'`
  - `class ShapeTool extends BaseTool`, with `type = ToolType.Shape` and `baseCursor = CursorType.Crosshair`
  - Shape added to `SHAPE_TOOLS`
  - A `GROUPS` entry `{ tool: ToolType.Shape, label: 'Shapes', keys: ['s'], numbered: false }`, placed after Ellipse

- [ ] **Step 1: Write failing tests** (mock pattern from `ellipse-tool.test.ts`; `apiService.getActiveShape` mocked to return `{id:'star', name:'Star', path:'M0 0 L1 1 Z', aspectRatio: 2}`)
  - Pointer down at (100,200): `createElement` is called with `ElementType.Shape` and `{ x:100, y:200, shapeId:'star', path:'M0 0 L1 1 Z', style: <config style>, zIndex: 1 }`.
  - Moving to (300,260) gives `updateDraftElements` with `{x:100, y:200, width:200, height:60}`.
  - Shift held while moving to (300,260): the natural aspect of 2 is kept, so `{width:200, height:100}`. The larger of the two drag extents is used.
  - Alt held while moving to (300,260): the draw is centered, so `{x:-100, y:140, width:400, height:120}`.
  - Snap-to-grid with `gridSize: 10` rounds as `RectangleTool` does.
  - Pointer up commits and calls `finalizeDraw`.
  - `getActiveShape` returns `undefined`: pointer down does not call `addDraftElements`. This is Review Focus 5.
  - The factory creates a `ShapeTool` for `ToolType.Shape`.
  - `toolForKey('s')` returns `ToolType.Shape`, and the numbered tools are unchanged.

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Model the tool on `RectangleTool`, with Shift scaling to `aspectRatio` instead of a square.
  - Add the enum member, `TOOL_ICONS` entry (any star SVG string), factory case, `DEFAULT_TOOLS` entry (`id:'shape'`, `name:'Shapes'`, `description:'Draw shapes'`), shortcut entry, and `TOOL_SECTIONS[Shape] = ['stroke','fill','strokeWidth','strokeStyle']`.
  - Run `tsc --noEmit` and fix the exhaustive maps, including the toolbar `icons` map. A temporary `'Rectangle'` icon is acceptable until Task 6.

- [ ] **Step 4: Run the tests and the full suite (PASS).**

- [ ] **Step 5: Commit**
  `git commit -m "feat(shapes): add shape tool"`

---

### Task 6: Editor toolbar Shapes picker

**Files:**
- Modify:
  - `core/components/editor/icon/icon.component.ts`
  - `core/components/editor/panels/toolbar/toolbar.component.ts` (and its template and styles inside the file)
  - `core/components/editor/whiteboard-editor.component.html:68` (pass the shapes and the active `shapeId` to the toolbar)
  - `core/components/editor/editor-state.service.ts` (a `selectShape(id)` method)
- Test:
  - `core/components/editor/icon/icon.component.spec.ts`
  - `core/components/editor/panels/toolbar/toolbar.component.spec.ts`

**Interfaces:**
- Consumes: `ShapeRegistryService.shapes` and `activeShape()` (Task 3), and `ToolType.Shape` (Task 5).
- Produces:
  - `IconComponent` gets an optional `@Input() path?: string`, a normalized 0..1 path. When set, it renders `<svg viewBox="-0.1 -0.1 1.2 1.2" width="24" height="24" fill="none" stroke="currentColor"><path d=… vector-effect="non-scaling-stroke" stroke-width="2"/></svg>` instead of `name`.
  - `ToolbarComponent` gets inputs `shapes = input<AvailableShape[]>([])` and `activeShapeId = input<string | undefined>()`, and an output `shapeSelect = output<string>()`.
  - `EditorStateService.selectShape(id: string): void` sets config `shapeId` and the active tool to `ToolType.Shape`.

- [ ] **Step 1: Write failing tests**
  - Icon: `path='M0 0 L1 1 Z'` renders an `svg path[d="M0 0 L1 1 Z"]`, and `name` still works.
  - Toolbar, wide mode:
    - The Shapes button renders with the active shape's icon.
    - Clicking it opens a grid with one `button[role=menuitemradio]` per shape, labelled by `name`, and focuses the first item.
    - ArrowRight and ArrowDown move focus; Escape closes the grid and restores focus to the trigger.
    - Clicking "Heart" emits `shapeSelect('heart')` and closes the grid.
  - Toolbar, `shapes = []`: no Shapes button. This is Review Focus 5.
  - Toolbar, compact mode: the shape flyout shows the Rectangle/Ellipse/Line/Arrow row with the shapes grid below it in the same `.flyout-menu`. After selecting a shape, the collapsed trigger shows that shape's icon.
  - Toolbar, runtime update: setting the `shapes` input to add one item re-renders the grid with that item last. This is Review Focus 4.

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Extend `IconComponent` with the `path` input.
  - In the toolbar, render the `ToolType.Shape` entry as the Shapes trigger plus a grid popover. Reuse the existing flyout positioning, focus and blur handlers rather than duplicating them.
  - Compact mode merges the grid into the existing shape flyout.
  - Wire the editor template to the registry signals and `selectShape`.

- [ ] **Step 4: Run the tests and the full suite (PASS). Lint with `npx nx run ng-whiteboard:lint` (no new errors).**

- [ ] **Step 5: Manual check with the run skill**
  - `yarn start`. Then draw each built-in shape; resize, rotate, flip and multi-select scale it; undo and redo; copy and paste; erase it; bind an arrow to it.
  - Zoom in and confirm the stroke scales with zoom.
  - Export SVG and PNG.
  - Repeat in a narrow viewport.

- [ ] **Step 6: Commit**
  `git commit -m "feat(shapes): add shapes picker to editor toolbar"`

---

### Task 7: Demo example and docs

**Files:**
- Modify:
  - `projects/demo/src/app/documentation/pages/api-reference/api-reference.component.html` (around line 996) and `.ts` (around line 128)
  - `projects/demo/src/app/examples/basic/basic.component.ts` (around line 129)
  - `projects/ng-whiteboard/README.md` (Custom shapes section)
- Create: a "Custom shapes" example in `projects/demo/src/app/examples/`, following the existing example structure and routing. It registers `{ id:'pentagon', name:'Pentagon', path:'m0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z' }` and one cloud shape, and shows `addShape` from a button.

- [ ] **Step 1:** Document `shapes`, `builtInShapes`, `shapeId`, `ToolType.Shape`, `ElementType.Shape`, `addShape` and `getAvailableShapes` in the API reference, and add `ToolType.Shape` wherever ToolType is listed.
- [ ] **Step 2:** Add the example and its route or menu entry.
- [ ] **Step 3:** Run `npx nx test demo --watch=false`, `npx nx run demo:lint` and `yarn build`. Expected: all pass.
- [ ] **Step 4:** Check the example in the browser through the run skill.
- [ ] **Step 5: Commit**
  `git commit -m "docs(shapes): add custom shapes example and api reference"`

---

After release: reply on #226 with the `shapes` config snippet and close it. Confirm with the user before posting.
