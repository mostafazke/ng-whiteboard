# Contextual Properties Panel — Design

Date: 2026-11-03 · Branch: `feat/editor` · Follows: `2026-11-02-built-in-editor-launch-design.md`

## Why

The editor's properties panel shows the same controls (stroke, fill, width, dash, opacity, plus font for text) for
every shape. That is the user's main annoyance: an arrow shows fill and offers no way to set its heads, an image shows
stroke controls that do nothing, a rectangle can't change its corners. Shapes already store these properties
(`ArrowElement.startHead/endHead/pathType`, `RectangleElement.rx`, text `style.color`, …) — the editor just doesn't
expose them.

Every comparable app (Excalidraw, tldraw, Miro, FigJam) solves this the same way: **the panel shows only the controls
that apply to what is selected**. Excalidraw is the closest model and the one we follow.

## Goals

- The panel is contextual: each section appears only when it applies to the current selection.
- Every meaningful visual property of each shape can be set from the panel (table below).
- With nothing selected, the panel follows the active drawing tool and sets the defaults for the next shape.
- Mixed selections show only the sections every selected shape supports; differing values show as mixed (existing
  `MIXED` behaviour).
- Each change is one undo step; drags (sliders, color) stay one step via the existing `beginEdit/endEdit` batching.
  Locked elements are skipped (existing `applyUpdates`).
- Works in every layout already supported (floating panel in wide/medium, bottom sheet in compact; 44px coarse
  targets; keyboard reachable; light/dark tokens).

## Non-goals

- Numeric position / size / rotation fields (whiteboards don't need them; may come later).
- Text alignment (not in the element model).
- Changing the brush preset of an already-drawn pen stroke.
- Per-tool / per-section hide-show configuration for developers (planned later phase; keep sections cleanly
  separated so it is easy to add).
- Floating contextual toolbar next to the selection (Miro/FigJam style).

## Anti-goals

- A panel that shows controls which silently do nothing for the selection.
- Changes that alter how existing boards render (canvas output for existing data stays identical).
- New peer dependencies or a heavier editor chunk than needed (icons are inline SVG, like the rest of the editor).

## Which sections apply to which shape

| Section                             | Pen | Rect | Ellipse | Line | Arrow | Text | Image |
| ----------------------------------- | :-: | :--: | :-----: | :--: | :---: | :--: | :---: |
| Stroke color ("Text color" on text) |  ✓  |  ✓   |    ✓    |  ✓   |   ✓   |  ✓   |       |
| Fill / background                   |     |  ✓   |    ✓    |      |       |      |       |
| Stroke width                        |  ✓  |  ✓   |    ✓    |  ✓   |   ✓   |      |       |
| Stroke style (solid/dashed/dotted…) |     |  ✓   |    ✓    |  ✓   |   ✓   |      |       |
| Line ends (round / square / flat)   |     |      |         |  ✓   |   ✓   |      |       |
| Corner radius                       |     |  ✓   |         |      |       |      |       |
| Arrow start head / end head         |     |      |         |      |   ✓   |      |       |
| Arrow path (straight/curved/elbow)  |     |      |         |      |   ✓   |      |       |
| Font family, size, bold, italic     |     |      |         |      |       |  ✓   |       |
| Opacity                             |  ✓  |  ✓   |    ✓    |  ✓   |   ✓   |  ✓   |   ✓   |

Layer order, alignment and the existing panel actions (grid, snap, delete, close) stay as they are.

A section is shown when **every** selected element supports it. The capability table lives in one pure, tested
editor util (e.g. `utils/shape-capabilities.ts`) — the single place to look when adding a shape or section, and the
hook for the future hide/show phase.

## Section behaviour

- **Stroke color** — on text it writes `style.color` (already done today) and is labelled "Text color".
- **Corner radius** — a slider 0–50 writing `RectangleElement.rx` (SVG already clamps to half the side). One undo
  step per drag.
- **Line ends** — segmented control writing `style.lineCap` (`round` / `square` / `butt`, shown as "Round", "Square",
  "Flat").
- **Arrow heads** — two pickers (start, end), each offering the 8 `ArrowheadType` values with an inline-SVG icon and
  an aria-label; plus a "swap" button that exchanges start and end in one undo step. Writes `startHead/endHead`.
- **Arrow path** — segmented Straight / Curved / Elbow writing `pathType`. Switching an existing arrow to curved
  places the control point at the midpoint of its current (already binding-resolved) endpoints, offset perpendicular
  by 20% of the arrow's length, so the change is visibly bowed (a control point on the line would look straight);
  elbow uses `midRatio: 0.5`; straight drops control data. Bindings to shapes keep working. The arrow tool's own
  drawing behaviour is unchanged.
- **Text** — the existing font controls, unchanged.
- **Opacity** — unchanged (already handles the highlighter's built-in opacity).

## Nothing selected

The panel follows the active tool and edits defaults for new shapes:

- Rectangle, ellipse, line, arrow, pen, text tools → that tool's column from the table, writing config defaults
  (`strokeColor`, `fill`, `strokeWidth`, `dasharray`, `lineCap`, `fontFamily`, `fontSize`, `arrowConfig.startHeadStyle/
endHeadStyle/lineStyle`).
- Pen tool additionally shows a **brush** picker (pen / marker / highlighter / brush / pencil) writing `penType`.
  Pen strokes render as a stroked path using `style.strokeWidth`, so the width default takes effect; the brush keeps
  supplying the outline shape and its built-in opacity. The pen tool is not changed.
- Opacity is hidden when nothing is selected: there is no default-opacity config field, and a control that does nothing
  is an anti-goal.
- Rectangle tool's corner radius needs a default the tool reads: add an optional `WhiteboardConfig` field
  (e.g. `cornerRadius`, default = today's `5`) so existing behaviour is unchanged.
- Select / hand / eraser / image tools with nothing selected → today's general controls (no change).

## Decisions made by Claude (user approved "the recommended" set)

- Follow Excalidraw's model rather than a floating toolbar.
- Pen gets no stroke style or line ends (freehand outline doesn't benefit; matches Excalidraw).
- Corner radius as a slider rather than a sharp/round toggle, so any radius is reachable.
- Arrow head "swap" button added (cheap, common in other apps).
- Only `cornerRadius` is added to the public config; everything else maps to existing fields.
- "Curved" on an existing arrow bows it by a 20% perpendicular offset.
- Opacity is hidden with nothing selected; pen defaults are color, width and brush.

## Left to the builder

- Exact visual layout of the new controls within the existing panel style and tokens.
- How the panel decides "active tool" when nothing is selected (the editor already tracks the selected tool).
- Whether head pickers are a popover grid or an inline row, as long as they fit the 390px sheet and 44px coarse
  targets.
