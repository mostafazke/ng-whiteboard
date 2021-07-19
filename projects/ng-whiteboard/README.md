[![Build Status](https://travis-ci.org/mostafazke/ng-whiteboard.svg?branch=master)](https://travis-ci.org/mostafazke/ng-whiteboard) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# ng-whiteboard

## Lightweight angular whiteboard [Demo](https://mostafazke.github.io/ng-whiteboard/ 'ng-whiteboard Demo')

**Features:**

- Supports touch.
- Custom colors.
- Custom background colors. **Thanks to [Nader Magdy](https://github.com/nader-magdy 'Nader Magdy')**
- Custom background images.
- Custom stroke size.
- Save drawn as (svg | png | jpeg | base64) images.
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

| Name    | Description                     |
| ------- | ------------------------------- |
| (init)  | Fired on Component initialize   |
| (save)  | Fired on Saving, include base64 |
| (clear) | Fired on clearing               |
| (erase) | Fired on Cleaning               |
| (undo)  | Fired on undoing last draw      |
| (redo)  | Fired on Repainting last draw   |

## Methods

| Name     | ARGS                             | Defaults                             | Description             |
| -------- | -------------------------------- | ------------------------------------ | ----------------------- |
| save     | [format]: string, [name]: string | [format]: 'png', [name]: 'New image' | Save current board      |
| erase    | null                             | null                                 | Clean the whiteboard    |
| undo     | null                             | null                                 | Undo last line          |
| redo     | null                             | null                                 | Repaint last line       |
| addImage | image: (string; ArrayBuffer)     | null                                 | add images to the board |

to use these Methods inject NgWhiteboardService in your project

```typescript
import { NgWhiteboardService } from 'ng-whiteboard';
...

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
   styleUrls: ['./app.component.scss']
   ...
)}

  constructor(private whiteboardService: NgWhiteboardService) {
   this.whiteboardService.save();
  }

```

## Contributing

The project is open for contributors! Please file an issue or make a PR:)
