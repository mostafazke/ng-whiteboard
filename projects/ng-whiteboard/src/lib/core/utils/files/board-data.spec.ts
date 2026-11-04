import {
  boardFileKind,
  bytesToDataUrl,
  crc32,
  dataUrlToBytes,
  embedBoardDataInPng,
  embedBoardDataInSvg,
  readBoardDataFromFile,
  readBoardDataFromPng,
  readBoardDataFromSvg,
} from './board-data';

// 1×1 transparent PNG.
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const JSON_DATA = JSON.stringify({ elements: [{ id: 'a', text: 'héllo ✓ 你好' }] });

function chunkTypes(bytes: Uint8Array): string[] {
  const types: string[] = [];
  let offset = 8;
  while (offset < bytes.length) {
    const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    types.push(String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)));
    offset += 12 + length;
  }
  return types;
}

describe('board data in PNG', () => {
  it('round-trips unicode JSON through a tEXt chunk placed after IHDR', () => {
    const png = embedBoardDataInPng(dataUrlToBytes(PNG_1X1), JSON_DATA);
    expect(chunkTypes(png)).toEqual(['IHDR', 'tEXt', 'IDAT', 'IEND']);
    expect(readBoardDataFromPng(png)).toBe(JSON_DATA);
  });

  it('writes the standard CRC-32 over the new chunk type and data', () => {
    expect(crc32(new TextEncoder().encode('IEND'))).toBe(0xae426082);
    const png = embedBoardDataInPng(dataUrlToBytes(PNG_1X1), '{}');
    const start = 8 + 25;
    const length = ((png[start] << 24) | (png[start + 1] << 16) | (png[start + 2] << 8) | png[start + 3]) >>> 0;
    const crcAt = start + 8 + length;
    const stored = ((png[crcAt] << 24) | (png[crcAt + 1] << 16) | (png[crcAt + 2] << 8) | png[crcAt + 3]) >>> 0;
    expect(stored).toBe(crc32(png.subarray(start + 4, crcAt)));
  });

  it('returns null for a PNG without board data or for non-PNG bytes', () => {
    expect(readBoardDataFromPng(dataUrlToBytes(PNG_1X1))).toBeNull();
    expect(readBoardDataFromPng(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it('refuses to embed into non-PNG bytes', () => {
    expect(() => embedBoardDataInPng(new Uint8Array([1, 2, 3]), '{}')).toThrow('Not a PNG image');
  });

  it('keeps the image bytes convertible back to a data URL', () => {
    const png = embedBoardDataInPng(dataUrlToBytes(PNG_1X1), JSON_DATA);
    const url = bytesToDataUrl(png, 'image/png');
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    expect(readBoardDataFromPng(dataUrlToBytes(url))).toBe(JSON_DATA);
  });
});

describe('board data in SVG', () => {
  const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="5" height="5"/></svg>';

  it('round-trips JSON with markup characters through <metadata>', () => {
    const json = JSON.stringify({ elements: [{ text: '<b>&amp; "x"</b>' }] });
    const out = embedBoardDataInSvg(SVG, json);
    expect(out).toContain('<metadata>');
    expect(out).toContain('<rect');
    expect(readBoardDataFromSvg(out)).toBe(json);
  });

  it('returns null when the SVG has no board data', () => {
    expect(readBoardDataFromSvg(SVG)).toBeNull();
  });
});

describe('boardFileKind', () => {
  it.each([
    [{ name: 'a.json', type: '' }, 'json'],
    [{ name: 'a', type: 'application/json' }, 'json'],
    [{ name: 'a.PNG', type: '' }, 'png'],
    [{ name: 'a', type: 'image/png' }, 'png'],
    [{ name: 'a.svg', type: '' }, 'svg'],
    [{ name: 'a.txt', type: 'text/plain' }, null],
    [{ name: 'a.jpg', type: 'image/jpeg' }, null],
  ])('%o → %s', (file, kind) => {
    expect(boardFileKind(file)).toBe(kind);
  });
});

describe('readBoardDataFromFile', () => {
  it('reads JSON, PNG and SVG files', async () => {
    const png = embedBoardDataInPng(dataUrlToBytes(PNG_1X1), JSON_DATA);
    const svg = embedBoardDataInSvg('<svg xmlns="http://www.w3.org/2000/svg"/>', JSON_DATA);
    await expect(readBoardDataFromFile(new File([JSON_DATA], 'b.json'))).resolves.toBe(JSON_DATA);
    await expect(readBoardDataFromFile(new File([png], 'b.png', { type: 'image/png' }))).resolves.toBe(JSON_DATA);
    await expect(readBoardDataFromFile(new File([svg], 'b.svg', { type: 'image/svg+xml' }))).resolves.toBe(JSON_DATA);
  });

  it('returns null for unsupported files', async () => {
    await expect(readBoardDataFromFile(new File(['x'], 'b.txt', { type: 'text/plain' }))).resolves.toBeNull();
  });
});
