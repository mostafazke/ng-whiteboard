import { dataUrlToBytes } from '../files/board-data';

export function canCopyImage(): boolean {
  return !!navigator.clipboard?.write && typeof ClipboardItem !== 'undefined';
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const mime = /data:([^;]+)/.exec(dataUrl)?.[1] ?? 'application/octet-stream';
  return new Blob([dataUrlToBytes(dataUrl)], { type: mime });
}
