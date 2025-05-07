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
- 📏 **Undo/Redo, Zoom, and Save functionalities**
- 🖊️ **Multiple drawing tools** (pen, shapes, text, etc.)
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

| Input               | Type                  | Default          | Description                                                             |
| ------------------- | --------------------- | ---------------- | ----------------------------------------------------------------------- |
| `[data]`            | `WhiteboardElement[]` | `[]`             | The whiteboard data                                                     |
| `[options]`         | `WhiteboardOptions`   | `null`           | Component configuration object, properties described below              |
| `[drawingEnabled]`  | `boolean`             | `true`           | Enable mouse/touch interactions                                         |
| `[selectedTool]`    | `ToolType`            | `ToolType.Pen`   | The current selected tool                                               |
| `[canvasWidth]`     | `number`              | `800`            | The width of whiteboard canvas                                          |
| `[canvasHeight]`    | `number`              | `600`            | The height of whiteboard canvas                                         |
| `[fullScreen]`      | `boolean`             | `true`           | If true, change (canvasWidth, canvasHeight) to fit the parent container |
| `[strokeColor]`     | `string`              | `#333333`        | The default stroke color                                                |
| `[backgroundColor]` | `string`              | `#F8F9FA`        | The default background color                                            |
| `[fill]`            | `string`              | `transparent`    | The default fill color                                                  |
| `[strokeWidth]`     | `number`              | `2`              | The default stroke width                                                |
| `[zoom]`            | `number`              | `1`              | Zoom level                                                              |
| `[fontFamily]`      | `string`              | `sans-serif`     | The default font family                                                 |
| `[fontSize]`        | `number`              | `24`             | The default font size                                                   |
| `[center]`          | `boolean`             | `true`           | Center the canvas in parent component, works with `fullScreen: false`   |
| `[x]`               | `number`              | `0`              | If `center` is false, set the X axis                                    |
| `[y]`               | `number`              | `0`              | If `center` is false, set the Y axis                                    |
| `[enableGrid]`      | `boolean`             | `false`          | Enable the grid pattern                                                 |
| `[gridSize]`        | `number`              | `10`             | Set the grid inner boxes size                                           |
| `[snapToGrid]`      | `boolean`             | `false`          | Enable snapping to grid                                                 |
| `[lineJoin]`        | `LineJoin`            | `LineJoin.Miter` | The default Line join                                                   |
| `[lineCap]`         | `LineCap`             | `LineCap.Butt`   | The default Line cap                                                    |
| `[dasharray]`       | `string`              | `''`             | The default dash-array                                                  |
| `[dashoffset]`      | `number`              | `0`              | The default dash-offset                                                 |

## 📖 API Reference

### `WhiteboardService` Methods

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
