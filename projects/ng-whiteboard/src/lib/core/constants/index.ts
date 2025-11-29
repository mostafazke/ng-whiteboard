export const SELECTOR_GROUP_ID = 'selectorGroup';
export const SVG_ROOT_ID = 'svgroot';
export const ITEM_PREFIX = 'item_';
export const SELECTOR_BOX = 'selectorBox';
export const SELECTOR_GRIP_PREFIX = 'selectorGrip_';
export const SELECTOR_GRIP_RESIZE = 'selectorGrip_resize';
export const SELECTOR_GRIP_ROTATE = 'selectorGrip_rotate';
export const MAX_STACK_SIZE = 1000;
export const DATA_ID = 'data-wb-id';

export const PRIORITY_WEIGHTS = {
  high: 3,
  normal: 2,
  low: 1,
};

export const ZOOM_STEP = 0.25;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;
export const DEFAULT_ZOOM = 1.0;

export const PAN_SENSITIVITY = 0.5;

export const MOUSE_BUTTON = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
} as const;

export const TEMPORARY_TOOL_ID = {
  PAN_MIDDLE: 'pan-middle',
  PAN_SPACE: 'pan-space',
} as const;

export const MIME_TYPE = {
  HTML: 'text/html',
  PLAIN: 'text/plain',
  JSON: 'application/json',
} as const;

export const DROP_EFFECT = {
  COPY: 'copy',
} as const;

export const KEY = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: 'Space',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
} as const;

export const KEY_LOWER = {
  ESCAPE: 'escape',
  ENTER: 'enter',
  SPACE: 'space',
  DELETE: 'delete',
  BACKSPACE: 'backspace',
  ARROW_UP: 'arrowup',
  ARROW_DOWN: 'arrowdown',
  ARROW_LEFT: 'arrowleft',
  ARROW_RIGHT: 'arrowright',
  TAB: 'tab',
} as const;

export const FILE_TYPE_PREFIX = {
  IMAGE: 'image/',
} as const;

export const MOVEMENT = {
  SMALL_STEP: 1,
  LARGE_STEP: 10,
} as const;
