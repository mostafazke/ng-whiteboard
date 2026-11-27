# Shapes ⋯ Button and enableShapes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the shapes grid behind a "⋯" button in the last slot of the toolbar, and add an `enableShapes` config switch for the whole shapes feature.

**Architecture:**
- The Shape tool entry moves into its own last toolbar group, and the toolbar renders that entry as the ⋯ trigger.
- The compact shape flyout goes back to the four basic tools.
- `enableShapes: false` makes the shape registry empty. That empty list then drives everything else: ⋯ is hidden, Shape can't be activated, and `addShape` returns null.

**Tech Stack:** Angular 20 (signals, OnPush) and Jest via Nx.

**Spec:** `docs/superpowers/specs/2026-11-27-shapes-overflow-button-design.md` (follow-up to `docs/superpowers/specs/2026-11-27-custom-shapes-design.md`)

## Global Constraints

- Branch `feat/shapes`; part of the same 7.0.0 release.
- Conventional commits (`feat(shapes): …`, `docs(shapes): …`), no AI trailers, never stage `nx.json`.
- Comments only for complex code.
- Paths are relative to `projects/ng-whiteboard/src/lib/` unless they start with `projects/` or `docs/`.
- Single test file: `npx nx test ng-whiteboard --testFile=<path>`. Full suite: `npx nx test ng-whiteboard --watch=false`.
- ⋯ button: `aria-label="More shapes"`, `aria-haspopup="menu"`, and the existing icon `'more'`.
- `enableShapes?: boolean`, default `true`.

## Review Focus

1. `enableShapes` switched to `false` at runtime while the Shape tool is active: the board should fall back to Select, not stay on a tool that can't draw. Test in Task 1.
2. The `s` key and `setActiveTool(ToolType.Shape)` when there are no shapes, either because the feature is disabled or because the list is empty: nothing happens and the current tool stays. Test in Task 1.
3. Compact mode with both popovers: opening the shape flyout and then ⋯ (or the reverse) must show only one menu, and Escape must return focus to the button that opened it. Test in Task 2.
4. `toolbarTools` without `ToolType.Shape`: ⋯ is hidden in both wide and compact mode. Test in Task 2.
5. Existing shape elements on a board with `enableShapes: false` still render and select. Test in Task 1.

---

### Task 1: `enableShapes` switch

**Files:**
- Modify:
  - `core/types/config.ts` (adds `enableShapes?: boolean` next to `shapes`)
  - `core/config/config.service.ts` (default `true`)
  - `core/elements/shapes/shape-registry.service.ts` (empty list when disabled)
  - `core/tools/tools.service.ts` (`setActiveTool` guard and runtime fallback)
  - `core/api/api.service.ts` (`addShape` warning text)
- Test:
  - `core/elements/shapes/shape-registry.service.spec.ts`
  - `core/tools/tools.service.spec.ts`
  - `ng-whiteboard.service.spec.ts`
  - `core/components/canvas/whiteboard-canvas.component.spec.ts`

**Interfaces:**
- Consumes: `ShapeRegistryService.shapes` and `ConfigService`.
- Produces:
  - `WhiteboardConfig.enableShapes?: boolean`.
  - `ShapeRegistryService.shapes()` returns `[]` when `enableShapes === false`.
  - `ToolsService.setActiveTool(ToolType.Shape)` is a no-op while `shapeRegistry.shapes().length === 0`.

- [ ] **Step 1: Write failing tests**
  - Registry: `updateConfig({ enableShapes: false })` gives `shapes()` equal to `[]` and `activeShape()` undefined. Setting it back to `true` gives 12 shapes again.
  - ToolsService:
    - With `enableShapes: false`, calling `setActiveTool(ToolType.Shape)` while Pen is active leaves `selectedTool()` as Pen.
    - The same holds with `builtInShapes: false` and no `shapes` (Review Focus 2).
    - With Shape active, switching `enableShapes` to `false` changes `selectedTool()` to `ToolType.Select` (Review Focus 1).
  - Service:
    - With `enableShapes: false`, `addShape('star')` returns `null`.
    - `console.warn` is called with a message containing `'shapes are disabled'`.
    - `getAvailableShapes()` returns `[]`.
  - Canvas: with `enableShapes: false`, an existing shape element still renders its `path` (Review Focus 5).

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Config field and default.
  - Registry: the computed returns `[]` early when the config has `enableShapes === false`, keeping its existing `equal` check.
  - `ToolsService`:
    - Inject `ShapeRegistryService`.
    - The guard in `setActiveTool` applies only to `ToolType.Shape`.
    - An `effect` switches to `ToolType.Select` when the selected tool is Shape and `shapes()` is empty.
  - `addShape`: when `enableShapes === false`, warn `ng-whiteboard: shapes are disabled (enableShapes: false).` and return `null`, before the unknown-id check.

- [ ] **Step 4: Run the touched specs, then the full suite (PASS).**

- [ ] **Step 5: Commit**
  `git commit -m "feat(shapes): add enableShapes switch"`

---

### Task 2: ⋯ button at the end of the toolbar

**Files:**
- Modify:
  - `core/input/tool-shortcuts.ts`
  - `core/components/editor/panels/toolbar/toolbar.component.ts` (template, logic and styles)
- Test:
  - `core/input/tool-shortcuts.spec.ts`
  - `core/components/editor/panels/toolbar/toolbar.component.spec.ts`

**Interfaces:**
- Consumes: the toolbar inputs `shapes`, `activeShapeId` and `selectedTool`, and the output `shapeSelect` (unchanged).
- Produces:
  - In `GROUPS`, the Shape entry `{ tool: ToolType.Shape, label: 'More shapes', keys: ['s'], numbered: false }` moves into a new last group of its own. `SHAPE_TOOLS` becomes `[Rectangle, Ellipse, Line, Arrow]`.
  - The toolbar replaces its `flyoutOpen` boolean with `openMenu = signal<'tools' | 'shapes' | null>(null)`.

- [ ] **Step 1: Write failing tests** (update the existing shape-grid tests to the new placement)
  - tool-shortcuts:
    - The last group of `toolGroups()` is exactly `[ToolType.Shape]`.
    - `SHAPE_TOOLS` does not include Shape.
    - `toolForKey('s')` still returns Shape, and the digits are unchanged.
  - Toolbar, wide mode:
    - The last `.toolbar-group` contains a `button[aria-label="More shapes"][aria-haspopup="menu"]` with no inline Shapes trigger in the shape group.
    - Clicking it opens the 4-column grid.
    - It has `.active` and `aria-pressed="true"` only while `selectedTool` is Shape.
  - Toolbar, compact mode:
    - The shape flyout shows exactly Rectangle, Ellipse, Line and Arrow, with no `.shape-grid` inside it.
    - ⋯ is present at the end and opens the grid.
    - Opening the shape flyout and then ⋯ leaves only the shapes menu in the DOM.
    - Escape in each menu returns focus to its own trigger (Review Focus 3).
  - `tools` without Shape, and an empty `shapes` list: no ⋯ in wide or compact mode (Review Focus 4).
  - Left-docked wide toolbar: the shapes popover has the `beside` class.

- [ ] **Step 2: Run and verify they fail.**

- [ ] **Step 3: Implement**
  - Move the Shape entry to the new group.
  - In the toolbar, render the `ToolType.Shape` entry as the ⋯ trigger with the `'more'` icon. Drop the active-shape icon from the trigger.
  - Remove the grid from the compact flyout.
  - Key both popovers off `openMenu`. Reuse `toggleFlyout`'s positioning, parameterised by which menu is opening. Reuse the focus, blur and keyboard handlers.
  - `focusTrigger` targets the trigger of the menu that was open.
  - Remove code that becomes dead: `showShapeGrid`, `flyoutTools`, the Shape branch of `shapeIconPath`/`toolLabel`, and the compact "last used = Shape" path.

- [ ] **Step 4: Run both specs, then the full suite. Lint: `npx nx run ng-whiteboard:lint` (no new errors).**

- [ ] **Step 5: Commit**
  `git commit -m "feat(shapes): open shapes from a more button at the end of the toolbar"`

---

### Task 3: Docs and demo

**Files:**
- Modify:
  - `projects/ng-whiteboard/README.md` (Custom Shapes section and config table)
  - `projects/demo/src/app/documentation/pages/api-reference/api-reference.component.html` (adds an `enableShapes` row; changes "Shapes button" wording to "⋯ (More shapes) button")
  - the custom-shapes example in `projects/demo/src/app/examples/custom-shapes/`
  - `projects/demo/src/app/documentation/pages/keyboard-shortcuts/keyboard-shortcuts.component.ts`, if its wording mentions a Shapes button

- [ ] **Step 1:** Document `enableShapes` in the README and API reference: what it hides and blocks, and that existing shapes still render. Update wording that describes where the grid opens.
- [ ] **Step 2:** In the custom-shapes example, add a checkbox "Enable shapes" bound to `config.enableShapes` (on by default), so the ⋯ button appears and disappears live.
- [ ] **Step 3:** Run `npx nx test demo --watch=false`, `npx nx run demo:lint` and `yarn build`. All pass.
- [ ] **Step 4: Commit**
  `git commit -m "docs(shapes): document enableShapes and the more button"`
