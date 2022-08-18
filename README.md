<p align="center">
  <img height="256px" width="256px" style="text-align: center;" src="https://cdn.jsdelivr.net/gh/mostafazke/ng-whiteboard@development/projects/demo/src/assets/icons/icon-512x512.png">
</p>

# <center>ng-whiteboard</center>

## <center>Lightweight angular whiteboard</center>

[![Build Status](https://app.travis-ci.com/mostafazke/ng-whiteboard.svg?branch=master)](https://app.travis-ci.com/mostafazke/ng-whiteboard)
[![npm version](https://badge.fury.io/js/ng-whiteboard.svg)](https://badge.fury.io/js/ng-whiteboard) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/ng-whiteboard.svg)](https://www.npmjs.com/package/ng-whiteboard)
[![Known Vulnerabilities](https://snyk.io/test/github/mostafazke/ng-whiteboard/badge.svg)](https://www.npmjs.com/package/ng-whiteboard)

## Demo

https://mostafazke.github.io/ng-whiteboard

## Features

- Supports touch.
- Highly Customizable.
- Lightweight.
- Easy to use.
- Custom colors.
- Custom background colors.
- (Brush | Image | Line | Rect | Ellipse | Text | Eraser) Tools.
- Custom stroke size.
- Save drawn as (svg | png | jpeg | base64) images.
- Undo - Redo.

**_And more to come_...**

## Installation

1. Install `ng-whiteboard` via:

   ```bash
   yarn add ng-whiteboard --save
   ```

   or

   ```bash
   npm install ng-whiteboard --save
   ```

2. Add the module to your project

   ```typescript
   import { NgWhiteboardModule } from 'ng-whiteboard';
   ...

   @NgModule({
       imports: [
           ...
           NgWhiteboardModule
       ]
       ...
   )}
   ```

3. Insert the Whiteboard Component element in the html.

   ```html
   <ng-whiteboard></ng-whiteboard>
   ```

## Options

| Input             | Type                                                                                     | Default         | Description                                                         |
| ----------------- | ---------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| [data]            | [[WhiteboardElement](projects\ng-whiteboard\src\lib\models\whiteboard-element.model.ts)] | []              | The whiteboard data                                                 |
| [options]         | [WhiteboardOptions](projects\ng-whiteboard\src\lib\models\whiteboard-options.model.ts)   | null            | component configuration object, properties described below          |
| [drawingEnabled]  | boolean                                                                                  | true            | Enable mouse/touch interactions                                     |
| [selectedTool]    | ToolsEnum                                                                                | ToolsEnum.BRUSH | The current selected tool                                           |
| [canvasWidth]     | number                                                                                   | 800             | The width of whiteboard canvas                                      |
| [canvasHeight]    | number                                                                                   | 600             | The height of whiteboard canvas                                     |
| [fullScreen]      | boolean                                                                                  | true            | if true change (canvasWidth, canvasHeight) to fit the parentainer   |
| [strokeColor]     | string                                                                                   | #000000         | The default stroke color                                            |
| [backgroundColor] | string                                                                                   | #FFFFFF         | The default background color                                        |
| [fill]            | string                                                                                   | #333333         | The default fill color                                              |
| [strokeWidth]     | number                                                                                   | 2               | The default stroke width                                            |
| [zoom]            | number                                                                                   | 1               | Zoom level                                                          |
| [fontFamily]      | string                                                                                   | sans-serif      | The default font family                                             |
| [fontSize]        | number                                                                                   | 24              | The default font size                                               |
| [center]          | boolean                                                                                  | true            | Center the canvas in parent component, works with fullScreen: false |
| [x]               | number                                                                                   | 0               | if center is false, set the X axis                                  |
| [y]               | number                                                                                   | 0               | if center is false, set the Y axis                                  |
| [enableGrid]      | boolean                                                                                  | false           | Enable the grid pattern                                             |
| [gridSize]        | number                                                                                   | 10              | Set the grid inner boxes size                                       |
| [snapToGrid]      | boolean                                                                                  | false           | Enable snaping to grid                                              |
| [lineJoin]        | LineJoinEnum .ROUND                                                                      | LineJoinEnum    | The default Line join                                               |
| [lineCap]         | LineCapEnum .ROUND                                                                       | LineCapEnum     | The default Line cap                                                |
| [dasharray]       | string                                                                                   | ''              | The default dash-array                                              |
| [dashoffset]      | number                                                                                   | 0               | The default dash-offset                                             |

## Outputs

| Name            | Description                                      | Arguments                |
| --------------- | ------------------------------------------------ | ------------------------ |
| (ready)         | Emitted when the component is ready              | None                     |
| (dataChange)    | Emitted when the data is changed                 | WhiteboardElement[]      |
| (clear)         | Emitted when the canvas is cleared               | None                     |
| (undo)          | Emitted when the user undo an action             | None                     |
| (redo)          | Emitted when the user redo an action             | None                     |
| (imageAdded)    | Emitted when the user add an image to the canvas | None                     |
| (save)          | Emitted when the user save the canvas            | base64 image             |
| (selectElement) | Emitted when the user select/deselect an element | WhiteboardElement / null |
| (deleteElement) | Emitted when the user delete an element          | WhiteboardElement        |
| (toolChanged)   | Emitted when the user change the tool            | ToolsEnum                |

## Methods

| Name     | Description             | Arguments                        | Defaults                                |
| -------- | ----------------------- | -------------------------------- | --------------------------------------- |
| save     | Save the current board  | [format]: string, [name]: string | [format]: 'base64', [name]: 'New board' |
| addImage | Add images to the board | image: (string; ArrayBuffer)     | None                                    |
| erase    | Clean the whiteboard    | None                             | None                                    |
| undo     | Undo last action        | None                             | None                                    |
| redo     | Redo last action        | None                             | None                                    |

to use these Methods inject NgWhiteboardService in your project

```typescript
import { NgWhiteboardService, FormatType } from 'ng-whiteboard';
...

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
   styleUrls: ['./app.component.scss']
   ...
)}

  constructor(private whiteboardService: NgWhiteboardService) {
   this.whiteboardService.save(FormatType.Base64);
  }

```

## Contributing

The project is open for contributors! Please file an issue or make a PR:)
