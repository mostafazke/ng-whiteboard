# ng-whiteboard

## Lightweight angular whiteboard [Demo](https://mostafazke.github.io/ng-whiteboard/ 'ng-whiteboard Demo')

#

**Features:**<br/>

- Supports touch.
- Custom colors.
- Custom stroke size.
- Save drawn as png images

# Install

1. Install d3 dependency:

   ```bash
   npm install d3 --save
   ```

2. Install save-svg-as-png dependency:

   ```bash
   npm install save-svg-as-png --save
   ```

3. Install npm module:

   ```bash
   npm install ng-whiteboard --save
   ```

4. Add the module to your project

```typescript
@NgModule({
    imports: [
        NgWhiteboardModule
    ]
    ...
)}
```

5. Insert the Whiteboard Component in the html file.

```html
<ng-whiteboard></ng-whiteboard>
```

## Options

| Input               | Type                | Default                        | Required | Description                                                 |
| ------------------- | ------------------- | ------------------------------ | -------- | ----------------------------------------------------------- |
| [color]             | `string`            | `#333333`                      | no       | Set brush color                                             |
| [size]              | `string`            | `5px`                          | no       | Set brush size                                              |
| [linejoin]          | `string`            | `round`                        | no       | Define the shape of two lines when joined together ('miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs') |
| [linecap]           | `string`            | `round`                        | no       | Define start and end shape of line ('butt'                  | 'square' | 'round') |
| [whiteboardOptions] | `WhiteboardOptions` | `` | no | Object of all inputs |
