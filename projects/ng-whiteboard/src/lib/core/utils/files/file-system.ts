export interface BoardFileHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }>;
}

interface PickerType {
  description: string;
  accept: Record<string, string[]>;
}

interface FileSystemAccessWindow {
  showSaveFilePicker?: (options: { suggestedName?: string; types?: PickerType[] }) => Promise<BoardFileHandle>;
  showOpenFilePicker?: (options: { types?: PickerType[]; multiple?: boolean }) => Promise<BoardFileHandle[]>;
}

const BOARD_TYPE: PickerType = { description: 'Whiteboard', accept: { 'application/json': ['.json'] } };
const OPEN_TYPES: PickerType[] = [
  {
    description: 'Whiteboard or exported image',
    accept: { 'application/json': ['.json'], 'image/png': ['.png'], 'image/svg+xml': ['.svg'] },
  },
];

function api(win: Window | null | undefined): FileSystemAccessWindow | null | undefined {
  return win as unknown as FileSystemAccessWindow | null | undefined;
}

/** True where the browser can write back to a file the user picked (Chromium today). */
export function supportsFileSystemAccess(win: Window | null | undefined): boolean {
  const w = api(win);
  return typeof w?.showSaveFilePicker === 'function' && typeof w?.showOpenFilePicker === 'function';
}

export function isPickerAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function pickBoardSaveFile(
  win: Window | null | undefined,
  suggestedName: string
): Promise<BoardFileHandle> {
  const picker = api(win)?.showSaveFilePicker;
  if (!picker) throw new Error('File System Access is not supported');
  return picker.call(win, { suggestedName: `${suggestedName}.json`, types: [BOARD_TYPE] });
}

export async function pickBoardOpenFile(win: Window | null | undefined): Promise<BoardFileHandle> {
  const picker = api(win)?.showOpenFilePicker;
  if (!picker) throw new Error('File System Access is not supported');
  const [handle] = await picker.call(win, { types: OPEN_TYPES, multiple: false });
  return handle;
}

export async function writeBoardFile(handle: BoardFileHandle, contents: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(new Blob([contents], { type: 'application/json' }));
  await writable.close();
}
