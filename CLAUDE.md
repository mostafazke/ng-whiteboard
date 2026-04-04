# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Serve demo app
yarn start

# Build library + demo
yarn build
yarn build:lib   # library only (ng-packagr → dist/projects/ng-whiteboard)
yarn build:demo  # demo PWA only

# Test
yarn test:lib    # library tests with coverage (watch mode)
yarn test:demo   # demo tests with coverage (watch mode)
yarn test:ci     # library tests in CI mode (lcov coverage)

# Lint (via Nx)
nx run ng-whiteboard:lint
nx run demo:lint

# Conventional commits
yarn cm
```

Running a single test file:

```bash
npx nx test ng-whiteboard --testFile=projects/ng-whiteboard/src/lib/core/tools/pen/pen.tool.spec.ts
```

## Architecture

This is an **Nx monorepo** with two Angular 17 projects:

- `projects/ng-whiteboard` — publishable Angular library (npm: `ng-whiteboard`)
- `projects/demo` — standalone PWA demo deployed to GitHub Pages

The library renders entirely via **SVG** (no Canvas 2D). It uses Angular standalone components, `inject()`, Signals, and `OnPush` change detection throughout.

### Library structure (`projects/ng-whiteboard/src/lib/`)

**Entry points:**

- `NgWhiteboardComponent` (`ng-whiteboard.component.ts`) — root component `<ng-whiteboard>`, provides all services, hosts `<ng-whiteboard-canvas>` and `<wb-context-menu>`
- `NgWhiteboardService` (`ng-whiteboard.service.ts`) — public facade for consumers; delegates to `ApiService` for the active board
- `src/index.ts` — public API surface

**Multi-instance pattern:** `InstanceService` (root) holds a `Map<boardId, ApiService>`. Call `whiteboardService.setActiveBoard(boardId)` to target a specific board instance.

**Core subsystems in `core/`:**

| Directory                  | Key service/class                                                                      | Responsibility                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `api/`                     | `ApiService`                                                                           | Internal aggregate API per board instance                                                              |
| `canvas/`                  | `CanvasService`, `InstanceService`                                                     | SVG canvas management, board registry                                                                  |
| `components/canvas/`       | `WhiteboardCanvasComponent`                                                            | SVG rendering surface                                                                                  |
| `components/context-menu/` | `ContextMenuComponent`, `ContextMenuService`                                           | Right-click menu                                                                                       |
| `config/`                  | `ConfigService`                                                                        | `WhiteboardConfig` signal management                                                                   |
| `elements/`                | `ElementsService`, `SelectionService`, `LayerManagementService`, `ArrowBindingService` | Element CRUD, selection, z-order, arrow smart binding                                                  |
| `event-bus/`               | `EventBusService`                                                                      | Typed event bus — RxJS `Subject` + Angular Signals dual-emission for all `WhiteboardEvent` enum values |
| `history/`                 | `HistoryService`                                                                       | Undo/redo stack                                                                                        |
| `input/`                   | `IOService`, `KeyboardShortcutService`, `ClipboardService`, `DragDropService`          | Pointer events, shortcuts, clipboard, drag-and-drop                                                    |
| `tools/`                   | `BaseTool`, `ToolsService`, `ToolFactory`                                              | Strategy pattern — each tool extends `BaseTool` and implements `handlePointerDown/Move/Up`             |
| `viewport/`                | `ZoomService`, `PanService`, `WheelHandlerService`                                     | Zoom, pan, wheel input                                                                                 |
| `svg/`                     | `SvgService`, `SvgDirective`                                                           | SVG utilities and export                                                                               |
| `types/`                   | `elements.ts`, `tools.ts`, `config.ts`, `events.ts`                                    | All TypeScript types and enums                                                                         |
| `utils/`                   | `geometry/`, `drawing/`, `dom/`, `svg/`                                                | Pure functions, no Angular dependencies                                                                |

**Tool pattern:** `BaseTool` is abstract. Concrete tools (Pen, Rectangle, Ellipse, Line, Arrow, Text, Image, Eraser, Hand, Select) extend it. `ToolFactory` creates them, `ToolsService` manages the active one.

**Element types:** `ElementType` enum values each have a `*Element` class and `ElementUtil<T>` interface with `create`, `resize`, `getBounds`, and `hitTest`.

### Demo app (`projects/demo/src/app/`)

Lazy-loaded routes: `/` (home), `/documentation` (with sub-routes), `/examples`, `/quick-start`, `/live` (Firebase real-time collaboration).

## Key conventions

- Path alias `"ng-whiteboard"` → `projects/ng-whiteboard/src/index.ts` (configured in `tsconfig.base.json`)
- Library builds to `dist/projects/ng-whiteboard`
- Default base branch is `master` (`nx.json`: `defaultBase: master`)
- Use conventional commits (`yarn cm` / commitizen)

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
