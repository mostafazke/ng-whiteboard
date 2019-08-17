# ng-whiteboard


## Lightweight angular whiteboard

#
**Features:**<br/>
- Supports touch.
- Custom colors.
- Custom stroke size.
- Save drawn as png images

# Install

1. Install npm module:

    ```bash
    npm install ng-whiteboard --save
    ```
2. Add the module to your project

```typescript
@NgModule({
    imports: [
        NgWhiteboardModule
    ]
    ...
)}
```


In the html file, you can insert the Whiteboard Component

```html
    <ng-whiteboard></ng-whiteboard>
```

If there is too much overhead with inputs, you can just specify the [options] input, and specify the options from the typescript code

Example:
```html
<canvas-whiteboard #canvasWhiteboard
                   [options]="canvasOptions"
                   (onBatchUpdate)="onCanvasDraw($event)"
                   (onClear)="onCanvasClear()"
                   (onUndo)="onCanvasUndo($event)"
                   (onRedo)="onCanvasRedo($event)">
</canvas-whiteboard>
```


## Options
| Input  | Type | Default | Required | Description |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| [color] | `string` |  `#333333` | no | Set brush color |
| [size] | `string` |  `5px` | no | Set brush size |
| [linejoin] | `string` |  `round` | no | Define the shape of two lines when joined together ('miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs') |
| [linecap] | `string` |  `round` | no | Define start and end shape of line ('butt' | 'square' | 'round') |
| [whiteboardOptions] | `WhiteboardOptions` |  `` | no | Object of all inputs |