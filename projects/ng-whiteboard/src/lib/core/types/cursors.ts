/** Standard CSS cursor types and custom SVG cursors for whiteboard tools. */
export enum CursorType {
  // Selection & Pointer
  Default = 'default',
  Pointer = 'pointer',
  None = 'none',
  ContextMenu = 'context-menu',
  Help = 'help',
  Progress = 'progress',
  Wait = 'wait',

  // Drawing & Interaction
  Crosshair = 'crosshair',
  Cell = 'cell',
  Text = 'text',
  VerticalText = 'vertical-text',

  // Drag & Move
  Grab = 'grab',
  Grabbing = 'grabbing',
  Move = 'move',
  AllScroll = 'all-scroll',

  // Resize (Directional)
  NResize = 'n-resize',
  SResize = 's-resize',
  EResize = 'e-resize',
  WResize = 'w-resize',
  NEResize = 'ne-resize',
  NWResize = 'nw-resize',
  SEResize = 'se-resize',
  SWResize = 'sw-resize',
  EWResize = 'ew-resize',
  NSResize = 'ns-resize',
  NESWResize = 'nesw-resize',
  NWSEResize = 'nwse-resize',

  // Action States
  Copy = 'copy',
  Alias = 'alias',
  NoDrop = 'no-drop',
  NotAllowed = 'not-allowed',

  // Zoom
  ZoomIn = 'zoom-in',
  ZoomOut = 'zoom-out',

  // Column & Row Resize
  ColResize = 'col-resize',
  RowResize = 'row-resize',

  // Custom SVG Cursors
  Pencil = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIgZD0ibTE2LjMxOCA2LjExLTMuNTM2LTMuNTM1IDEuNDE1LTEuNDE0Yy42My0uNjMgMi4wNzMtLjc1NSAyLjgyOCAwbC43MDcuNzA3Yy43NTUuNzU1LjYzMSAyLjE5OCAwIDIuODI5TDE2LjMxOCA2LjExem0tMS40MTQgMS40MTUtOS45IDkuOS00LjU5NiAxLjA2IDEuMDYtNC41OTYgOS45LTkuOSAzLjUzNiAzLjUzNnoiLz48L3N2Zz4=') 0 24, auto",
  Brush = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNNyAxNGMtMS42NiAwLTMgMS4zNC0zIDMgMCAxLjMxLTEuMTYgMi0yIDIgLjkyIDEuMjIgMi40OSAyIDQgMiAyLjIxIDAgNC0xLjc5IDQtNCAwLTEuNjYtMS4zNC0zLTMtM3ptMTMuNzEtOS4zN2wtMS4zNC0xLjM0YS45OTYuOTk2IDAgMCAwLTEuNDEgMEw5IDEyLjI1IDExLjc1IDE1bDguOTYtOC45NmEuOTk2Ljk5NiAwIDAgMCAwLTEuNDF6Ii8+PC9zdmc+') 0 24, auto",
  Eraser = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMTYuMjQgMy41Nmw0Ljk1IDQuOTRjLjc4Ljc5Ljc4IDIuMDUgMCAyLjg0TDEyIDIwLjUzYTQuMDA4IDQuMDA4IDAgMCAxLTUuNjYgMEwyLjgxIDE3Yy0uNzgtLjc5LS43OC0yLjA1IDAtMi44NGwxMC42LTEwLjZjLjc5LS43OCAyLjA1LS43OCAyLjgzIDBNNC4yMiAxNS41OGwzLjU0IDMuNTNjLjc4Ljc5IDIuMDQuNzkgMi44MyAwbDMuNTMtMy41My00Ljk1LTQuOTUtNC45NSA0Ljk1eiIvPjwvc3ZnPg==') 12 12, auto",
  Highlighter = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB4PSI0IiB5PSIxMCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjgiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0yIDIwaDIwdjNIMnoiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuOCIvPjwvc3ZnPg==') 12 24, auto",
  TextCursor = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNNSA0djNoNS41djEyaDNWN0gxOVY0SDV6Ii8+PC9zdmc+') 12 0, text",
  Shape = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==') 12 12, crosshair",
  Arrow = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMyAzbDcuMDcgMTYuOTcgMi41MS03LjM5IDcuMzktMi41MUwzIDN6Ii8+PC9zdmc+') 0 0, default",
  Hand = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMTMgNnY1aDNMMTIgMTdsLTQtNmgzVjZjMC0xLjEuOS0yIDItMnMyIC5IDIgMnptOCAwdjVoLTJWNmMwLTIuMjEtMS43OS00LTQtNGgtMkMxMC43OSAyIDkgMy43OSA5IDZ2NUg3VjZjMC0zLjMxIDIuNjktNiA2LTZoMmMzLjMxIDAgNiAyLjY5IDYgNnoiLz48L3N2Zz4=') 12 12, grab",
  Rotate = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMTIgNnYzbDQtNC00LTR2M2MtNC40MiAwLTggMy41OC04IDggMCAxLjU3LjQ2IDMuMDMgMS4yNCA0LjI2TDYuNyAxNC44Yy0uNDUtLjgzLS43LTEuNzktLjctMi44IDAtMy4zMSAyLjY5LTYgNi02em02Ljc2IDEuNzRMMTcuMyA5LjJjLjQ0Ljg0LjcgMS43OS43IDIuOCAwIDMuMzEtMi42OSA2LTYgNnYtM2wtNCA0IDQgNHYtM2M0LjQyIDAgOC0zLjU4IDgtOCAwLTEuNTctLjQ2LTMuMDMtMS4yNC00LjI2eiIvPjwvc3ZnPg==') 12 12, grab",
  Eyedropper = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMjAuNzEgNS42M2wtMi4zNC0yLjM0Yy0uMzktLjM5LTEuMDItLjM5LTEuNDEgMGwtMy4xMiAzLjEyLTEuOTMtMS45MS0xLjQxIDEuNDEgMS40MiAxLjQyTDMgMTYuMjVWMjFoNC43NWw4LjkyLTguOTIgMS40MiAxLjQyIDEuNDEtMS40MS0xLjkyLTEuOTIgMy4xMy0zLjEyYy4zOS0uMzkuMzktMS4wMiAwLTEuNDJ6Ii8+PC9zdmc+') 0 24, crosshair",
  LaserPointer = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiBmaWxsPSIjMDAwIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI2IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+') 12 12, none",
  Image = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiIGZpbGw9IiMwMDAiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNSA5IDkgMTUgNiAxMiAzIDE1IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==') 12 12, crosshair",
  Dot = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIyIiBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==') 10 10, crosshair",
  Plus = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMTkgMTNoLTZ2NmgtMnYtNkg1di0yaDZWNWgydjZoNnYyeiIvPjwvc3ZnPg==') 12 12, crosshair",
  Line = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48bGluZSB4MT0iMyIgeTE9IjIxIiB4Mj0iMjEiIHkyPSIzIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGNpcmNsZSBjeD0iMyIgY3k9IjIxIiByPSIyIiBmaWxsPSIjMDAwIi8+PGNpcmNsZSBjeD0iMjEiIGN5PSIzIiByPSIyIiBmaWxsPSIjMDAwIi8+PC9zdmc+') 12 12, crosshair",
}
