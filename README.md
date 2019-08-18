# ng-whiteboard

## Lightweight angular whiteboard [Demo](https://mostafazke.github.io/ng-whiteboard/ 'ng-whiteboard Demo')

**Features:**

- Supports touch.
- Custom colors.
- Custom background colors. **Suggested by [Nader Magdy](https://https://github.com/nader-magdy 'Nader Magdy')**
- Custom stroke size.
- Save drawn as png images

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

| Input               | Type                | Default                        | Required | Description                                                 |
| ------------------- | ------------------- | ------------------------------ | -------- | ----------------------------------------------------------- |
| [color]             | `string`            | `#000000`                      | no       | Set brush color |
| [backgroundColor]   | `string`            | `#ffffff`                      | no       | Set whiteboard background color |
| [size]              | `string`            | `5px`                          | no       | Set brush size |
| [linejoin]          | `string`            | `round`                        | no       | Define the shape of two lines when joined together ('miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs') |
| [linecap]           | `string`            | `round`                        | no       | Define start and end shape of line ('butt'                  | 'square' | 'round') |
| [whiteboardOptions] | `WhiteboardOptions` |                                | no       | Object of all inputs |
