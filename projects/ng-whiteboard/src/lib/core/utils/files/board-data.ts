export const BOARD_DATA_KEY = 'ng-whiteboard';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const SVG_NS = 'http://www.w3.org/2000/svg';

let crcTable: Uint32Array | null = null;

export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64Utf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function isPng(bytes: Uint8Array): boolean {
  return bytes.length > 8 && PNG_SIGNATURE.every((value, i) => bytes[i] === value);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value >>> 24;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

/** Inserts a `tEXt` chunk (keyword `ng-whiteboard`, base64 UTF-8 JSON) right after the PNG header chunk. */
export function embedBoardDataInPng(png: Uint8Array, json: string): Uint8Array {
  if (!isPng(png)) throw new Error('Not a PNG image');
  const ihdrEnd = 8 + 12 + readUint32(png, 8);
  const payload = new TextEncoder().encode(`${BOARD_DATA_KEY}\0${toBase64Utf8(json)}`);
  const chunk = new Uint8Array(12 + payload.length);
  writeUint32(chunk, 0, payload.length);
  chunk.set([116, 69, 88, 116], 4);
  chunk.set(payload, 8);
  writeUint32(chunk, 8 + payload.length, crc32(chunk.subarray(4, 8 + payload.length)));

  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(png.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}

export function readBoardDataFromPng(png: Uint8Array): string | null {
  if (!isPng(png)) return null;
  const prefix = `${BOARD_DATA_KEY}\0`;
  let offset = 8;
  while (offset + 12 <= png.length) {
    const length = readUint32(png, offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type === 'IEND') break;
    if (type === 'tEXt') {
      const text = new TextDecoder('latin1').decode(png.subarray(offset + 8, offset + 8 + length));
      if (text.startsWith(prefix)) {
        try {
          return fromBase64Utf8(text.slice(prefix.length));
        } catch {
          return null;
        }
      }
    }
    offset += 12 + length;
  }
  return null;
}

/** Adds `<metadata><ng-whiteboard>json</ng-whiteboard></metadata>` as the SVG root's first child. */
export function embedBoardDataInSvg(svg: string, json: string): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') throw new Error('Not an SVG image');
  const metadata = doc.createElementNS(SVG_NS, 'metadata');
  const holder = doc.createElementNS(SVG_NS, BOARD_DATA_KEY);
  holder.textContent = json;
  metadata.appendChild(holder);
  root.insertBefore(metadata, root.firstChild);
  return new XMLSerializer().serializeToString(doc);
}

export function readBoardDataFromSvg(svg: string): string | null {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.documentElement.nodeName !== 'svg') return null;
  const holder = doc.getElementsByTagName(BOARD_DATA_KEY)[0];
  return holder?.textContent || null;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(binary)}`;
}

export type BoardFileKind = 'json' | 'png' | 'svg';

export function boardFileKind(file: Pick<File, 'name' | 'type'>): BoardFileKind | null {
  const name = file.name.toLowerCase();
  if (file.type.includes('json') || name.endsWith('.json')) return 'json';
  if (file.type === 'image/png' || name.endsWith('.png')) return 'png';
  if (file.type === 'image/svg+xml' || name.endsWith('.svg')) return 'svg';
  return null;
}

function readFile(file: Blob, as: 'text' | 'buffer'): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (reader.result === null ? reject(new Error('Failed to read file')) : resolve(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    if (as === 'text') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

/** Reads the board JSON from a `.json` file, or from a PNG/SVG exported with board data. */
export async function readBoardDataFromFile(file: File): Promise<string | null> {
  const kind = boardFileKind(file);
  if (kind === 'json') return (await readFile(file, 'text')) as string;
  if (kind === 'svg') return readBoardDataFromSvg((await readFile(file, 'text')) as string);
  if (kind === 'png') return readBoardDataFromPng(new Uint8Array((await readFile(file, 'buffer')) as ArrayBuffer));
  return null;
}
