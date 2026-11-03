# Editor Header, Layers and Export — Design

Date: 2026-11-03 · Branch: `feat/editor` · Follows: `2026-11-02-built-in-editor-launch-design.md`,
`2026-11-03-contextual-properties-panel-design.md`

## Why

The top bar, the layers panel and export were never reviewed after the editor launch work. A hands-on audit (demo
`/examples` minimal board, 1440×900 and 390×844, light and dark) found real bugs and an amateur look:

**Bugs**

1. Deleting a layer leaves its elements in the board data with a `layerId` that no longer exists. The canvas filters
   them out (`whiteboard-canvas.component.ts`: `!el.layerId || visibleLayerIds.has(el.layerId)`), so they become
   invisible ghosts. The delete is not undoable — `HistoryService` only snapshots elements, never layers.
2. Layer element counts are wrong ("Layer 1 · 0 elements" on a board with 6 elements). Membership is stored twice —
   `element.layerId` and `WhiteboardLayer.elements[]` — and the array is only filled by `ElementsService.addElements`,
   not by `setElements`/import/initial data.
3. Export does not match the board:
   - PNG renders the fixed `canvasWidth × canvasHeight` box at 1× (1264×521 while the view was 1896×782): blurry on
     HiDPI, crops content outside the box, includes empty space; no scale, padding or transparent option.
   - SVG keeps `width="100%" height="100%"` and Angular `_ngcontent-*` attributes, so it opens at an odd size in
     other tools.

**Unprofessional UX**

- Header: four text buttons (New / Save / Export / theme) next to the title look like a form toolbar. "Save" downloads
  an SVG and "Export" a PNG — neither saves a reopenable board, and there is no Open. "New" wipes the board without
  confirmation and keeps the title and layers. The title is a clickable `<h1>` with no edit affordance and no keyboard
  access.
- Layers panel: every row carries an opacity slider and a meaningless "Drawing" type label; the drag handle does not
  drag; move up/down and blend mode sit in a detached footer; the add button is alone on its own row; the selector is
  `ng-ng-layer-panel`. Far too heavy for a board that normally has one layer.

## Inspiration (what we follow)

- **Excalidraw** — a single main menu (☰) top-left holds Open, Save to file, Export image, Reset canvas, theme. Export
  image is a dialog with a live preview, background / dark-mode toggles, scale 1×/2×/3×, "only selected", filename,
  and PNG / SVG / Copy buttons. Reset asks for confirmation.
- **tldraw** — same main-menu model; "Export as" / "Copy as" PNG and SVG; transparent background option.
- **Figma / FigJam** — compact layer rows: name, hover-revealed eye and lock, double-click to rename, drag to reorder.
  Opacity and blend mode live with the selected layer, not on every row.

## Goals

1. **Header** = `[☰ menu] [editable title] [layers toggle]` on the left; nothing else in the top bar on wide
   layouts (properties panel stays top-right as today). The compact layout keeps its properties and menu buttons but
   both menus show the same actions.
2. **Main menu** (popover on wide/medium, bottom sheet on compact), in this order:
   - Open… (`.json` board file, via existing `IOService.importDataFromFile`)
   - Save to file (`.json`, via existing `IOService.exportData`; filename = board title)
   - Export image… (opens the export dialog)
   - Copy as PNG (selection if any, else whole board; uses the export dialog's current session settings — 2× and
     background on until the user changes them)
   - separator
   - Theme: light / dark toggle
   - separator
   - Reset canvas… (confirmation; clears elements, layers back to one default layer, title back to the title the host
     passed in on first render — or the library default `'Whiteboard'` — viewport reset; one undo step covering
     elements and layers, see goal 9)
   Keyboard shortcuts shown next to items where they exist: Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+Shift+E,
   Ctrl/Cmd+Shift+C. These shortcuts are wired in the editor only (not in canvas-only mode) and scoped to the focused
   board, like Alt+P.
3. **Editable title**: a button-styled title (hover background, pencil affordance on hover/focus, keyboard focusable,
   `aria-label="Rename board"`). Enter or blur commits, Escape cancels, empty → "Untitled board". Long titles
   ellipsize; the full title is the `title` tooltip. Empty → the library default `'Whiteboard'` (unchanged default; no
   "Untitled board" string).
4. **Export dialog**:
   - Live preview of exactly what will be written (checkerboard behind when background is off).
   - Format: PNG | SVG (segmented control, reuse `wb-segmented-control`).
   - Scale: 1× | 2× | 3× (PNG only; default 2×).
   - Background: on/off (default on; off → transparent).
   - Only selected: shown only when something is selected (default on when there is a selection).
   - Padding: fixed 16px around the content bounds (not user-configurable in this phase).
   - Filename: text input prefilled with the board title; extension added automatically.
   - Actions: **Download** (primary) and **Copy** (PNG to clipboard; SVG as text). Copy is hidden when
     `navigator.clipboard.write` is unavailable.
   - Wide/medium: centred modal (max 640px). Compact: full-height bottom sheet. Focus-trapped, Escape closes,
     focus returns to the opener.
   - Dialog choices (format, scale, background) persist for the editor session.
5. **Export output** is cropped to content bounds (or the selection bounds) + padding, at the chosen scale. Hidden
   layers are excluded; layer opacity and blend modes are respected. Editor chrome (selection box, handles, grid) is
   never in the output. The SVG has explicit `width`/`height`/`viewBox` matching the cropped area and no Angular
   attributes.
6. **Layers panel**:
   - Header: "Layers" title + add (+) icon button + close.
   - Rows (top layer first): drag handle (actually drags), layer name, element count in muted text, eye and lock
     icon buttons (row element counts use goal 8's rule). Eye/lock are visible on hover/focus, always visible on coarse pointers, and always visible when
     the layer is hidden/locked (so state is never invisible). Active row is highlighted.
   - Rename: double-click the name (or Enter on a focused row / F2) → inline input; Enter/blur commits, Escape
     cancels.
   - Moving elements between layers (delete-and-move, merge down) ignores the target layer's lock — it is a layer
     operation, not an element edit. Merge down keeps the lower layer's name, opacity and blend mode.
   - Reorder: pointer drag on the handle (works with touch); keyboard Alt+ArrowUp / Alt+ArrowDown on a focused row.
   - Row "⋯" menu (active row only, or on hover): Opacity slider (0–100%), Blend mode select (the existing six:
     normal, multiply, screen, overlay, darken, lighten), Duplicate, Merge down (if a layer below exists), Delete.
   - Delete of a non-empty layer asks: "Delete layer and its N elements?" with **Delete** and **Move elements to
     <layer below/above> and delete**. Empty layers delete without a prompt. The last layer cannot be deleted.
   - With one layer, the panel is a single quiet row — no footer, no sliders.
   - Wide/medium: popover anchored under the layers button (as today). Compact: bottom sheet (as today).
7. **Layers are undoable**: add, delete, rename, reorder, visibility, lock, opacity, blend mode, duplicate, merge — each
   one history step; an opacity slider drag is one step. Undo after deleting a non-empty layer restores the layer and
   its elements together.
8. **Single source of truth for layer membership**: `element.layerId`. Element counts and any "elements in layer"
   query derive from it. `WhiteboardLayer.elements` stays in the public type (no breaking change) but is derived/kept
   in sync from `layerId` everywhere layers are read or exported — `setElements`, `importData`, `clear` included.
   Elements with **no** `layerId` (today: everything loaded through `setElements` — initial data, `[data]`,
   `importData`) or a `layerId` that refers to no existing layer are treated as belonging to the **bottom layer**. This
   is a read-time rule applied in one shared helper used by counts, canvas visibility/lock/opacity/blend, export and
   lock checks — element data is not rewritten (no DataChange, exported JSON unchanged). Effect for canvas-only
   consumers who never touch the layer API: none (one default layer, always visible and unlocked).
9. **Undo of whole-board actions**: Reset canvas and Open are each **one** history step that snapshots elements *and*
   layers together; undo restores both. Title and viewport are not part of history. Open asks for confirmation when
   the current board has content ("Replace the current board?"). `importData` (public API) records the same single
   mixed step instead of today's "Clear whiteboard" step followed by unrecorded changes.

## Non-goals

- Cloud save, sharing links, live collaboration UI.
- PDF / JPEG export in the dialog (`FormatType.Jpeg` stays available through the API).
- Per-element layers tree (Figma-style element rows under each layer).
- New blend modes in the UI beyond the existing six.
- Changing the toolbar, history, zoom controls or properties panel (zoom control order `+ 100% −` is noted for a later
  pass, not touched here).

## Anti-goals

- Any change to canvas-only consumers (`showEditor` false) other than the bug fixes: export cropping/scale, SVG
  cleanliness, orphan-element repair and layer undo. Public method signatures stay compatible.
- A dialog or menu that is unreachable by keyboard, overflows a 390×844 viewport, or has targets under 44px on coarse
  pointers.
- New runtime dependencies. Icons stay inline SVG in `editor/icon/icons.ts`.
- Silent destructive actions: Reset canvas and deleting a non-empty layer always confirm.

## Public API impact (minor release)

- `IOService.save` / `NgWhiteboardService.save(format, name)` keep their signature. They gain an optional third
  argument `options?: ExportOptions` — `{ scale?: number; background?: boolean; padding?: number; onlySelected?:
  boolean }`. **Default behaviour changes**: output is cropped to content bounds with 16px padding at scale 1 (today:
  fixed canvas box at 1×). This is the fix for bug 3; it is called out in the changelog as a behaviour change.
  An empty board exports the canvas box as today.
- New `copyToClipboard(format, options?)` on `IOService` / `ApiService` / `NgWhiteboardService`.
- Layer operations recorded in history: `undo()`/`redo()` now also cover layer changes. `HistoryEntry` grows an
  optional layer-state snapshot; element-only entries are unchanged.
- `EditorConfig` and exported JSON format unchanged.

## Constraints

- Angular 20.3 standalone, signals, OnPush, `inject()`; `--wb-*` tokens only (light/dark); match existing editor
  primitives (`wb-segmented-control`, `ng-bottom-sheet`, focus trap, radio-group keys).
- Multi-instance safe: no global listeners that affect other boards; shortcuts scoped to the focused board.
- Every task verifies with the touched specs, the full lib suite, lib lint (0 errors), `yarn build:lib`; UI tasks also
  with the four-viewport driver check (1440×900, 820×1180, 844×390, 390×844), light and dark.

## Decisions made by Claude (user skipped questions; please check)

- Follow Excalidraw's single main menu instead of header text buttons; theme moves into the menu.
- "Save" means a reopenable `.json` board file; images come only from "Export image…" and "Copy as PNG".
- Default export scale 2× in the dialog; the API default stays 1× to keep API output size predictable.
- Export is always cropped to content + 16px padding (API default included) — treated as a bug fix.
- Keep named layers (they are public API) but make them lightweight, Figma-style; opacity/blend move into a per-layer
  "⋯" menu.
- Deleting a non-empty layer offers delete-with-elements or move-elements-down.
- Layer membership's source of truth is `element.layerId`; `WhiteboardLayer.elements` becomes derived.
- Reset canvas also resets title, layers and viewport (a true "new board").
- Elements with no or an unknown `layerId` belong to the bottom layer, applied at read time (data not rewritten).
- Reset, Open and `importData` are each one undo step covering elements and layers; Open confirms on a non-empty board.
- Copy as PNG uses the dialog's session settings (2× by default).
- Title default stays `'Whiteboard'`; Reset restores the host's initial title.
- Layer-to-layer moves ignore the target's lock; merge down keeps the lower layer's properties.

## Left to the builder

- Exact visual styling within existing tokens (spacing, shadows, icon choice for menu items).
- Whether the export preview re-renders on every option change or debounced (must feel instant on a 200-element board).
- How the layer drag-reorder is implemented (pointer events; no CDK dependency).
- Internal shape of the history layer snapshot, as long as undo/redo of mixed element+layer steps is consistent.
