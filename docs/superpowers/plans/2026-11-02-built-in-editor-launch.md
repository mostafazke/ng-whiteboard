# Built-in Editor Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing `feat/editor` built-in editor launchable: opt-in via `showEditor`, responsive from 320px phones to desktop, touch-friendly with pinch/pan, every control wired and undoable, no change for canvas-only consumers.

**Architecture:** The editor stays a child of `<ng-whiteboard>` using the per-instance services. Pure logic (theme color swap, alignment math, multi-select merge, two-pointer gesture math) is extracted into small pure modules with unit tests; components only wire them. Layout uses CSS container queries on the editor root so it adapts to the box it's embedded in.

**Tech Stack:** Angular 20.3 standalone + signals + OnPush, SCSS, Jest (jest-preset-angular), Nx.

**Spec:** `docs/superpowers/specs/2026-11-02-built-in-editor-launch-design.md`

## Global Constraints

- No new runtime dependencies. Icons stay inline SVG in `core/components/editor/icon/icons.ts`.
- When `showEditor` is false and `theme` is not `'dark'`, canvas rendering and behavior must equal master.
- No breaking public API changes (minor release from 5.6.0). `EditorConfig` stays exported.
- Breakpoints from the editor container: wide ≥ 1024px; medium 640–1023px; compact when width < 640px **or** height < 500px.
- Touch targets ≥ 44×44px under `@media (pointer: coarse)`.
- Nothing in the editor may extend outside the editor container at any size ≥ 320×320.
- No `console.log`/`console.debug` in editor code; zero console warnings from the editor on load.
- Match existing style: `inject()`, signals, `input()`, OnPush, comments sparingly.
- Run tests with `npx nx test ng-whiteboard --watch=false` (baseline: 72 suites, 2446 passing). Single file: `npx nx test ng-whiteboard --watch=false --testFile=<path>`.
- Commit after each task with conventional commits, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

All paths below are relative to `projects/ng-whiteboard/src/lib/` unless they start with `projects/` or `docs/`.

## Review Focus

1. A second finger lands mid-stroke (pen/rect draft in progress) → the draft vanishes, no element is committed, no history entry; lifting one finger then the other doesn't start a new stroke. (Task 6 test `cancels draft when second pointer goes down`.)
2. Alignment with a locked element or element on a locked layer in the selection → locked ones stay put, others align, one undo restores all. (Task 4 test `skips locked elements and is one undo step`.)
3. Consumer sets `backgroundColor: '#ffffff'` then switches `theme` to dark → their background is kept. (Task 1 test `preserves consumer colors on theme change`.)
4. Importing a file exported by 5.6.0 (full ~70-flag `editor` block, no `settings.theme`) → loads without error, theme unchanged, title restored. (Task 2 test `imports legacy editor block`.)
5. Two boards on one page, typing in an `<input>` elsewhere on the page → no editor shortcut fires on either board. (Task 3 test `ignores shortcut from editable target`.)

---

### Task 1: Theme is opt-in; light/unset renders like master

**Files:**
- Create: `core/config/theme-colors.ts`, `core/config/theme-colors.spec.ts`
- Modify: `core/config/config.service.ts` (default config, `withThemeColors` → use new helper)
- Modify: `core/components/canvas/whiteboard-canvas.component.ts` (`data-theme` binding), `.scss` (remove light block)
- Modify: `core/input/io.service.ts` (export `settings.theme` only when set)
- Test: `core/config/config.service.spec.ts`, `core/input/io.service.spec.ts`, `core/components/canvas/whiteboard-canvas.component.spec.ts`

**Interfaces:**
- Produces: `export const THEME_DEFAULT_COLORS: Record<'light'|'dark', { backgroundColor: string; strokeColor: string }>` (light `#F8F9FA`/`#333333`, dark `#1a1a1a`/`#e5e7eb`); `export function applyThemeColors(prev: WhiteboardConfig, next: WhiteboardConfig): WhiteboardConfig`.

- [ ] **Step 1: Write failing tests** in `theme-colors.spec.ts`:
  - `swaps defaults light→dark`: prev `{theme: undefined, backgroundColor:'#F8F9FA', strokeColor:'#333333'}`, next same with `theme:'dark'` → `#1a1a1a`/`#e5e7eb`.
  - `swaps defaults dark→light` (reverse).
  - `preserves consumer colors on theme change`: prev bg `#ffffff`, next `theme:'dark'` → bg stays `#ffffff`; stroke `#ff0000` stays.
  - `swaps only stroke when only stroke is default`: bg custom, stroke `#333333` → stroke becomes `#e5e7eb`, bg unchanged.
  - `no-op when theme unchanged` (returns `next` by reference).
  - In `config.service.spec.ts`: `default config has no theme` → `getConfig().theme` is `undefined`.
  - In `whiteboard-canvas.component.spec.ts`: host has no `data-theme` attribute by default; `data-theme="dark"` after `updateConfig({theme:'dark'})`.
  - In `io.service.spec.ts`: exported JSON `settings` has no `theme` key by default; has `theme:'dark'` when set.
- [ ] **Step 2: Run** the four spec files → new tests FAIL.
- [ ] **Step 3: Implement.** `applyThemeColors` treats `undefined` theme as `'light'` for comparison, so unset→`'light'` is a no-op and unset→`'dark'` swaps; swap bg and stroke independently (each only if it equals the previous theme's default). Remove `theme: 'light'` from ConfigService defaults. Canvas: `@HostBinding('attr.data-theme')` returns `this.config().theme ?? null`. SCSS: delete the `&[data-theme='light']` block and the four `--canvas-*` light vars it uses; keep the dark block. IO: spread `...(canvasConfig.theme ? { theme: canvasConfig.theme } : {})`.
- [ ] **Step 4: Run** full lib suite → all PASS.
- [ ] **Step 5: Commit** `fix(theme): make theme opt-in so default rendering matches master`.

---

### Task 2: Deprecate unused `EditorConfig` flags; single theme source

**Files:**
- Modify: `core/types/config.ts` (`EditorConfig`)
- Modify: `core/config/config.service.ts` (editor defaults)
- Modify: `core/input/io.service.ts` (export/import `editor` block)
- Modify: `core/components/editor/editor-state.service.ts` (remove theme sync effect, `layersSignal` legacy mapping stays)
- Test: `core/input/io.service.spec.ts`, `core/config/config.service.spec.ts`

**Interfaces:**
- Produces: `EditorConfig` = `{ title: string; /** @deprecated use WhiteboardConfig.theme */ theme?: 'light'|'dark'; /** @deprecated unused; removed in next major */ enableEditor?: boolean; ...every other show* flag optional with the same @deprecated tag }`. `ConfigService` editor default is `{ title: 'Whiteboard' }`.
- `EditorStateService.themeSignal` = `computed(() => config().theme ?? 'light')` (unchanged name; Task 7 uses it).

- [ ] **Step 1: Write failing tests** in `io.service.spec.ts`:
  - `exports only title in editor block`: export → `editor` deep-equals `{ title: 'Whiteboard' }`.
  - `imports legacy editor block`: import a fixture with `editor: { title:'Old', showBlog:false, showWebinars:true, theme:'dark', enableEditor:true }` and `settings` without `theme` → no throw, `getEditorConfig().title === 'Old'`, `getConfig().theme` unchanged (`undefined`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Import copies only `title` from `data.editor`; ignores the rest. Delete the constructor `effect` and `toggleTheme`'s editor write in `EditorStateService`; `toggleTheme` writes only `WhiteboardConfig.theme`.
- [ ] **Step 4: Run** full lib suite + `npx nx run ng-whiteboard:lint` → PASS.
- [ ] **Step 5: Commit** `refactor(editor): deprecate unused EditorConfig flags`.

---

### Task 3: Cleanup — logs, warnings, dead menu, layer opacity, board-scoped shortcut

**Files:**
- Modify: `core/components/editor/editor-state.service.ts`, `whiteboard-editor.component.ts`, `panels/layer-panel/layer-panel.component.ts`, `ui/color-picker/color-picker.component.ts` (remove all `console.*`, remove `updateLayersFromElements`)
- Modify: `core/tools/tools.service.ts:161,171` (drop `{ allowSignalWrites: true }`)
- Modify: `core/components/editor/panels/toolbar/toolbar.component.ts` + `.scss` (delete `more-tools` button, `extended-tools`, `extendedSections`, `showExtended` input, `extendedToggle` output); `whiteboard-editor.component.html/.ts` (remove `showExtendedToolsSignal`, `toggleExtendedTools`)
- Modify: `whiteboard-editor.component.ts` (`onLayerPanelOpacityChanged` must not divide again — layer panel already emits 0–1)
- Modify: `core/svg/svg.service.ts` (expose board-scoped keydown), `whiteboard-editor.component.ts` (replace `@HostListener('window:keydown')`)
- Create: `core/utils/dom/is-editable-target.ts` (+ spec)
- Test: `whiteboard-editor.component.spec.ts`, `panels/layer-panel/layer-panel.component.spec.ts` (create)

**Interfaces:**
- Produces: `export function isEditableTarget(target: EventTarget | null): boolean` (true for `input`, `textarea`, `select`, `[contenteditable]` and descendants). `SvgService.keyDown$: Observable<KeyboardEvent>` — emits every event `SvgService.onKeyDown` receives (already filtered to the active board by `GlobalKeyboardDirective`).
- Panel toggle shortcut becomes **Alt+P** (plain `P` is the library's Pen shortcut — today both fire).

- [ ] **Step 1: Write failing tests:**
  - `isEditableTarget`: true for `<input>`, `<textarea>`, `<div contenteditable>` and a `<span>` inside it; false for `<div>`, `null`.
  - editor spec `toggles panel on Alt+P from board keydown`: emit `new KeyboardEvent('keydown',{key:'p',altKey:true})` through `SvgService.keyDown$` → `isPanelOpenSignal()` flips.
  - editor spec `ignores shortcut from editable target`: same event dispatched with target an `<input>` → no flip. And `window.dispatchEvent` of Alt+P (not via SvgService) → no flip.
  - layer panel spec `layer opacity shows 100% for opacity 1` and editor spec `slider 50 sets layer opacity 0.5` (spy `LayerManagementService.setLayerOpacity` called with `(id, 0.5)`).
  - editor spec `toolbar has no more-tools button`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** as listed in Files. `keyDown$` is a private `Subject` + `asObservable()`, `next(event)` at the top of `onKeyDown`; editor subscribes with `takeUntilDestroyed()`.
- [ ] **Step 4: Verify** full suite PASS, and `grep -rn "console\.\(log\|debug\)" projects/ng-whiteboard/src/lib/core/components/editor` → no output; `grep -rn allowSignalWrites projects/ng-whiteboard/src` → no output.
- [ ] **Step 5: Commit** `fix(editor): remove debug output, dead menu and fix layer opacity and shortcut scope`.

---

### Task 4: Alignment & distribute actually apply

**Files:**
- Create: `core/components/editor/utils/alignment.ts`, `alignment.spec.ts`
- Modify: `core/components/editor/editor-state.service.ts` (replace `alignElements`, delete `distributeElementsHorizontally/Vertically`)
- Test: `core/components/editor/editor-state.service.spec.ts` (create)

**Interfaces:**
- Consumes: `getElementBounds(element): Bounds` from `core/utils/dom/element.ts`; `ElementsService.updateElements(updates)` (records one history step).
- Produces: `export function computeAlignmentUpdates(elements: WhiteboardElement[], alignment: AlignmentType): { id: string; x: number; y: number }[]` — moves by delta from bounds: `x = element.x + (targetLeft - bounds.minX)`, same for y. Returns `[]` for < 2 elements, or < 3 for distribute.

- [ ] **Step 1: Write failing tests** (`alignment.spec.ts`) using real rectangles A `{x:0,y:0,w:10,h:10}`, B `{x:50,y:20,w:20,h:40}`, C `{x:100,y:5,w:10,h:10}`:
  - `align-left` → all bounds minX = 0.
  - `align-right` → all bounds maxX = 110.
  - `align-center` → all bounds centerX equal (= mean of centers, 56.67 ± 0.01).
  - `align-top`/`align-middle`/`align-bottom` analogous on Y.
  - `distribute-horizontal` → A and C unchanged; gap A.maxX→B.minX equals B.maxX→C.minX.
  - `distribute-vertical` analogous.
  - `ellipse and text use real bounds` (an ellipse and a text element align-left to the same minX as a rect).
  - `returns [] for one element`; `distribute returns [] for two`.
  - `editor-state.service.spec.ts`: `skips locked elements and is one undo step` — select A, B(locked), C; align-left; A and C moved, B not; `HistoryService.undo()` once restores A and C.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `computeAlignmentUpdates`; `alignElements` calls it and `elementsService.updateElements(updates)` once.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `fix(editor): apply alignment and distribute using real element bounds`.

---

### Task 5: Multi-select properties panel

**Files:**
- Create: `core/components/editor/utils/selected-properties.ts`, `.spec.ts`
- Modify: `editor-state.service.ts` (`selectedPropertiesSignal`, `updateElementProperty` → one `updateElements` call for all selected)
- Modify: `panels/properties-panel/properties-panel.component.ts/.scss` (mixed display); `ui/color-picker/color-picker.component.ts` (accept `MIXED`)
- Test: `editor-state.service.spec.ts`, `panels/properties-panel/properties-panel.component.spec.ts` (create)

**Interfaces:**
- Produces: `export const MIXED = Symbol('mixed'); export type Mixed<T> = T | typeof MIXED;` and `export interface SelectedProperties { strokeColor: Mixed<string>; fillColor: Mixed<string>; strokeWidth: Mixed<number>; dasharray: Mixed<string>; opacity: Mixed<number>; fontSize?: Mixed<number>; fontFamily?: Mixed<string> }`; `export function mergeSelectedProperties(elements: WhiteboardElement[]): SelectedProperties | null` (null for empty; font fields present only if every element is text). Fix the existing `element.opacity || 100` bug: opacity default is the element's actual default (check `ElementOpacityPipe` for the unit) — do not invent one.

- [ ] **Step 1: Write failing tests:**
  - `same values pass through` (two rects stroke `#000`, width 2).
  - `differing values are MIXED` (stroke `#000` vs `#f00` → `MIXED`; width same → 2).
  - `font fields only when all text`.
  - `null for empty`.
  - editor-state `stroke width edit applies to all selected in one undo step`.
  - properties-panel `shows mixed swatch when stroke is MIXED` (color picker host has class `mixed`, slider shows no numeric value label `—`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Mixed swatch: diagonal-split swatch with `aria-label="Mixed"`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(editor): edit properties of multiple selected elements`.

---

### Task 6: Pinch-to-zoom and two-finger pan (core canvas)

**Files:**
- Create: `core/svg/gesture-tracker.ts`, `gesture-tracker.spec.ts`
- Modify: `core/svg/svg.directive.ts` (route pointers through tracker)
- Modify: `core/svg/svg.service.ts` (add `cancelInteraction()`)
- Modify: `core/viewport/zoom.service.ts` (add `zoomAtPoint`)
- Test: `core/svg/svg.directive.spec.ts`, `core/viewport/zoom.service.spec.ts`

**Interfaces:**
- Produces:
  - `class GestureTracker { down(id: number, x: number, y: number): 'start-gesture' | 'single' | 'ignore'; move(id: number, x: number, y: number): { scale: number; dx: number; dy: number; centerX: number; centerY: number } | null; up(id: number): 'end-gesture' | 'single' | 'ignore'; get isGesturing(): boolean }` — `scale` is current/previous finger distance, `dx/dy` the midpoint delta since last move. After a gesture, remaining pointers return `'ignore'` until all are up.
  - `ZoomService.zoomAtPoint(zoom: number, screenX: number, screenY: number): void` — instant (no animation), clamps via `clampZoom`, keeps the canvas point under (screenX, screenY) fixed: `newX = screenX - (screenX - x) * newZoom / oldZoom` (same for y), one `configService.updateConfig({ zoom, x, y })`. Coordinates are relative to the SVG (same as `PointerInfo.x/y`).
  - `SvgService.cancelInteraction(): void` — ends any selection gesture, calls `elementsService.clearDraftElements()`, resets the active tool's in-progress state via `tool.deactivate(); tool.activate()`; records no history.

- [ ] **Step 1: Write failing tests:**
  - tracker: `single pointer is single`; `second pointer starts gesture`; `pinch apart scale > 1` (fingers 100px → 200px apart → scale 2); `two-finger drag gives dx/dy` (both move +10,+5 → dx 10, dy 5, scale 1); `remaining pointer ignored after gesture until all up`.
  - zoom: `zoomAtPoint keeps point fixed` — config `{zoom:1,x:0,y:0}`, `zoomAtPoint(2, 100, 100)` → `{zoom:2,x:-100,y:-100}`; `zoomAtPoint clamps` to `getZoomLimits().max`.
  - directive: `cancels draft when second pointer goes down` — pen tool, pointerdown id1, move, pointerdown id2 → `getDraftElements()` empty, `getElements()` unchanged, history `canUndo` unchanged; then up id1, up id2, move → no new draft.
  - directive: `mouse input unaffected` — single mouse pointer still calls `svgService.onPointerDown/Move/Up` exactly as before (existing directive tests must stay green).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Directive: on `'start-gesture'` call `svgService.cancelInteraction()`; on gesture moves call `zoomService.zoomAtPoint(zoom*scale, centerX, centerY)` then `panService.pan(dx, dy)`; skip `svgService` pointer calls while gesturing or `'ignore'`. Inject `ZoomService`, `PanService` in the directive. Confirm `touch-action: none` on the svg remains.
- [ ] **Step 4: Run** full suite → PASS.
- [ ] **Step 5: Commit** `feat(canvas): pinch-to-zoom and two-finger pan`.

---

### Task 7: Responsive layout, bottom sheet, touch targets

**Files:**
- Create: `core/components/editor/ui/bottom-sheet/bottom-sheet.component.ts/.scss/.spec.ts`
- Create: `core/components/editor/editor-layout.ts` (+ spec)
- Modify: `whiteboard-editor.component.html/.scss/.ts`; every panel `.scss` (header, toolbar, controls, history, properties, layer); `header-panel.component.ts` (compact menu, theme icon toggle)
- Test: specs above + `whiteboard-editor.component.spec.ts`

**Interfaces:**
- Produces:
  - `export type EditorLayout = 'wide' | 'medium' | 'compact'; export function layoutFor(width: number, height: number): EditorLayout` (compact if `width < 640 || height < 500`, wide if `width >= 1024`, else medium).
  - `WhiteboardEditorComponent.layout: Signal<EditorLayout>` from a `ResizeObserver` on the editor root (disconnect on destroy). Root gets `[attr.data-layout]`. SCSS uses `container-type: size` on `.editor` and `@container` queries with the same thresholds; the signal is for template branching (sheet vs panel).
  - `<ng-bottom-sheet [open]="boolean" (closed)="..." [label]="string">` — content-projected; slides from bottom; max-height 70% of container; internal scroll; closes on backdrop tap, Escape, or downward swipe > 80px on the handle; focus moves into it on open and returns to the opener on close.
- Compact layout (builder chooses exact placement within these rules): header icons only, New/Save/Export/theme inside a header menu that opens as a bottom sheet; toolbar full-width bottom, `overflow-x: auto`, scroll-snap; undo/redo + zoom on one row above the toolbar; properties panel rendered inside `ng-bottom-sheet`, closed by default, opened only by a toolbar/header "Properties" button that gets an `.has-selection` dot when something is selected; zoom menu and layers popover render inside `ng-bottom-sheet`.
- Medium: properties panel `max-height: calc(100cqh - <header+toolbar>)`, `overflow-y: auto`; header labels hidden via container query when they don't fit.
- All sizes: `@media (pointer: coarse)` → editor buttons min 44×44 (padding/`::after` hit area allowed); `padding: env(safe-area-inset-*)` on edge-anchored bars; header "Dark Mode" text → sun/moon icon button, `aria-label="Switch to dark mode"`/`"Switch to light mode"`.

- [ ] **Step 1: Write failing tests:** `layoutFor` table (`(390,844)→compact`, `(844,390)→compact`, `(820,1180)→medium`, `(1440,900)→wide`, `(1024,500)→wide`, `(639,900)→compact`); bottom-sheet `closes on Escape`, `closes on backdrop click`, `focuses first focusable on open`, `Tab from last focusable wraps to first` (focus trap); editor `compact layout renders properties inside bottom sheet closed by default`, `selection does not open sheet` (set layout compact, select element → sheet still closed, button has `.has-selection`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** component + SCSS per rules above.
- [ ] **Step 4: Run** full suite → PASS.
- [ ] **Step 5: Visual verification.** `yarn start`, then run the Playwright check at the four viewports — reuse the script from the brainstorming session (`C:\Users\MOSTAF~1\AppData\Local\Temp\claude\C--mostafa-front-end-ng-whiteboard\66912f27-7792-4ff2-8d47-04d35cc9a4e3\scratchpad\driver\shoot.js`, needs `playwright-core` installed beside it and local Chrome; if unavailable, copy its approach: pin the minimal example fullscreen via injected CSS, drive with mouse and CDP touch). Pass criteria per viewport (1440×900, 820×1180, 844×390, 390×844): no visible editor button outside the viewport; on touch contexts every visible button ≥ 44×44; rectangle can be drawn and selected by touch; zoom menu, layers and properties open fully on-screen; screenshots inspected by eye show no overlaps.
- [ ] **Step 6: Commit** `feat(editor): responsive layout with bottom sheets and touch targets`.

---

### Task 8: Accessibility basics

**Files:**
- Modify: `panels/toolbar/toolbar.component.ts`, `panels/controls-panel`, `panels/history-panel`, `panels/header-panel`, `panels/properties-panel`, `ui/color-picker`, `ui/alignment-controls`, `panels/layer-panel` templates; editor `.scss` (focus ring)
- Test: `panels/toolbar/toolbar.component.spec.ts` (create), `whiteboard-editor.component.spec.ts`

**Interfaces:** none new. Toolbar: `role="toolbar"`, `aria-label="Tools"`, roving `tabindex` (active tool `0`, others `-1`), ArrowLeft/ArrowRight/Home/End move focus; tool buttons `aria-pressed`. Popovers/menus (zoom, layers): close on Escape and return focus to their trigger.

- [ ] **Step 1: Write failing tests:** `every editor button has an accessible name` (each `button` in a rendered editor has non-empty `aria-label` or text); toolbar `ArrowRight moves focus to next tool`, `End focuses last tool`, `active tool has aria-pressed=true`; `Escape closes zoom menu and focuses its trigger`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Focus ring: `:focus-visible { outline: 2px solid var(--editor-accent); outline-offset: 2px }`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(editor): keyboard navigation and accessible labels`.

---

### Task 9: showEditor contract, docs, final verification

**Files:**
- Test: `projects/ng-whiteboard/src/lib/ng-whiteboard.component.spec.ts`
- Modify: `README.md` (new "🧰 Built-in Editor" section after "🚀 Usage": `showEditor`, `theme`, phone behavior, Alt+P), the demo documentation page that lists inputs/config (find via `grep -rln "selectedTool" projects/demo/src/app/documentation`), `projects/ng-whiteboard/README.md` if it mirrors the root README.

- [ ] **Step 1: Write tests:** `does not render editor by default` (no `ng-whiteboard-editor` element); `renders editor when showEditor is true`; `toggling showEditor at runtime adds/removes editor`.
- [ ] **Step 2: Run** → PASS (or fix if failing).
- [ ] **Step 3: Write docs.**
- [ ] **Step 4: Full verification:** `npx nx test ng-whiteboard --watch=false` (all pass, coverage thresholds met), `npx nx run ng-whiteboard:lint`, `npx nx run demo:lint`, `yarn build:lib`, `yarn build:demo` — all succeed. Rerun the Task 7 four-viewport check; in addition load `/examples` and confirm zero console errors/warnings, and that the "Basic Example" board (no `showEditor`) shows the gray grid/dodgerblue selection as on master.
- [ ] **Step 5: Commit** `docs(editor): document built-in editor`.
