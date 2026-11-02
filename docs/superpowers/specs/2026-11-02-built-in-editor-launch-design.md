# Built-in Editor: Launch (Phase 1) — Design

## Intent

ng-whiteboard ships today as a bare SVG canvas; every consumer has to build their own toolbar, properties panel and zoom controls. We want a **built-in editor** that a developer turns on with one input and that works out of the box on desktop, tablet and phone. It must be lightweight (no new runtime dependencies), robust (no half-wired features), and a foundation for later customization.

A first version already exists on branch `feat/editor` (commit `6aaa56c`, ~5.2k lines under `projects/ng-whiteboard/src/lib/core/components/editor/`). It looks good on desktop but is broken on phones and has unfinished internals. This phase makes it launchable.

## Goals

1. **On/off switch.** `<ng-whiteboard [showEditor]="true">` shows the editor; `false` (the default) renders exactly what ships today — canvas + context menu, nothing else. No behavior change for existing consumers who don't opt in.
2. **Works on every form factor** the browser can present: desktop (mouse/trackpad), tablet (touch, pen), phone portrait and phone landscape.
3. **Robust.** Every visible control does what it says, routes through the existing services, and is undoable where it changes elements.
4. **Shippable as a minor release** (current version 5.6.0) — no breaking public API changes.

## Non-goals (later phases)

- Showing/hiding individual tools, bars or panels from consumer config.
- Reordering or grouping tools; adding consumer-supplied tools/buttons.
- Theming beyond the existing `theme: 'light' | 'dark'`.
- New drawing tools.

## Anti-goals (would be a failure even if it "works")

- Any change to rendering or behavior when `showEditor` is false and `theme` is not set to `'dark'`.
- Adding a UI library or other runtime dependency.
- A phone layout that is a squeezed desktop layout (controls off-screen, overlapping, or too small to tap).
- Controls that appear to work but silently do nothing (current alignment buttons).

## Current state (observed by running the demo, 2026-10-29)

Driven in headless Chrome at 1440×900, 820×1180 (touch), 844×390 (touch) and 390×844 (touch):

- **Desktop/tablet:** layout fine; drawing, selection, properties panel, zoom menu, layers popover, undo/redo work. Touch drawing works on tablet.
- **Phone portrait:** properties panel overlaps the header; bottom toolbar overflows both screen edges (Pan/Select unreachable); zoom controls collide with the toolbar; extended-tools popover clipped; header buttons pushed off-screen.
- **Phone landscape:** properties panel clipped at bottom, not scrollable.
- **All sizes:** every editor button is under 44px (most 24–28px); "Dark Mode" label wraps to two lines.
- **Canvas input** (`svg/svg.directive.ts`) handles one pointer at a time — no pinch-zoom or two-finger pan.
- **Internals:** `alignElements` and distribute compute updates then discard them (`TODO`s in `editor-state.service.ts`); multi-select shows an empty properties panel; layer opacity displays "10000%"; "more tools" opens two empty section headers; `console.log` debug output in editor-state, layer-panel, color-picker and editor component; `allowSignalWrites` deprecation warnings on load (~6 per page).
- **`EditorConfig`** (`types/config.ts`) has ~70 boolean flags (`showBlog`, `showWebinars`, …); the editor reads only `title` (and `theme`). It is **already public** on master/5.6.0 via `export * from './lib/core/types'`, and `IOService` writes it into exported files under `editor` and reads it back on import.

## What gets built

### 1. Responsive layout

Breakpoints are based on the **editor's own container size**, not the window (the editor is often embedded in a page region, as on the demo's Examples page). Use CSS container queries on the editor root.

| Container | Layout |
|---|---|
| ≥ 1024px wide | Current desktop layout: header top-left, properties panel top-right (open by default), toolbar bottom-center, undo/redo bottom-left, zoom bottom-right. |
| 640–1023px | Same positions. Properties panel max-height = container height minus header/toolbar, scrolls internally. Header labels collapse to icons when they don't fit. |
| < 640px wide, or < 500px tall | **Compact layout:** header shows icon buttons only (menu for New/Save/Export/theme). Toolbar is full-width at the bottom, scrolls horizontally, and stays clear of other controls. Undo/redo and zoom move to a row above the toolbar (or into the header) so nothing overlaps. Properties panel becomes a **bottom sheet**, closed by default and opened only by its button (which highlights when something is selected — no auto-open, so the sheet never covers an element the user is about to move), dismissible by swipe-down or tap outside. Popovers (zoom menu, layers, extended tools) open as bottom sheets. |

- Respect `env(safe-area-inset-*)` for notched phones.
- Nothing in the editor may extend outside the editor container at any size ≥ 320×320.

### 2. Touch & pointer

- **Hit targets ≥ 44×44px when `(pointer: coarse)`**; visual size may stay smaller on fine pointers.
- **Pinch-to-zoom and two-finger pan** on the canvas: track active pointers in `SvgDirective`; when a second pointer goes down, cancel any in-progress tool action (discard the draft element, no history entry) and switch to gesture mode, zooming around the pinch midpoint via `ZoomService`/`PanService`. Gesture ends when all pointers lift. This lives in the library core (benefits canvas-only consumers too).
- `touch-action: none` on the canvas so the browser doesn't scroll/zoom the page during gestures.
- Hover-only affordances (tooltips) must not be required to use any control.

### 3. Finish or remove half-done features

- **Alignment & distribute:** compute with `getElementBounds()` (`utils/dom/element.ts`) instead of guessed sizes; apply via `ElementsService.updateElements` so it's one undoable history step. Shown when ≥ 2 elements are selected (distribute ≥ 3).
- **Multi-select properties:** show stroke color, fill, stroke width, dash, opacity. When values differ, show a mixed state; editing applies to all selected elements as one history step.
- **All property edits** (color, width, dash, opacity, font) go through `ElementsService` and are undoable.
- **Layer opacity:** fix the 100× display bug (store 0–1, display 0–100%).
- **Extended ("more") tools menu:** remove it unless there are real tools to put in it. Builder's call; empty sections must not ship.
- Remove all `console.log`/`console.debug` from editor code; fix `allowSignalWrites` deprecation warnings.
- Header "Dark Mode" text button → icon toggle (sun/moon) with aria-label.

### 4. `EditorConfig` (no breaking change)

- Keep the `EditorConfig` interface exported. Make every flag except `title` and `theme` optional and mark it `@deprecated` ("unused; will be removed in the next major"). Stop writing the deprecated flags into exported files; keep tolerating them on import.
- Do **not** add a new public customization API in this phase.

### 5. Theme (new public option, opt-in)

`WhiteboardConfig.theme` was added on this branch (commit `6aaa56c`); it is **not** on master/5.6.0. It ships in this release as public, documented API, with these rules:

- **Single source of truth:** `WhiteboardConfig.theme`. `EditorConfig.theme` is marked `@deprecated` with the other unused flags; remove the effect in `EditorStateService` that syncs the two.
- **Unset or `'light'` renders exactly as master does:** gray grid stroke, dodgerblue selection box, same default colors. Dark canvas styles apply only when `theme === 'dark'`. Today the branch's canvas SCSS and `ConfigService` default change rendering for every consumer — fix that (e.g. leave `theme` undefined by default and only bind `data-theme` when set).
- `ConfigService.withThemeColors` swaps `backgroundColor`/`strokeColor` only when they are still the previous theme's defaults, and only on an actual theme change — never overwrites colors a consumer set.
- Export writes `settings.theme` only when set; import of old files without it keeps current behavior.
- Tests: light/unset canvas output matches master; dark swap; consumer colors preserved.

### 6. Accessibility basics

- Every icon button has an `aria-label`; toolbar is a `role="toolbar"` with arrow-key navigation; bottom sheets/popovers trap focus and close on Escape; visible focus ring.
- Editor keyboard shortcut `P` (toggle properties panel) must not fire while typing in any input/textarea/contenteditable (today it only checks title editing).

### 7. Tests & demo

- Unit tests for `EditorStateService` (alignment math incl. distribute, multi-select property merge, undo of property edits) and the pinch/pan gesture logic.
- Component tests: editor not rendered when `showEditor` is false; renders when true.
- Demo: minimal example keeps `showEditor: true`. Add a short "Editor" section to README and the demo documentation describing `showEditor` and `theme`.
- Manual verification: rerun the four-viewport walkthrough above (desktop, tablet, phone landscape, phone portrait). Zero console errors or warnings from the editor, no control outside the container, all controls reachable and working by touch.

## Constraints

- Angular 20.3, standalone components, signals, `OnPush`, `inject()` — match existing library style.
- No new runtime dependencies. SCSS only; icons stay inline SVG (`editor/icon/icons.ts`).
- Multi-instance: the editor must work with multiple `<ng-whiteboard>` on one page (it uses per-instance services already — keep it that way; no `window` listeners that affect other boards, e.g. the current `window:keydown` listener must scope to the focused board).
- Library builds with `yarn build:lib`; lint/tests via `nx`.

## Decisions made by Claude (please check)

- Breakpoints follow the editor container, not the window (container queries).
- Phone threshold: < 640px wide or < 500px tall.
- Properties panel is a bottom sheet on phones, closed by default.
- Pinch/pan is implemented in the core canvas, so it applies with or without the editor.
- `EditorConfig` is deprecated in place rather than removed, because it already shipped in 5.6.0 and appears in users' exported files.
- Remove the "more tools" menu rather than filling it.
- `WhiteboardConfig.theme` ships as public API (as your commit `6aaa56c` intended), but unset/light must render exactly like master; `EditorConfig.theme` is deprecated.
- Phone properties sheet opens only by button, never automatically on selection.

## Left to the builder

- Exact component structure for the bottom sheet (shared component vs. per-panel).
- Where undo/redo and zoom sit in compact layout (above toolbar vs. in header), as long as nothing overlaps and all are reachable.
- Animation details, exact spacing and colors within the existing visual style.
