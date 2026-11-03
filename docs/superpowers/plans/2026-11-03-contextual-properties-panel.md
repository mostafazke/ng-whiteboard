# Contextual Properties Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The editor's properties panel shows only the sections that apply to the selection (or to the active drawing tool when nothing is selected) and exposes every visual property each shape stores.

**Architecture:** A pure capability util maps element types / tools to a set of panel sections. `mergeSelectedProperties` grows the new shape properties. `EditorStateService` gets one update method per new property (element writes when selected, config writes otherwise), all routed through the existing `updateElementProperty` dispatcher and `applyUpdates` (locked-skip, one history step). Two small UI primitives (segmented control, arrowhead picker) are added under `ui/`, and the properties panel wraps every section in `@if (show('<section>'))`.

**Tech Stack:** Angular 20 standalone + signals + OnPush, Jest (jest-preset-angular), Nx, ng-packagr.

**Spec:** `docs/superpowers/specs/2026-11-03-contextual-properties-panel-design.md`

All paths below are relative to `projects/ng-whiteboard/src/lib/core/` unless they start with `projects/`, `docs/` or `README`.

## Global Constraints

- Canvas output for existing data stays identical; no change to how tools draw except the rectangle tool reading `cornerRadius`.
- The only public API addition is optional `WhiteboardConfig.cornerRadius?: number`; when unset, new rectangles keep `rx: 5`.
- No new dependencies; icons are inline SVG or the existing `ng-icon` set.
- Each panel change = exactly one history step; slider drags use the existing `editStart`/`editEnd` → `beginEdit/endEdit` batching; locked elements (own lock or locked layer) are skipped via `applyUpdates`.
- Section labels/values: "Text color" on text; line ends "Round" / "Square" / "Flat" (= `LineCap.Round` / `Square` / `Butt`); arrow path "Straight" / "Curved" / "Elbow" (= `ArrowLineStyle` `'straight' | 'curve' | 'elbow'`); corner radius slider 0–50 step 1.
- Curved on an existing arrow: control point = midpoint of (x1,y1)-(x2,y2) offset perpendicular by 20% of the length: `cx = mx - dy*0.2`, `cy = my + dx*0.2`; elbow → `{ type: 'elbow', midRatio: 0.5 }`; straight → `{ type: 'straight' }`.
- Opacity is hidden when nothing is selected.
- Works in wide/medium floating panel and compact bottom sheet; coarse pointers get 44px targets; keyboard reachable; `--wb-*` tokens only (light/dark).
- User CLAUDE.md: comments sparingly, only for complex code. Conventional commits with `Co-Authored-By` trailer.
- Every task verifies with: the touched spec files, the full lib suite (`npx nx test ng-whiteboard --watch=false`), `npx nx run ng-whiteboard:lint` (0 errors) and `yarn build:lib`.

## Review Focus

1. Mixed selection (arrow + rectangle): only shared sections render; a stroke-width change updates both in one undo step. → Task 5 test.
2. Selection with a locked arrow plus an unlocked arrow: changing the end head updates only the unlocked one, one undo step. → Task 3 test.
3. Selection switches from an arrow to an image while the panel is open: arrow sections disappear, only opacity (+ align/layer/actions) remains. → Task 5 test.
4. A bound arrow switched to Curved, then the bound rectangle moves: arrow endpoints follow and nothing throws. → Task 3 test.
5. Phone sheet (390×844) with an arrow selected: head pickers and segmented controls fit without horizontal overflow; coarse targets ≥ 44px. → Task 6 driver check.

---

### Task 1: Section capabilities and merged properties

**Files:**
- Create: `components/editor/utils/shape-capabilities.ts`
- Create: `components/editor/utils/shape-capabilities.spec.ts`
- Modify: `components/editor/utils/selected-properties.ts` (+ its spec, create `selected-properties.spec.ts` if none exists)

**Interfaces:**
- Produces:
  - `type PropertySection = 'stroke' | 'fill' | 'strokeWidth' | 'strokeStyle' | 'lineEnds' | 'cornerRadius' | 'arrowHeads' | 'arrowPath' | 'font' | 'opacity' | 'brush';`
  - `function sectionsForElements(types: ElementType[]): ReadonlySet<PropertySection>` — intersection over the types per the spec table (empty input → empty set). `brush` never appears for elements.
  - `function sectionsForTool(tool: ToolType): ReadonlySet<PropertySection>` — Pen → stroke, strokeWidth, brush; Rectangle → stroke, fill, strokeWidth, strokeStyle, cornerRadius; Ellipse → stroke, fill, strokeWidth, strokeStyle; Line → stroke, strokeWidth, strokeStyle, lineEnds; Arrow → stroke, strokeWidth, strokeStyle, lineEnds, arrowHeads, arrowPath; Text → stroke, font; every other tool → stroke, fill, strokeWidth, strokeStyle. Never `opacity`.
  - `SelectedProperties` gains optional `lineCap?: Mixed<LineCap>`, `cornerRadius?: Mixed<number>`, `startHead?: Mixed<ArrowheadType>`, `endHead?: Mixed<ArrowheadType>`, `arrowPath?: Mixed<ArrowLineStyle>` — each set only when every selected element supports it (lineCap: line/arrow, default `LineCap.Round`; cornerRadius: rectangle, default 5; heads/path: arrow; path kind from `pathType.type`: `'quadratic' | 'cubic'` → `'curve'`, `'elbow'` → `'elbow'`, else `'straight'`).
  - `function arrowPathKind(pathType: ArrowPathType | undefined): ArrowLineStyle` exported from `shape-capabilities.ts`.

- [ ] **Step 1: Write failing tests** — `sectionsForElements([Arrow])` contains arrowHeads, arrowPath, lineEnds and not fill; `([Image])` equals `{opacity}`; `([Text])` equals `{stroke, font, opacity}`; `([Arrow, Rectangle])` equals `{stroke, strokeWidth, strokeStyle, opacity}`; `([])` is empty; `sectionsForTool(ToolType.Pen)` equals `{stroke, strokeWidth, brush}`; `sectionsForTool(ToolType.Select)` has no `opacity`; merge of two arrows with different end heads → `endHead === MIXED`, same start head → that value; merge of rect(rx 0) + rect(rx 12) → `cornerRadius === MIXED`; merge of arrow + rect → `startHead` undefined; `arrowPathKind({type:'cubic',...})` → `'curve'`.
- [ ] **Step 2: Run** `npx nx test ng-whiteboard --testFile=shape-capabilities.spec.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** both utils (table as a `Record<ElementType, readonly PropertySection[]>`).
- [ ] **Step 4: Run** the two spec files → PASS; full suite, lint, `yarn build:lib`.
- [ ] **Step 5: Commit** `feat(editor): shape section capabilities and merged shape properties`.

### Task 2: `cornerRadius` config and arrow path helper

**Files:**
- Modify: `types/config.ts` (add `cornerRadius?: number` with a one-line doc comment: default corner radius for new rectangles, 5 when unset)
- Modify: `tools/rectangle-tool.ts` (pass `rx: this.whiteboardConfig.cornerRadius ?? 5` to `createElement`)
- Create: `components/editor/utils/arrow-path.ts` + `arrow-path.spec.ts`
- Modify: `tools/__tests__/rectangle-tool.test.ts`
- Modify: `projects/demo/...` api-reference table (add a `cornerRadius` row next to the existing `theme` row) and root `README.md` config list if it enumerates config fields.

**Interfaces:**
- Produces: `function toArrowPath(kind: ArrowLineStyle, arrow: Pick<ArrowElement, 'x1' | 'y1' | 'x2' | 'y2'>): ArrowPathType` per the Global Constraints formula.

- [ ] **Step 1: Failing tests** — rectangle tool with config unset creates `rx: 5`; with `cornerRadius: 0` creates `rx: 0`; `toArrowPath('curve', {x1:0,y1:0,x2:100,y2:0})` → `{type:'quadratic', cx:50, cy:20}`; `'elbow'` → `{type:'elbow', midRatio:0.5}`; `'straight'` → `{type:'straight'}`; zero-length arrow curve → control point equals the endpoint (no NaN).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib`, `yarn build:demo` → PASS.
- [ ] **Step 5: Commit** `feat(config): cornerRadius default for new rectangles` and `feat(editor): arrow path conversion helper` (one or two commits).

### Task 3: EditorStateService updates for the new properties

**Files:**
- Modify: `components/editor/editor-state.service.ts`
- Modify: `components/editor/editor-state.service.spec.ts` (or the existing editor-state spec file; keep the repo's naming)

**Interfaces:**
- Consumes: Task 1 `PropertySection`, Task 2 `toArrowPath`.
- Produces (all public on `EditorStateService`; with a selection they update only elements whose type supports the property, through `applyUpdates`; with no selection they write config):
  - `updateLineCap(cap: LineCap)` → `style.lineCap` on line/arrow | config `lineCap`
  - `updateCornerRadius(radius: number)` → `rx` (clamped 0–50, rounded) on rectangles | config `cornerRadius`
  - `updateArrowHead(end: 'start' | 'end', type: ArrowheadType)` → `startHead`/`endHead` `{ ...head, type }` | config `arrowConfig.startHeadStyle`/`endHeadStyle` (string value equals the enum value)
  - `swapArrowHeads()` → each arrow's `startHead`↔`endHead` | config start↔end styles
  - `updateArrowPath(kind: ArrowLineStyle)` → `pathType: toArrowPath(kind, arrow)` | config `arrowConfig.lineStyle`
  - `updatePenType(type: PenType)` → config `penType` only
  - `updateElementProperty` dispatcher cases: `'lineCap'`, `'cornerRadius'`, `'startHead'`, `'endHead'`, `'swapArrowHeads'`, `'arrowPath'`, `'penType'` (value types: string/number; `'swapArrowHeads'` ignores value). Config writes for `arrowConfig` replace the object (`{ ...current, [key]: value }`), never mutate.

- [ ] **Step 1: Failing tests** —
  - two arrows selected, `updateArrowHead('end', ArrowheadType.Diamond)` → both have `endHead.type === 'diamond'`, history grew by exactly 1, `undo()` restores both;
  - one locked + one unlocked arrow → only the unlocked changes, one history step;
  - arrow + rectangle selected, `updateArrowHead` → rectangle untouched;
  - `swapArrowHeads()` swaps and a single undo restores;
  - `updateArrowPath('curve')` on `{x1:0,y1:0,x2:100,y2:0}` → `pathType {quadratic, cx 50, cy 20}`; then `'straight'` → `{type:'straight'}`;
  - Review Focus 4: rectangle + arrow bound to it (create via the arrow binding service as existing arrow-binding tests do), `updateArrowPath('curve')`, move the rectangle through `ApiService`/`ElementsService` → arrow endpoint follows, no throw;
  - `updateCornerRadius(80)` on a rectangle → `rx === 50`; with no selection `updateCornerRadius(0)` → `config.cornerRadius === 0`;
  - no selection: `updateArrowHead('start', ArrowheadType.Circle)` → `config.arrowConfig.startHeadStyle === 'circle'` and other arrowConfig keys unchanged; `updateArrowPath('elbow')` → `arrowConfig.lineStyle === 'elbow'`; `updateLineCap(LineCap.Square)` → `config.lineCap === 'square'`; `updatePenType(PenType.Marker)` → `config.penType === 'marker'`;
  - `updateElementProperty('endHead', 'bar')` routes to `updateArrowHead('end', 'bar')`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** spec, full suite, lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `feat(editor): edit arrow heads, arrow path, line ends, corner radius and brush`.

### Task 4: UI primitives — segmented control and arrowhead picker

**Files:**
- Create: `components/editor/ui/segmented-control/segmented-control.component.ts` (+ `.scss`, `.spec.ts`)
- Create: `components/editor/ui/arrowhead-picker/arrowhead-picker.component.ts` (+ `.scss`, `.spec.ts`)

**Interfaces:**
- Produces:
  - `<wb-segmented-control>`: inputs `label: string` (group aria-label), `options: readonly { value: string; label: string; icon?: string }[]`, `value: string | typeof MIXED | undefined`; output `valueChange: string`. Renders `role="radiogroup"` with `role="radio"` buttons, `aria-checked`, roving tabindex, ArrowLeft/ArrowRight/Home/End move and select (and `stopPropagation` so the canvas never sees them); MIXED → no option checked, first option tabbable.
  - `<wb-arrowhead-picker>`: inputs `label: string`, `value: ArrowheadType | typeof MIXED | undefined`, `end: 'start' | 'end'` (mirrors icons for the start end); output `valueChange: ArrowheadType`. Same radiogroup behaviour over the 8 `ArrowheadType` values, each an inline 24×24 SVG icon with an aria-label ("None", "Arrow", "Open arrow", "Diamond", "Open diamond", "Circle", "Open circle", "Bar"). Rows wrap inside the panel width; no horizontal overflow at 390px.
  - Both use `--wb-*` tokens, the editor focus ring, and 44px targets under `@media (pointer: coarse)`.

- [ ] **Step 1: Failing tests** — segmented: clicking option 2 emits its value; ArrowRight from checked option emits next value and focuses it; keydown event does not propagate; MIXED → no `aria-checked="true"`; picker: renders 8 radios with the labels above; click "Diamond" emits `'diamond'`; `value='bar'` marks Bar checked.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (standalone, OnPush, signal inputs, `ViewEncapsulation.None` styles scoped under `.editor` like the other editor UI).
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `feat(editor): segmented control and arrowhead picker`.

### Task 5: Contextual properties panel

**Files:**
- Modify: `components/editor/panels/properties-panel/properties-panel.component.ts` (+ `.scss`, `.spec.ts`)
- Modify: `components/editor/whiteboard-editor.component.html` (pass `[activeTool]="selectedToolSignal()"` to both `<ng-properties-panel>` instances)

**Interfaces:**
- Consumes: Task 1 `sectionsForElements`, `sectionsForTool`, new `SelectedProperties` fields; Task 4 components; Task 3 dispatcher property names.
- Produces: panel input `activeTool = input<ToolType>(ToolType.Select)`; `sections = computed(() => hasSelection() ? sectionsForElements(types) : sectionsForTool(activeTool()))`; `show(section: PropertySection): boolean`.

Section rules: every existing section (stroke color, fill, width, dash buttons, opacity, font) is wrapped in `@if (show(...))`; the stroke color label reads "Text color" when every selected element is text (or the Text tool is active with nothing selected). New sections: Line ends (segmented → `'lineCap'`), Corner radius (slider 0–50 → `'cornerRadius'`, uses `onSliderInput` batching), Arrow heads (two pickers "Start" / "End" → `'startHead'`/`'endHead'` + a "Swap arrow heads" icon button → `'swapArrowHeads'`), Arrow path (segmented → `'arrowPath'`), Brush (segmented over `PenType` values with labels "Pen", "Marker", "Highlighter", "Brush", "Pencil" → `'penType'`, value from `config().penType`). With nothing selected, controls show config values (`config().lineCap`, `config().cornerRadius ?? 5`, `arrowConfig` styles, `arrowConfig.lineStyle`). Actions, alignment and layer controls keep their current visibility.

- [ ] **Step 1: Failing tests** (render the panel with elements built via `createElement`) —
  - arrow selected → Arrow heads, Arrow path, Line ends rendered; no fill picker; no Corner radius;
  - image selected → only opacity among property sections;
  - text selected → label "Text color", font controls, no stroke width, no dash buttons;
  - Review Focus 1: arrow + rectangle → stroke, width, dash, opacity only; through the real `EditorStateService` a width change updates both, one undo step (or cover this in the editor-level spec if the panel spec uses a mock);
  - Review Focus 3: set selection to an arrow, then to an image → arrow sections gone;
  - nothing selected + `activeTool=Pen` → Brush shown, opacity hidden; `activeTool=Rectangle` → Corner radius shown with value 5;
  - choosing "Curved" emits `propertyChange {property:'arrowPath', value:'curve'}`; end picker "Bar" emits `{property:'endHead', value:'bar'}`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Replace `hasTextSelection` usage with `show('font')`; remove helpers made dead by this.
- [ ] **Step 4: Run** specs, full suite (incl. `editor-*.spec.ts`), lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `feat(editor): contextual properties panel per shape`.

### Task 6: Layout verification and docs

**Files:**
- Modify only if the driver finds a problem: the Task 4/5 `.scss` files, `components/editor/whiteboard-editor.component.scss`.
- Modify: root `README.md` Built-in Editor section (one sentence: the panel adapts to the selected shape; mention `cornerRadius`), then rebuild so `projects/ng-whiteboard/README.md` is regenerated by `build:lib` and commit it if changed.

- [ ] **Step 1:** Ensure the demo dev server runs at http://localhost:4200 (`yarn start` in the background if down). Extend the scratchpad driver (`C:\Users\MOSTAF~1\AppData\Local\Temp\claude\C--mostafa-front-end-ng-whiteboard\66912f27-7792-4ff2-8d47-04d35cc9a4e3\scratchpad\driver\shoot.js`) to draw an arrow, select it, open the properties panel/sheet and screenshot at all four viewports (light and dark); report any element whose bounding box exceeds the panel/sheet width or any coarse target under 44px.
- [ ] **Step 2:** Read the PNGs. Fix overflow/target issues found (Review Focus 5); re-run until clean. Mid-animation 1px sheet readings are a known artifact — re-measure after the transition ends.
- [ ] **Step 3:** README sentence; `yarn build:lib`, `yarn build:demo`, full lib + demo suites, lint.
- [ ] **Step 4: Commit** `docs(readme): contextual properties panel` (+ `fix(editor): ...` for any layout fix).
