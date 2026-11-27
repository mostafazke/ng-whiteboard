# Shapes: "⋯" toolbar button + `enableShapes` switch (short design)

This is a follow-up to `2026-11-27-custom-shapes-design.md`, on the same branch (`feat/shapes`) and the same 7.0.0 release.

## Intent

- Move the shapes grid behind a single **⋯** button in the last slot of the toolbar, so the shape group goes back to its original four tools.
- Give consumers one plain switch to turn the whole shapes feature on or off.

## Decisions (user)

- The **⋯** button sits at the end of the bar and opens the shapes list.
- **Option B:** picking a shape adds no button to the bar. Only ⋯ shows as active while the Shape tool is active.
- The shapes feature can be enabled or disabled through config.

## Approaches

There is one sensible way to build this.

- **⋯ button:** reuses the existing grid popover and its keyboard and focus handling.
- **Switch:** a new boolean `enableShapes`, named to match `enableGrid`.
  - Rejected: reusing `toolbarTools` alone. It only hides the button; `S` and `addShape` would keep working.
  - Rejected: requiring `builtInShapes: false` plus `shapes: []`. That empties the list without turning the feature off, and it is awkward to use.

## Design

1. **Toolbar (wide and compact)**
   - The Shapes trigger is removed from the shape group.
   - A **⋯** button (aria-label "More shapes", `aria-haspopup="menu"`) is rendered as the last item of the toolbar. With `toolbarPosition: 'left'` that is the bottom.
   - It opens the existing 4-column grid popover, with the same arrow, Home, End and Escape keys, focus restore and close-on-blur behaviour.
   - It shows `.active` and `aria-pressed` while `selectedTool === ToolType.Shape`.
   - A grid item's `.active` still requires the Shape tool to be selected; `aria-checked` marks the chosen shape.
   - The popover positions against the ⋯ button. When the toolbar is left-docked, it opens to the right of the button.
2. **Compact mode**
   - The shape flyout goes back to Rectangle, Ellipse, Line and Arrow only; the grid is removed from it.
   - ⋯ is the only entry point.
   - `SHAPE_TOOLS` no longer includes `ToolType.Shape`.
   - The collapsed shape trigger's "last used" logic ignores Shape.
3. **`enableShapes?: boolean`** in `WhiteboardConfig`, default `true`. When `false`:
   - the ⋯ button is not rendered;
   - the `s` key and `setActiveTool(ToolType.Shape)` do nothing. Activation is refused at the tools-service level and the current tool stays active;
   - `addShape` warns and returns `null`;
   - `getAvailableShapes()` and the registry's `shapes()` return `[]`;
   - existing shape elements still render, select, export and sync. Only creation is blocked.
4. **Unchanged:** `builtInShapes` and `shapes` still choose the list. `toolbarTools` still hides ⋯ when `ToolType.Shape` is not listed. ⋯ is also hidden when the list is empty.
5. **Docs and demo:** README, API reference (an `enableShapes` row, plus "⋯ button" wording), and the custom-shapes example (show or describe `enableShapes`).

## Left to the builder

- The ⋯ icon (three horizontal dots, in the existing icon style).
- Where the "end of bar" slot is defined in the toolbar template.
- Test layout.

Commits: conventional (`feat(shapes): …`), no AI trailers.
