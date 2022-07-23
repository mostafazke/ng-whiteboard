<p align="center">
  <img height="256px" width="256px" style="text-align: center;" src="https://cdn.jsdelivr.net/gh/mostafazke/ng-whiteboard@development/projects/demo/src/assets/icons/icon-512x512.png">
</p>

# <center>ng-whiteboard</center>

##   <center>Lightweight angular whiteboard</center>

[![Build Status](https://app.travis-ci.com/mostafazke/ng-whiteboard.svg?branch=master)](https://app.travis-ci.com/mostafazke/ng-whiteboard)
[![npm version](https://badge.fury.io/js/ng-whiteboard.svg)](https://badge.fury.io/js/ng-whiteboard) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Demo

A demonstrative example at https://mostafazke.github.io/ng-whiteboard

## Features

- Supports touch.
- Custom colors.
- Custom background colors.
- Custom background images.
- Custom stroke size.
- Save drawn as (svg | png | jpeg | base64) images.
- Experimental (undo-redo).

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

| Input               | Type                | Default   | Required | Description                                                                                              |
| ------------------- | ------------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| [color]             | `string`            | `#000000` | no       | Set brush color                                                                                          |
| [backgroundColor]   | `string`            | `#ffffff` | no       | Set whiteboard background color                                                                          |
| [size]              | `string`            | `5px`     | no       | Set brush size                                                                                           |
| [linejoin]          | `string`            | `round`   | no       | Define the shape of two lines when joined together ('miter' , 'round' , 'bevel' , 'miter-clip' , 'arcs') |
| [linecap]           | `string`            | `round`   | no       | Define start and end shape of line ('butt', 'square' , 'round')                                          |
| [whiteboardOptions] | `WhiteboardOptions` |           | no       | Object of all inputs                                                                                     |

## Outputs

| Name    | Description                      |
| ------- | -------------------------------- |
| (init)  | Fired on Component initialize    |
| (save)  | Fired on Saving, "return base64" |
| (clear) | Fired on clearing                |
| (erase) | Fired on Cleaning                |
| (undo)  | Fired on undoing last draw       |
| (redo)  | Fired on Repainting last draw    |

## Methods

| Name     | ARGS                             | Defaults                                | Description             |
| -------- | -------------------------------- | --------------------------------------- | ----------------------- |
| save     | [format]: string, [name]: string | [format]: 'base64', [name]: 'New board' | Save current board      |
| erase    | null                             | null                                    | Clean the whiteboard    |
| undo     | null                             | null                                    | Undo last line          |
| redo     | null                             | null                                    | Repaint last line       |
| addImage | image: (string; ArrayBuffer)     | null                                    | add images to the board |

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
