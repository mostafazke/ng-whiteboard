<p align="center">
  <a href="https://mostafazke.github.io/ng-whiteboard">
    <img width="256" src="https://mostafazke.github.io/ng-whiteboard/assets/icons/icon-512x512.png">
  </a>
</p>

<h1 align="center">
ng-whiteboard
</h1>

<div align="center">

Lightweight angular whiteboard.

[![Build Status](https://dl.circleci.com/status-badge/img/gh/mostafazke/ng-whiteboard/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/mostafazke/ng-whiteboard/tree/master)
[![ng-whiteboard](https://img.shields.io/badge/angular-whiteboard-blue)](https://mostafazke.github.io/ng-whiteboard)
[![npm version](https://img.shields.io/npm/v/ng-whiteboard.svg)](https://www.npmjs.com/package/ng-whiteboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/ng-whiteboard.svg)](https://www.npmjs.com/package/ng-whiteboard)
[![codecov](https://codecov.io/gh/mostafazke/ng-whiteboard/branch/master/graph/badge.svg?token=4VewQU6OZN)](https://codecov.io/gh/mostafazke/ng-whiteboard)

</div>

**ng-whiteboard** is a feature-rich, modular, and flexible whiteboard library for Angular. Designed for ease of use, performance, and a seamless drawing experience. It provides essential drawing tools and features with a scalable architecture.

🔗 **[Live Demo](https://mostafazke.github.io/ng-whiteboard)**

## ✨ Features

- 🎨 **SVG-based rendering** for high-quality visuals
- ⚡ **Optimized performance** for smooth interactions
- 📦 **Modular, tree-shakable, and lightweight architecture**
- 🛠️ **Comprehensive Public API** via `WhiteboardService` and component bindings
- 📏 **Undo/Redo, Zoom, Pan, and Save functionalities**
- 🖊️ **Multiple drawing tools** (pen, shapes, text, eraser, hand tool, etc.)
- 🔄 **Multi-instance support** - Run multiple independent whiteboards simultaneously
- ⌨️ **Keyboard shortcuts** - Full keyboard support for common operations
- 📋 **Context menu** - Right-click menu for quick actions
- 📑 **Layer management** - Control element z-index and stacking order
- ✂️ **Copy/Paste/Cut** - Full clipboard support for elements
- 🎯 **Selection tools** - Select, move, resize, and rotate elements
- 🔗 **Arrows** - Arrows with customizable heads, and smart element binding
- 🏗 **Future-proof and scalable design**

## 📦 Installation

Install via yarn:

```sh
yarn add ng-whiteboard
```

or npm:

```sh
npm install ng-whiteboard
```

## 🔧 Integration

### For Standalone Components

Import the component directly in your standalone component:

```typescript
import { Component } from '@angular/core';
import { NgWhiteboardComponent } from 'ng-whiteboard';

@Component({
  selector: 'my-component',
  imports: [NgWhiteboardComponent],
  template: '<ng-whiteboard></ng-whiteboard>',
})
export class MyComponent {}
```

### For NgModules

Import the component in your `app.module.ts`:

```typescript
import { NgWhiteboardComponent } from 'ng-whiteboard';

@NgModule({
  imports: [NgWhiteboardComponent],
  // other imports
})
export class AppModule {}
```

## 🚀 Usage

### Basic Example

```html
<ng-whiteboard></ng-whiteboard>
```

### Advanced Example With Persist Data

```typescript
import { Component, OnInit } from '@angular/core';
import { WhiteboardService } from 'ng-whiteboard';

@Component({
  selector: 'app-whiteboard-container',
  templateUrl: './whiteboard-container.component.html',
  styleUrls: ['./whiteboard-container.component.css'],
})
export class WhiteboardContainerComponent implements OnInit {
  whiteboardOptions: WhiteboardOptions = {
    backgroundColor: '#fff',
    strokeColor: '#2c80b1',
    strokeWidth: 5,
  };

  constructor(private whiteboardService: WhiteboardService) {}

  ngOnInit() {
    const savedData = localStorage.getItem('whiteboardData');
    if (savedData) {
      this.data = JSON.parse(savedData);
    }
  }

  onDataChange(data: WhiteboardElement[]) {
    localStorage.setItem('whiteboardData', JSON.stringify(data));
  }

  clearBoard() {
    this.whiteboardService.clear();
  }
}
```

### Component Integration

```html
<ng-whiteboard (dataChange)="onDataChange($event)" [options]="whiteboardOptions"></ng-whiteboard>
```

## ⚙️ Configuration

| Input               | Type                  | Default          | Description                                                                                        |
| ------------------- | --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `[data]`            | `WhiteboardElement[]` | `[]`             | The whiteboard data                                                                                |
| `[options]`         | `WhiteboardOptions`   | `null`           | Component configuration object, properties described below                                         |
| `[drawingEnabled]`  | `boolean`             | `true`           | Enable mouse/touch interactions                                                                    |
| `[selectedTool]`    | `ToolType`            | `ToolType.Pen`   | The current selected tool                                                                          |
| `[canvasWidth]`     | `number`              | `800`            | The width of whiteboard canvas                                                                     |
| `[canvasHeight]`    | `number`              | `600`            | The height of whiteboard canvas                                                                    |
| `[fullScreen]`      | `boolean`             | `true`           | If true, change (canvasWidth, canvasHeight) to fit the parent container                            |
| `[strokeColor]`     | `string`              | `#333333`        | The default stroke color                                                                           |
| `[backgroundColor]` | `string`              | `#F8F9FA`        | The default background color                                                                       |
| `[fill]`            | `string`              | `transparent`    | The default fill color                                                                             |
| `[strokeWidth]`     | `number`              | `2`              | The default stroke width                                                                           |
| `[zoom]`            | `number`              | `1`              | Zoom level                                                                                         |
| `[fontFamily]`      | `string`              | `sans-serif`     | The default font family                                                                            |
| `[fontSize]`        | `number`              | `24`             | The default font size                                                                              |
| `[center]`          | `boolean`             | `true`           | Center the canvas in parent component, works with `fullScreen: false`                              |
| `[x]`               | `number`              | `0`              | If `center` is false, set the X axis                                                               |
| `[y]`               | `number`              | `0`              | If `center` is false, set the Y axis                                                               |
| `[enableGrid]`      | `boolean`             | `false`          | Enable the grid pattern                                                                            |
| `[gridSize]`        | `number`              | `10`             | Set the grid inner boxes size                                                                      |
| `[snapToGrid]`      | `boolean`             | `false`          | Enable snapping to grid                                                                            |
| `[lineJoin]`        | `LineJoin`            | `LineJoin.Miter` | The default Line join                                                                              |
| `[lineCap]`         | `LineCap`             | `LineCap.Butt`   | The default Line cap                                                                               |
| `[dasharray]`       | `string`              | `''`             | The default dash-array                                                                             |
| `[dashoffset]`      | `number`              | `0`              | The default dash-offset                                                                            |
| `[arrowConfig]`     | `ArrowConfig`         | See below        | Arrow-specific configuration (heads, line style). See [Arrow Configuration](#-arrow-configuration) |

## 🏹 Arrow Configuration

The `arrowConfig` property controls the default appearance of newly drawn arrows.

```typescript
import { ArrowConfig } from 'ng-whiteboard';

const config: Partial<WhiteboardConfig> = {
  arrowConfig: {
    startHeadStyle: 'none',
    endHeadStyle: 'open-arrow',
    lineStyle: 'curve',
  },
};
```

```html
<ng-whiteboard [config]="config"></ng-whiteboard>
```

### `ArrowConfig` Properties

| Property         | Type             | Default        | Description                               |
| ---------------- | ---------------- | -------------- | ----------------------------------------- |
| `startHeadStyle` | `ArrowHeadStyle` | `'none'`       | Arrowhead style at the start of the arrow |
| `endHeadStyle`   | `ArrowHeadStyle` | `'open-arrow'` | Arrowhead style at the end of the arrow   |
| `lineStyle`      | `ArrowLineStyle` | `'curve'`      | Default path type for new arrows          |

### `ArrowHeadStyle` Values

| Value            | Description                       |
| ---------------- | --------------------------------- |
| `'none'`         | No arrowhead                      |
| `'arrow'`        | Filled triangle                   |
| `'open-arrow'`   | Open V-chevron (stroked)          |
| `'diamond'`      | Filled diamond                    |
| `'open-diamond'` | Open diamond outline              |
| `'circle'`       | Filled circle                     |
| `'open-circle'`  | Open circle outline               |
| `'bar'`          | Vertical bar (perpendicular line) |

### `ArrowLineStyle` Values

| Value        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| `'straight'` | Direct line between start and end points                             |
| `'curve'`    | Smooth quadratic curve with a draggable control point                |
| `'elbow'`    | Right-angle (orthogonal) connector with a configurable bend position |

### Arrow Drawing Modifiers

| Modifier          | Behavior                                           |
| ----------------- | -------------------------------------------------- |
| `Shift + Drag`    | Constrains arrow angle to 15° increments           |
| Drag near element | Auto-snaps to connection points (20px snap radius) |

### Smart Element Binding

Arrows can automatically bind to other elements (rectangles, ellipses, images, and text). When an arrow endpoint is dragged near a connectable element, it snaps to the nearest **connection point** and creates a binding. Bound arrows automatically update their position when the connected element is moved or resized.

**Connection Points per Shape:**

| Shape     | Connection Points                                               |
| --------- | --------------------------------------------------------------- |
| Rectangle | 8 points — top, right, bottom, left, and 4 corners              |
| Ellipse   | 8 points — cardinal directions and 45° positions on the ellipse |
| Image     | 4 cardinal points (top, right, bottom, left)                    |
| Text      | 4 cardinal points (top, right, bottom, left)                    |

## 📖 API Reference

### Important: Multi-Instance Support

**ng-whiteboard** supports multiple independent whiteboard instances. When using `WhiteboardService`, you must specify which board you're working with:

```typescript
import { Component, AfterViewInit, inject } from '@angular/core';
import { NgWhiteboardService } from 'ng-whiteboard';

@Component({
  template: ` <ng-whiteboard [boardId]="boardId"></ng-whiteboard> `,
  providers: [NgWhiteboardService],
})
export class MyWhiteboardComponent implements AfterViewInit {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-unique-board-id';

  ngAfterViewInit() {
    // IMPORTANT: Set the active board before using service methods
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  clearBoard() {
    // Now this works on the correct board
    this.whiteboardService.clear();
  }
}
```

### `WhiteboardService` Methods

### 🔀 Multi-Instance Management

- **`setActiveBoard(boardId: string)`** Sets the specified board as active. All service operations will target this board.
- **`activeBoard()`** Returns the ID of the currently active board, or `null` if no board is active.
- **`clearActiveBoard()`** Clears the active board.
- **`getAllBoards()`** Returns an array of all registered board IDs.
- **`getBoardCount()`** Returns the total number of registered boards.
- **`hasBoard(boardId: string)`** Checks if a board with the specified ID exists.

### 📊 Reactive Signals (Active Board)

- **`elements: Signal<WhiteboardElement[]>`** Returns elements from the active board.
- **`elementsCount: Signal<number>`** Returns the number of elements on the active board.
- **`hasElements: Signal<boolean>`** Returns `true` if the active board has any elements.

### 📌 Element Management

- **`addElement(element: WhiteboardElement)`** Adds a new element (e.g., shape, text) to the whiteboard.
- **`addImage(image: string, x?: number, y?: number)`** Adds an image to the whiteboard at a specified position.
- **`removeElements(ids: string[])`** Removes elements from the whiteboard by IDs.
- **`updateElement(element: WhiteboardElement)`** Updates an existing element with new properties.
- **`updateSelectedElements(partialElement: Partial<WhiteboardElement>)`** Modifies only specific properties of the currently selected element.
- **`selectElements(elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[])`** Select element(s) on the whiteboard.
- **`deselectElement(elementOrId: WhiteboardElement | string)`** Deselects a specific element on the whiteboard.
- **`toggleSelection(elementOrId: WhiteboardElement | string)`** Toggle the selection of an element on the whiteboard.
- **`selectAll()`** Selects all elements currently present on the whiteboard.
- **`clearSelection()`** Clears any currently selected elements on the whiteboard.

### 🔄 State Management

- **`clear()`** Clears all elements from the whiteboard.
- **`undo()`** Reverts the last action.
- **`redo()`** Restores the last undone action.
- **`save(format = FormatType.Base64, name = 'New board')`** Saves the current whiteboard state in the specified format (e.g., Base64, JSON, SVG).

### 🖌 Drawing Tools & Interaction

- **`setActiveTool(tool: ToolType)`** Sets the current drawing tool (e.g., pen, eraser, shape).

### 🎨 Canvas Control

- **`setCanvasDimensions(width: number, height: number)`** Sets the width and height of the whiteboard canvas.
- **`setCanvasPosition(x: number, y: number)`** Moves the canvas to a specific position.
- **`centerCanvas()`** Centers the whiteboard canvas within the viewport.
- **`fullScreen()`** Toggles full-screen mode for the whiteboard.
- **`toggleGrid()`** Enables or disables the background grid for alignment.
- **`dispatchBatch(actions: WhiteboardAction[])`** Dispatches a batch of actions to the whiteboard.

### 📑 Layer Management

- **`bringToFront(elementOrId: WhiteboardElement | string)`** Brings the specified element to the front (highest z-index).
- **`bringForward(elementOrId: WhiteboardElement | string)`** Moves the element one layer forward.
- **`sendToBack(elementOrId: WhiteboardElement | string)`** Sends the specified element to the back (lowest z-index).
- **`sendBackward(elementOrId: WhiteboardElement | string)`** Moves the element one layer backward.
- **`setZIndex(elementOrId: WhiteboardElement | string, zIndex: number)`** Sets the exact z-index for an element.
- **`getZIndex(elementOrId: WhiteboardElement | string)`** Returns the current z-index of an element.

### ✂️ Clipboard Operations

- **`copy()`** Copies the currently selected elements to the clipboard.
- **`cut()`** Cuts the currently selected elements (copies and removes them).
- **`paste()`** Pastes elements from the clipboard at the current cursor position.
- **`duplicate()`** Duplicates the currently selected elements.

### 🔍 Viewport Control

- **`zoomIn()`** Increases the zoom level.
- **`zoomOut()`** Decreases the zoom level.
- **`setZoom(level: number)`** Sets the zoom level to a specific value.
- **`resetZoom()`** Resets the zoom level to 100%.
- **`pan(deltaX: number, deltaY: number)`** Pans the canvas by the specified offset.
- **`resetPan()`** Resets the canvas to its original position.

## ⌨️ Keyboard Shortcuts

The whiteboard supports comprehensive keyboard shortcuts for enhanced productivity:

### Selection & Editing

| Shortcut               | Action                      |
| ---------------------- | --------------------------- |
| `Ctrl/Cmd + A`         | Select all elements         |
| `Escape`               | Clear selection             |
| `Delete` / `Backspace` | Delete selected elements    |
| `Ctrl/Cmd + C`         | Copy selected elements      |
| `Ctrl/Cmd + X`         | Cut selected elements       |
| `Ctrl/Cmd + V`         | Paste elements              |
| `Ctrl/Cmd + D`         | Duplicate selected elements |

### Undo/Redo

| Shortcut                                | Action                  |
| --------------------------------------- | ----------------------- |
| `Ctrl/Cmd + Z`                          | Undo last action        |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo last undone action |

### Layer Management

| Shortcut               | Action         |
| ---------------------- | -------------- |
| `Ctrl/Cmd + Shift + ]` | Bring to front |
| `Ctrl/Cmd + ]`         | Bring forward  |
| `Ctrl/Cmd + Shift + [` | Send to back   |
| `Ctrl/Cmd + [`         | Send backward  |

### Tools

| Shortcut | Action          |
| -------- | --------------- |
| `V`      | Select tool     |
| `P`      | Pen tool        |
| `L`      | Line tool       |
| `R`      | Rectangle tool  |
| `E`      | Ellipse tool    |
| `A`      | Arrow tool      |
| `T`      | Text tool       |
| `I`      | Image tool      |
| `H`      | Hand tool (pan) |
| `D`      | Eraser tool     |

### Viewport

| Shortcut                        | Action                                  |
| ------------------------------- | --------------------------------------- |
| `Ctrl/Cmd + +` / `Ctrl/Cmd + =` | Zoom in                                 |
| `Ctrl/Cmd + -`                  | Zoom out                                |
| `Ctrl/Cmd + 0`                  | Reset zoom (100%)                       |
| `Space + Drag`                  | Pan canvas (when not in hand tool mode) |

### Modifiers

| Shortcut            | Action                                 |
| ------------------- | -------------------------------------- |
| `Shift + Drag`      | Constrain proportions (drawing shapes) |
| `Alt/Option + Drag` | Draw from center (shapes)              |
| `Ctrl/Cmd + Drag`   | Duplicate while dragging               |

> **Note:** `Ctrl` is used on Windows/Linux, `Cmd` (⌘) is used on macOS.

## 📋 Context Menu

Right-click on the canvas or elements to access the context menu with quick actions:

### Canvas Context Menu

- **Paste** - Paste copied elements
- **Select All** - Select all elements on canvas
- **Clear Canvas** - Remove all elements

### Element Context Menu

- **Cut** - Cut selected element(s)
- **Copy** - Copy selected element(s)
- **Paste** - Paste from clipboard
- **Duplicate** - Create a copy of selected element(s)
- **Delete** - Remove selected element(s)
- **Bring to Front** - Move to top layer
- **Bring Forward** - Move one layer up
- **Send to Back** - Move to bottom layer
- **Send Backward** - Move one layer down

The context menu is context-aware and shows relevant options based on the current selection and clipboard state.

## 📢 Whiteboard Events (Outputs)

The `NgWhiteboardComponent` emits the following events to notify about changes and interactions.

### 🟢 Lifecycle Events

- **`ready`** Emitted when the whiteboard is fully initialized and ready for use.
- **`destroyed`** Emitted when the whiteboard is destroyed, allowing for cleanup.

### ✏️ Drawing Events

- **`drawStart`** Triggered when a user starts drawing on the whiteboard.
- **`drawing`** Emitted continuously while the user is drawing.
- **`drawEnd`** Triggered when the user stops drawing.

### 🔄 State & Data Events

- **`undo`** Emitted when an undo action is performed.
- **`redo`** Emitted when a redo action is performed.
- **`clear`** Triggered when the whiteboard is cleared.
- **`dataChange`** Emitted when the whiteboard's internal data state changes.
- **`save`** Triggered when the whiteboard state is saved.

### 📌 Element Events

- **`elementsAdded`** Emitted when a new element is added to the whiteboard.
- **`elementsUpdated`** Triggered when an existing element is modified.
- **`elementsSelected`** Emitted when an element is selected.
- **`elementsDeleted`** Triggered when an element is removed.

### 🖼 Image Events

- **`imageAdded`** Emitted when an image is added to the whiteboard.

### 🛠 Configuration & Tool Events

- **`selectedToolChange`** Triggered when the active drawing tool is changed.
- **`configChanged`** Emitted when the whiteboard configuration settings are updated.

## 🤝 Contributing

We welcome contributions! Feel free to submit issues, feature requests, or pull requests.

## 📜 License

This project is licensed under the MIT License.
