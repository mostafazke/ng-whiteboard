[![Build Status](https://travis-ci.org/mostafazke/ng-whiteboard.svg?branch=master)](https://travis-ci.org/mostafazke/ng-whiteboard) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# ng-whiteboard

## Lightweight angular whiteboard [Demo](https://mostafazke.github.io/ng-whiteboard/ 'ng-whiteboard Demo')

**Features:**

- Supports touch.
- Custom colors.
- Custom background colors. **Thanks to [Nader Magdy](https://github.com/nader-magdy 'Nader Magdy')**
- Custom background images.
- Custom stroke size.
- Save drawn as png images.
- Experimental (undo-redo).

**_And more to come_...**

# Install

1. Install npm module:

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

3. Insert the Whiteboard Component in the html file.

   ```html
   <ng-whiteboard></ng-whiteboard>
   ```

## Options

| Input               | Type                | Default   | Required | Description                                                                                              |
| ------------------- | ------------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| [color]             | `string`            | `#000000` | no       | Set brush color                                                                                          |
| [backgroundColor]   | `string`            | `#ffffff` | no       | Set whiteboard background color                                                                          |
| [backgroundImage]   | `url`               |           | no       | Set whiteboard background Image                                                                          |
| [size]              | `string`            | `5px`     | no       | Set brush size                                                                                           |
| [linejoin]          | `string`            | `round`   | no       | Define the shape of two lines when joined together ('miter' , 'round' , 'bevel' , 'miter-clip' , 'arcs') |
| [linecap]           | `string`            | `round`   | no       | Define start and end shape of line ('butt', 'square' , 'round')                                          |
| [whiteboardOptions] | `WhiteboardOptions` |           | no       | Object of all inputs                                                                                     |

## Methods

| Name  | Description               |
| ----- | ------------------------- |
| save  | Save current board in png |
| erase | Clean the whiteboard      |
| undo  | Undo last line            |
| redo  | Repaint last line         |

## Contributing

The project is open for contributors! Please file an issue or make a PR:)
