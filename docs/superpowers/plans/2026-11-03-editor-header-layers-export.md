# Editor Header, Layers and Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the editor's header text buttons with an Excalidraw-style main menu, add an export dialog with cropped/scaled output, rebuild the layers panel Figma-style, and fix the layer and export bugs underneath (orphan elements, wrong counts, no layer undo, uncropped 1× export, dirty SVG).

**Architecture:** Core first, UI second. Tasks 1–5 fix and extend library services (layer membership helper, history snapshots that include layers, undoable layer/board operations in `ApiService`, an export engine in `IOService`) — these also benefit canvas-only consumers. Tasks 6–8 rebuild the editor UI on top (header + main menu + confirm dialog, export dialog, layers panel). Task 9 is docs and the four-viewport check.

**Tech Stack:** Angular 20.3 standalone + signals + OnPush, Jest (jest-preset-angular), Nx, ng-packagr.

**Spec:** `docs/superpowers/specs/2026-11-03-editor-header-layers-export-design.md`

All paths below are relative to `projects/ng-whiteboard/src/lib/core/` unless they start with `projects/`, `docs/` or `README`.

## Global Constraints

- No new runtime dependencies; no Angular CDK. Icons are inline SVG added to `components/editor/icon/icons.ts`.
- `--wb-*` tokens only (light/dark); 44px targets under `@media (pointer: coarse)`; keyboard reachable; focus-trapped dialogs/sheets close on Escape and return focus to their opener.
- Multi-instance safe: no listener may act on another board; editor shortcuts are scoped to the focused board like Alt+P (`targetsAnotherBoard`).
- Public method signatures stay compatible. Additions only: optional `ExportOptions` third argument on `save`, new `copyToClipboard`, new layer/board methods listed per task.
- Export defaults: API scale `1`, padding `16`, background `true`, onlySelected `false`. Dialog defaults: format PNG, scale `2`, background on, onlySelected on when a selection exists.
- Layer membership source of truth is `element.layerId`; missing or unknown `layerId` → the bottom layer (lowest `zIndex`), applied at read time; element data is never rewritten for this.
- Title default stays `'Whiteboard'`. Reset restores the title the host passed on first render.
- Copy: menu items "Open…", "Save to file", "Export image…", "Copy as PNG", "Dark mode"/"Light mode", "Reset canvas…"; confirm texts "Reset the canvas? This clears the board.", "Replace the current board?", "Delete layer and its N elements?" (N = count; "element" when 1) with buttons "Delete" and "Move elements to <layer name> and delete".
- Shortcuts (editor only, focused board): Ctrl/Cmd+O open, Ctrl/Cmd+S save, Ctrl/Cmd+Shift+E export dialog, Ctrl/Cmd+Shift+C copy as PNG; each `preventDefault()`s.
- User CLAUDE.md: comments sparingly, only for complex code. Conventional commits.
- Every task verifies with its spec files, the full lib suite (`npx nx test ng-whiteboard --watch=false`), `npx nx run ng-whiteboard:lint` (0 errors) and `yarn build:lib`. UI tasks (6–8) also run the four-viewport driver check described in Task 9 Step 1 on their own surface.

## Review Focus

1. A rotated element touching the board edge exports fully (not clipped) with 16px padding. → Task 5 test.
2. A hidden layer's elements are excluded from export, including from "only selected" when the selection contains them. → Task 5 test.
3. Open a file, undo, redo: the board is exactly the opened one again (elements and layers), no ghost layers. → Task 4 test.
4. Two boards on one page: Ctrl+S with board A focused downloads only board A's file. → Task 6 test.
5. Dragging a layer's opacity slider is one undo step; Escape during layer rename keeps the old name. → Task 3 and Task 8 tests.

---

### Task 1: Layer membership helper and bottom-layer rule

**Files:**
- Create: `utils/layers/layer-membership.ts`, `utils/layers/layer-membership.spec.ts`, `utils/layers/index.ts` (export from `utils/index.ts` if it barrels)
- Modify: `components/canvas/whiteboard-canvas.component.ts` (visibility filter + `isLocked`/`blendMode` lookup), `pipes/element-opacity.pipe.ts`, `elements/elements.service.ts` (lock checks near lines 253 and 304), `elements/layer-management.service.ts` (`exportLayerState` fills `elements` from membership; `getElementLayer`), `components/editor/editor-state.service.ts` (`isLockedByLayer` near line 146, `layersSignal` element ids), `input/io.service.ts` (`exportData` layer state)

**Interfaces:**
- Produces:
  - `effectiveLayerId(element: Pick<WhiteboardElement, 'layerId'>, layers: readonly WhiteboardLayer[]): string | undefined` — `element.layerId` if it names an existing layer, else the id of the layer with the lowest `zIndex`; `undefined` only when `layers` is empty.
  - `elementIdsByLayer(elements: readonly WhiteboardElement[], layers: readonly WhiteboardLayer[]): Map<string, string[]>` — every layer id present as a key (empty array when no elements).
  - `LayerManagementService.layersWithMembership(elements: readonly WhiteboardElement[]): WhiteboardLayer[]` — layers with `elements` derived via `elementIdsByLayer`.

- [ ] **Step 1: Failing tests** — `layer-membership.spec.ts`: element with `layerId: 'b'` and layers `[a(z0), b(z1)]` → `'b'`; no `layerId` → `'a'`; `layerId: 'gone'` → `'a'`; empty layers → `undefined`; `elementIdsByLayer` of 3 elements (one `'b'`, one none, one `'gone'`) → `a: [none, gone]`, `b: [b]`. Canvas spec: layers `[a visible, b hidden(lowest z)]` and an element with no `layerId` → not rendered (it belongs to the hidden bottom layer). Elements service spec: element with unknown `layerId` while the bottom layer is locked → `updateElements` skips it. Editor-state spec: `layersSignal()` for a board loaded via `setElements` with 6 elements without `layerId` → default layer `elements.length === 6`.
- [ ] **Step 2: Run** `npx nx test ng-whiteboard --testFile=layer-membership.spec.ts` → FAIL (module missing); the other new tests FAIL.
- [ ] **Step 3: Implement** the helpers and replace every direct `el.layerId` / `layer.elements` membership read in the files above with them.
- [ ] **Step 4: Run** the touched specs, full suite, lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `fix(layers): derive layer membership from element layerId`.

### Task 2: History entries that include layers

**Files:**
- Modify: `history/history.service.ts`, `history/history.service.spec.ts`, `api/api.service.ts` (`undo`/`redo` near lines 418–435), `api/api.service.spec.ts` (or the existing api spec)

**Interfaces:**
- Produces:
  - `export interface BoardSnapshot { elements: WhiteboardElement[]; layers?: LayerState }` in `history/history.service.ts` (re-exported from `history/index.ts`).
  - `HistoryEntry` gains optional `layersBefore?: LayerState; layersAfter?: LayerState`.
  - `HistoryService.recordBoardChange(before: BoardSnapshot, after: BoardSnapshot, description: string): void` — records when elements or layers differ; deep-clones both.
  - `HistoryService.undoSnapshot(): BoardSnapshot | null` and `redoSnapshot(): BoardSnapshot | null` — `layers` set only for entries that carry it. Existing `undo()`/`redo()` stay and return `.elements`.
  - `startBatch(description, beforeSnapshot, layersBefore?: LayerState)` and `BatchHandle.execute(after?, layersAfter?: LayerState)` — optional layer parts so a slider drag on a layer is one step.
  - `ApiService.undo()/redo()` apply `layers` via `LayerManagementService.importLayerState` before `setElements` when present.

- [ ] **Step 1: Failing tests** — `recordBoardChange` with equal elements but different layer names → `canUndo` true; `undoSnapshot()` returns `layers` equal to `before.layers`; element-only `recordChange` entry → `undoSnapshot().layers` undefined; batch with `layersBefore` and `execute(undefined, layersAfter)` → one entry with both; ApiService: rename a layer through `recordBoardChange` then `undo()` → `layers()` has the old name and elements unchanged.
- [ ] **Step 2: Run** `npx nx test ng-whiteboard --testFile=history.service.spec.ts` → FAIL.
- [ ] **Step 3: Implement.** `snapshotsEqual` also compares layer states when either side has one.
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `feat(history): record layer state alongside elements`.

### Task 3: Undoable layer operations

**Files:**
- Modify: `api/api.service.ts`, `elements/layer-management.service.ts` (+ specs), `components/editor/editor-state.service.ts` (layer methods near lines 690–800 delegate to `ApiService` instead of `LayerManagementService`), `ng-whiteboard.service.ts` (expose new methods)

**Interfaces:**
- Consumes: Task 1 `elementIdsByLayer`, `effectiveLayerId`; Task 2 `recordBoardChange`, layer-aware batches.
- Produces (on `ApiService` and `NgWhiteboardService`; each records exactly one history step via a private `withLayerHistory(description, mutate)` helper that snapshots elements+layers before/after):
  - existing `addLayer`, `renameLayer`, `toggleLayerVisibility`, `toggleLayerLock`, `setLayerOpacity`, `setLayerBlendMode`, `moveLayerUp`, `moveLayerDown`, `reorderLayersByIndex`, `duplicateLayer` → now undoable, same signatures.
  - `removeLayer(id: string, mode: 'delete-elements' | 'move-elements' = 'delete-elements'): boolean` — `'move-elements'` moves members to the layer directly below (or above if none below), ignoring that layer's lock; `'delete-elements'` removes members. Never leaves elements whose `layerId` points to the removed layer. Last layer → `false`, no history.
  - `mergeLayerDown(id: string): boolean` — moves members into the layer directly below (ignoring lock), removes `id`, keeps the lower layer's name/opacity/blend; no layer below → `false`.
  - `beginLayerOpacityEdit(id: string): void` / `endLayerOpacityEdit(): void` — wrap a slider drag in one batch (mirrors `beginEdit/endEdit` on elements).
  - `LayerManagementService.moveElementsToLayer(elementIds, layerId)` is not needed: element moves go through `ElementsService.moveToLayer(ids, layerId, true)`.

- [ ] **Step 1: Failing tests** (ApiService spec) — each existing layer op: one history step, `undo()` restores; `removeLayer(b, 'delete-elements')` with 2 elements → elements gone, `undo()` restores layer **and** both elements in one step; `removeLayer(b, 'move-elements')` → elements now on the layer below, none orphaned; move into a locked layer below succeeds; `mergeLayerDown(top)` keeps lower layer's name/opacity; `mergeLayerDown(bottom)` → `false`; opacity: `beginLayerOpacityEdit`, three `setLayerOpacity` calls, `endLayerOpacityEdit` → exactly one step (Review Focus 5); removing the only layer → `false`, `canUndo` unchanged.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** specs (incl. existing layer-management and editor-state specs), full suite, lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `feat(layers): undoable layer operations, merge down and safe delete`.

### Task 4: Whole-board operations: Open and Reset as single steps

**Files:**
- Modify: `input/io.service.ts` (`importData` near line 262) + spec, `api/api.service.ts` + spec, `layer-management.service.ts` (`reset()` returns to one default layer), `ng-whiteboard.service.ts`

**Interfaces:**
- Consumes: Task 2 `recordBoardChange`.
- Produces:
  - `IOService.importData(json)` records one `recordBoardChange(before, after, 'Open board')` and no "Clear whiteboard" step; signature unchanged.
  - `ApiService.resetBoard(): void` (+ `NgWhiteboardService.resetBoard()`) — clears elements, resets layers to one default layer, one history step `'Reset canvas'`. Title and viewport are not touched here (the editor does that, Task 6).
  - `ApiService.hasContent(): boolean` — any persistent element exists.

- [ ] **Step 1: Failing tests** — `importData` on a board with 3 elements and 2 layers → exactly one new undo step; `undo()` → old 3 elements and 2 layers; `redo()` → opened board's elements and layers exactly (Review Focus 3); importing a file without `layers` → one default layer, elements visible; `resetBoard()` → 0 elements, 1 layer, one step, `undo()` restores elements and layers.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Do the import inside a history batch or snapshot before/after manually; `elementsService.clear()` must not record its own step here.
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib` → PASS.
- [ ] **Step 5: Commit** `fix(io): open and reset are single undo steps covering layers`.

### Task 5: Export engine — cropped, scaled, clean output and clipboard

**Files:**
- Create: `utils/svg/export-bounds.ts` + spec
- Modify: `input/io.service.ts` (`save`, `prepareSvgForExport` near line 435) + spec, `utils/svg/svg.ts` (`svgToBase64` takes output size separately from viewBox), `types/types.ts` (add `ExportOptions`), `api/api.service.ts`, `ng-whiteboard.service.ts`

**Interfaces:**
- Consumes: Task 1 `effectiveLayerId` (hidden-layer exclusion).
- Produces:
  - `export interface ExportOptions { scale?: number; background?: boolean; padding?: number; onlySelected?: boolean }` (public, from `types`).
  - `exportBounds(elements: readonly WhiteboardElement[], padding: number): Bounds | null` — union of each element's rotated bounds (use the existing `getElementBounds`/rotation utilities in `utils/geometry/bounds.ts` / `utils/dom/element.ts`), expanded by half the stroke width, then by `padding`; `null` for no elements.
  - `IOService.save(format, name, options?: ExportOptions): Promise<string>` — unchanged result shape; output cropped to `exportBounds(exportable, padding)` where exportable = visible-layer, non-deleting elements (∩ selection when `onlySelected`); empty → the canvas box as today. PNG/JPEG pixel size = bounds × `scale`. `background: false` → no background rect (transparent PNG; SVG without background).
  - `IOService.renderExport(format: FormatType.Png | FormatType.Svg, options?: ExportOptions): Promise<{ dataUrl: string; width: number; height: number }>` — no download, no event; used by the dialog preview and copy.
  - `IOService.copyToClipboard(format: FormatType.Png | FormatType.Svg, options?: ExportOptions): Promise<void>` — PNG via `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`, SVG via `writeText`; rejects with a clear `Error` when unsupported. Exposed on `ApiService`/`NgWhiteboardService`.
  - `canCopyImage(): boolean` util in `utils/dom/` — `!!navigator.clipboard?.write && typeof ClipboardItem !== 'undefined'`.
  - Cleaned SVG: explicit `width`, `height`, `viewBox="x y w h"` of the crop; no `_ngcontent-*`/`_nghost-*` attributes; selection group, grid pattern usage and any element with `isDeleting` removed.

- [ ] **Step 1: Failing tests** — `exportBounds` of a 100×50 rect at (10,10), stroke 2, padding 16 → `{x:-7, y:-7, width:134, height:84}`; rect rotated 45° near x=0 → bounds include its rotated corners (Review Focus 1); no elements → `null`. IOService (mock `svgToBase64` and capture the serialized SVG): `save(Svg, 'b')` SVG has `viewBox` equal to crop, numeric `width`/`height`, no `_ngcontent` substring; `save(Png, 'b', {scale: 2})` requests output size 2× crop; element on a hidden layer excluded from bounds and SVG; `onlySelected` with a selection containing a hidden-layer element → that element excluded (Review Focus 2); `background: false` → no `#contentBackground` fill in SVG; empty board → canvas box size as before; `copyToClipboard(Png)` calls `navigator.clipboard.write` with an `image/png` item; unsupported → rejects.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib`; in the demo, export the minimal example as PNG at 2× and open it — sharp, cropped with padding. → PASS.
- [ ] **Step 5: Commit** `fix(export): crop to content, scale, transparent option, clean svg and clipboard copy`.

### Task 6: Header, main menu, editable title, confirm dialog and shortcuts

**Files:**
- Create: `components/editor/ui/dialog/dialog.component.ts` (+ `.scss`, `.spec.ts`) — modal shell (centred ≤640px on wide/medium, bottom sheet on compact via existing `ng-bottom-sheet`), focus trap (`utils/focus-trap.ts`), Escape, returns focus to opener.
- Create: `components/editor/ui/confirm-dialog/confirm-dialog.component.ts` (+ spec) built on the dialog.
- Create: `components/editor/ui/menu/menu.component.ts` (+ `.scss`, `.spec.ts`) — `role="menu"` popover with `menuitem`s, ArrowUp/Down/Home/End, Escape returns focus.
- Create: `components/editor/ui/editable-title/editable-title.component.ts` (+ `.scss`, `.spec.ts`)
- Modify: `components/editor/panels/header-panel/header-panel.component.ts` (+ scss, spec), `components/editor/whiteboard-editor.component.ts|html|scss` (+ spec), `components/editor/utils/editor-actions.ts`, `components/editor/editor-state.service.ts`, `components/editor/icon/icons.ts` (add `folder-open`, `file-json`, `image-down`, `clipboard-copy`, `rotate-ccw`, `pencil`)

**Interfaces:**
- Consumes: Task 4 `resetBoard`, `hasContent`, `importData`; Task 5 `copyToClipboard`, `canCopyImage`; `IOService.exportDataAsFile(filename)` and `importDataFromFile(file)` (existing).
- Produces:
  - `MAIN_MENU_ACTIONS` in `editor-actions.ts` replacing `DOCUMENT_ACTIONS`: ids `'open' | 'save' | 'export' | 'copy-png' | 'theme' | 'reset'`, each with `label`, `icon`, optional `shortcut` text (`'Ctrl+O'` etc., shown as `⌘` on Mac).
  - `EditorStateService`: `openBoard(file: File): Promise<void>`, `saveBoardFile(): void` (filename = title), `copyAsPng(): Promise<void>` (uses export session settings from Task 7's `exportSettings` signal — define the signal here: `exportSettings = signal<ExportSettings>({ format: 'png', scale: 2, background: true })`), `resetBoard(): void` (calls `ApiService.resetBoard`, restores `initialTitle`, resets zoom/pan), `initialTitle` captured on construction.
  - `WhiteboardEditorComponent.exportDialogOpen = signal(false)` (opened by the "export" action; dialog content arrives in Task 7 — until then the action opens an empty dialog with the title "Export image").
  - Header layout: `[menu button] [editable title] [layers button]`; compact keeps properties button and uses the same menu inside the existing menu bottom sheet.
  - `<wb-editable-title [value] (valueChange)>`: button with `aria-label="Rename board"`, pencil icon on hover/focus; Enter/blur commits, Escape cancels; empty → `'Whiteboard'`; ellipsis with `title` tooltip.
  - Hidden `<input type="file" accept=".json,application/json">` for Open.

- [ ] **Step 1: Failing tests** — header renders exactly: menu button, title button, layers button (no New/Save/Export text buttons); menu lists the six items in order with the copy from Global Constraints; "Copy as PNG" absent when `canCopyImage()` is false; "Reset canvas…" opens a confirm with "Reset the canvas? This clears the board."; confirm → `resetBoard` called and title restored to the initial title; cancel → nothing; "Open…" on a non-empty board confirms "Replace the current board?" before reading the file; "Save to file" calls `exportDataAsFile('<title>')`; title: Enter commits, Escape restores previous, empty commits `'Whiteboard'`; title button keyboard-focusable; shortcuts: Ctrl+S on focused board calls save once and `preventDefault`s; Ctrl+O opens the file picker; Ctrl+Shift+C calls `copyAsPng`; Meta works in place of Ctrl; Ctrl+S while typing in an input does nothing; two editors on one page — Ctrl+S with board A focused → only A's save called (Review Focus 4); menu ArrowDown moves focus; Escape closes menu and focuses its trigger; dialog traps Tab and returns focus on close.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; remove `DOCUMENT_ACTIONS`, the header's unused outputs (`layerMenuShow`, `layerVisibilityToggle` pass-throughs that Task 8 replaces may stay until then) and the theme button from the header.
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib`; driver check of header + menu + reset confirm at the four viewports, light and dark → no overflow, 44px coarse targets.
- [ ] **Step 5: Commit** `feat(editor): main menu, editable title, confirm dialog and file shortcuts`.

### Task 7: Export dialog

**Files:**
- Create: `components/editor/ui/export-dialog/export-dialog.component.ts` (+ `.scss`, `.spec.ts`)
- Modify: `components/editor/whiteboard-editor.component.html|ts`, `components/editor/editor-state.service.ts`

**Interfaces:**
- Consumes: Task 5 `renderExport`, `save(format, name, options)`, `copyToClipboard`, `canCopyImage`; Task 6 dialog, `exportSettings` signal, `exportDialogOpen`; existing `wb-segmented-control`.
- Produces: `<wb-export-dialog [hasSelection] [title] (closed)>` with:
  - Preview `<img>` of `renderExport` (checkerboard CSS background when background off), re-rendered on option change (debounce ≤150ms).
  - Format segmented PNG | SVG; Scale segmented 1× | 2× | 3× (hidden for SVG); Background toggle; "Only selected" toggle (shown only with a selection, default on then); Filename input prefilled with the title (extension shown as a suffix label, not editable).
  - Footer: **Download** (primary) → `save(format, filename, options)` then close; **Copy** (hidden when `!canCopyImage()` for PNG) → `copyToClipboard` then show "Copied" for 1.5s.
  - Format/scale/background persist in `exportSettings`; filename and only-selected do not.
  - `ExportSettings = { format: 'png' | 'svg'; scale: 1 | 2 | 3; background: boolean }`.

- [ ] **Step 1: Failing tests** — opens from the main menu "Export image…" and from Ctrl+Shift+E; preview `img.src` equals the mocked `renderExport` data URL; switching to SVG hides Scale; Download with defaults calls `save(Png, '<title>', {scale: 2, background: true, padding: 16, onlySelected: false})`; with a selection, only-selected is shown and checked and passed as `true`; background off → `background: false`; changing scale to 3, closing and reopening → still 3; Copy hidden when `canCopyImage()` false; Escape closes and focuses the opener.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib`; driver check of the dialog at four viewports, light and dark (compact = bottom sheet, no horizontal overflow at 390px).
- [ ] **Step 5: Commit** `feat(editor): export image dialog with preview, scale and background options`.

### Task 8: Layers panel rebuild

**Files:**
- Rewrite: `components/editor/panels/layer-panel/layer-panel.component.ts|html|scss` (+ spec) — selector `ng-layer-panel` (drop `ng-ng-layer-panel`), OnPush, signal inputs.
- Modify: `components/editor/panels/header-panel/header-panel.component.ts`, `components/editor/whiteboard-editor.component.html|ts`, `components/editor/utils/whiteboard-layers.ts` (drop the `type` field mapping), `components/editor/editor-state.service.ts`

**Interfaces:**
- Consumes: Task 1 counts (`layersSignal` with derived `elements`); Task 3 `removeLayer(id, mode)`, `mergeLayerDown`, `duplicateLayer`, `beginLayerOpacityEdit/endLayerOpacityEdit`, `reorderLayersByIndex`; Task 6 `wb-confirm-dialog`, `wb-menu`.
- Produces: `<ng-layer-panel>` inputs `layers: WhiteboardLayer[]`, `activeLayerId: string`; one output `action: LayerPanelAction` where
  `type LayerPanelAction = { type: 'select' | 'add' | 'toggle-visible' | 'toggle-lock' | 'duplicate' | 'merge-down'; id?: string } | { type: 'rename'; id: string; name: string } | { type: 'reorder'; from: number; to: number } | { type: 'opacity'; id: string; opacity: number; phase: 'start' | 'change' | 'end' } | { type: 'blend'; id: string; blendMode: BlendMode } | { type: 'delete'; id: string; mode: 'delete-elements' | 'move-elements' }`.
  The editor maps actions to `EditorStateService` in one `onLayerAction(action)` method; the header's ten layer pass-through outputs collapse to one `layerAction` output.
- Layout rules: header "Layers" + add (+) + close; rows top-first: drag handle, name, muted count ("3 elements"/"1 element"/"Empty"), eye and lock buttons (visible on hover/focus-within, always on coarse pointers, always when hidden/locked); active row highlighted; "⋯" button opens `wb-menu` with Opacity slider (0–100%), Blend mode select (normal, multiply, screen, overlay, darken, lighten), Duplicate, Merge down (disabled on the bottom layer), Delete (disabled when one layer).
- Rename: double-click name, Enter or F2 on focused row → input; Enter/blur commits trimmed non-empty; Escape cancels.
- Reorder: pointer drag on the handle (pointer capture; works for touch) and Alt+ArrowUp/Down on a focused row → `reorder` with visual indices.
- Delete: empty layer → `delete` with `'delete-elements'` directly; non-empty → confirm "Delete layer and its N elements?" with "Delete" and "Move elements to <neighbour name> and delete".

- [ ] **Step 1: Failing tests** — row shows name, "6 elements" for a default layer holding 6 unassigned elements; no opacity slider or type label in rows; eye click emits `toggle-visible`; double-click → input; Escape restores old name and emits nothing (Review Focus 5); Enter emits `rename`; Alt+ArrowDown on the top row emits `reorder {from:0,to:1}`; pointer drag of row 0 below row 1 emits the same; "⋯" → opacity slider drag emits `start`, `change`…, `end` and the editor turns it into one undo step; delete on a 2-element layer opens the confirm with "Delete layer and its 2 elements?"; choosing move emits `mode: 'move-elements'`; delete disabled with one layer; Merge down disabled on the bottom row; hidden layer's eye button visible without hover.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Delete now-dead code: `LayerPanelComponent.ngOnInit` default-layer seeding, `generateLayerId`, `Math` field, header `trackByLayer`/`toggleLayer*`/`showLayerMenu`, editor `onLayerPanel*` handlers.
- [ ] **Step 4: Run** specs, full suite, lint, `yarn build:lib`; driver check of the panel (popover and compact sheet) at four viewports, light and dark, with 1 and 4 layers.
- [ ] **Step 5: Commit** `feat(editor): rebuild layers panel with rename, drag reorder and layer menu`.

### Task 9: Docs and final verification

**Files:**
- Modify: root `README.md` (Built-in Editor section: main menu, export dialog, layers; API section: `ExportOptions`, `copyToClipboard`, `resetBoard`, `removeLayer` mode, `mergeLayerDown`, layer undo; a "Behaviour change" note that `save()` output is now cropped to content with 16px padding), `projects/demo/src/app/documentation/pages/api-reference/api-reference.component.html` (same API rows), regenerate `projects/ng-whiteboard/README.md` via `yarn build:lib`.

- [ ] **Step 1:** Ensure the demo dev server runs at http://localhost:4200 (`yarn start` in the background if down). Driver check on `/examples` minimal board, pinned fullscreen by injected CSS (`ng-whiteboard` → `position:fixed; inset:0`), at 1440×900, 820×1180, 844×390, 390×844, light and dark: open main menu, export dialog, layers panel with 3 layers, reset confirm; screenshot each; report any element outside the viewport and any coarse target under 44px. Read the screenshots by eye.
- [ ] **Step 2:** Fix anything found; re-run until clean. Load `/examples`: zero console errors/warnings; the Basic Example (no editor) renders as on `master`.
- [ ] **Step 3:** README and API reference updates; `yarn build:lib`, `yarn build:demo`, full lib suite, `npx nx test demo --watch=false`, lib and demo lint.
- [ ] **Step 4: Commit** `docs(editor): main menu, export dialog and layers` (+ `fix(editor): ...` for any layout fix).
