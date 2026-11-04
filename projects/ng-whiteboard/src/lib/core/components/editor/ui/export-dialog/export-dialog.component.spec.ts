import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormatType } from '../../../../types';
import { EditorStateService, ExportSettings } from '../../editor-state.service';
import { ExportDialogComponent } from './export-dialog.component';

@Component({
  standalone: true,
  imports: [ExportDialogComponent],
  template: `<wb-export-dialog
    [hasSelection]="hasSelection()"
    [title]="title()"
    (closed)="closedCount = closedCount + 1"
  />`,
})
class HostComponent {
  hasSelection = signal(false);
  title = signal('Sprint');
  closedCount = 0;
}

describe('ExportDialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const exportSettings = signal<ExportSettings>({ format: 'png', scale: 2, background: true, embedBoardData: true });
  const state = {
    exportSettings,
    renderExport: jest.fn(),
    exportImage: jest.fn(),
    copyImage: jest.fn(),
  };
  const defaultOptions = { scale: 2, background: true, padding: 16, onlySelected: false };

  const el = () => fixture.nativeElement as HTMLElement;
  const q = <T extends HTMLElement>(sel: string) => el().querySelector<T>(sel);
  const radio = (group: string, label: string) =>
    Array.from(el().querySelectorAll<HTMLElement>(`[aria-label="${group}"] [role="radio"]`)).find(
      (b) => b.textContent?.trim() === label
    ) as HTMLElement;
  const flush = async (ms = 200) => {
    fixture.detectChanges();
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  };

  const create = async (setup?: (h: HostComponent) => void) => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    setup?.(host);
    fixture.detectChanges();
    await flush();
  };

  const setClipboard = (value: unknown) => Object.defineProperty(navigator, 'clipboard', { value, configurable: true });

  beforeEach(() => {
    jest.useFakeTimers();
    exportSettings.set({ format: 'png', scale: 2, background: true, embedBoardData: true });
    state.renderExport.mockReset().mockResolvedValue({ dataUrl: 'data:image/png;base64,AAA', width: 10, height: 10 });
    state.exportImage.mockReset().mockResolvedValue(true);
    state.copyImage.mockReset().mockResolvedValue(true);
    setClipboard(undefined);
    TestBed.configureTestingModule({ providers: [{ provide: EditorStateService, useValue: state }] });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (globalThis as { ClipboardItem?: unknown }).ClipboardItem;
  });

  it('shows the rendered export as the preview image', async () => {
    await create();
    expect(q<HTMLImageElement>('img.wb-export-preview-img')?.src).toBe('data:image/png;base64,AAA');
    expect(state.renderExport).toHaveBeenCalledWith(FormatType.Png, { ...defaultOptions, scale: 1 });
  });

  it('shows a checkerboard when the background is off', async () => {
    await create();
    expect(q('.wb-export-preview')?.classList).not.toContain('is-transparent');
    q<HTMLElement>('[role="switch"][aria-label="Background"]')?.click();
    await flush();
    expect(q('.wb-export-preview')?.classList).toContain('is-transparent');
  });

  it('debounces re-rendering when options change, and renders the preview at scale 1', async () => {
    await create();
    state.renderExport.mockClear();
    q<HTMLElement>('[role="switch"][aria-label="Background"]')?.click();
    fixture.detectChanges();
    radio('Scale', '3×').click();
    fixture.detectChanges();
    q<HTMLElement>('[role="switch"][aria-label="Background"]')?.click();
    fixture.detectChanges();
    jest.advanceTimersByTime(100);
    expect(state.renderExport).not.toHaveBeenCalled();
    await flush(100);
    expect(state.renderExport).toHaveBeenCalledTimes(1);
    expect(state.renderExport).toHaveBeenCalledWith(FormatType.Png, { ...defaultOptions, scale: 1 });
  });

  it('hides Scale for SVG', async () => {
    await create();
    expect(q('[aria-label="Scale"]')).not.toBeNull();
    radio('Format', 'SVG').click();
    await flush();
    expect(q('[aria-label="Scale"]')).toBeNull();
    expect(state.renderExport).toHaveBeenLastCalledWith(FormatType.Svg, expect.any(Object));
  });

  it('downloads with the defaults then closes', async () => {
    await create();
    q<HTMLButtonElement>('.wb-export-download')?.click();
    await flush(0);
    expect(state.exportImage).toHaveBeenCalledWith(FormatType.Png, 'Sprint', {
      ...defaultOptions,
      embedBoardData: true,
    });
    expect(host.closedCount).toBe(1);
  });

  it('does not close when the download fails', async () => {
    state.exportImage.mockResolvedValue(false);
    await create();
    q<HTMLButtonElement>('.wb-export-download')?.click();
    await flush(0);
    expect(host.closedCount).toBe(0);
  });

  it('offers Only selected, checked, when there is a selection and passes it on', async () => {
    await create((h) => h.hasSelection.set(true));
    expect(q<HTMLElement>('[role="switch"][aria-label="Only selected"]')?.getAttribute('aria-checked')).toBe('true');
    q<HTMLButtonElement>('.wb-export-download')?.click();
    await flush(0);
    expect(state.exportImage).toHaveBeenCalledWith(FormatType.Png, 'Sprint', {
      ...defaultOptions,
      onlySelected: true,
      embedBoardData: true,
    });
  });

  it('Include board data is on by default and turning it off stops embedding on download only', async () => {
    await create();
    const embed = q<HTMLElement>('.wb-export-switch[aria-labelledby^="wb-export-embed-"]');
    expect(embed?.getAttribute('aria-checked')).toBe('true');
    embed?.click();
    await flush();
    expect(exportSettings().embedBoardData).toBe(false);
    q<HTMLButtonElement>('.wb-export-download')?.click();
    await flush(0);
    expect(state.exportImage).toHaveBeenCalledWith(FormatType.Png, 'Sprint', {
      ...defaultOptions,
      embedBoardData: false,
    });
  });

  it('hides Only selected without a selection', async () => {
    await create();
    expect(q('[aria-label="Only selected"]')).toBeNull();
  });

  it('passes background false', async () => {
    await create();
    q<HTMLElement>('[role="switch"][aria-label="Background"]')?.click();
    await flush();
    q<HTMLButtonElement>('.wb-export-download')?.click();
    await flush(0);
    expect(state.exportImage).toHaveBeenCalledWith(FormatType.Png, 'Sprint', {
      ...defaultOptions,
      background: false,
      embedBoardData: true,
    });
  });

  it('uses the edited filename and shows the extension as a suffix', async () => {
    await create();
    expect(q('.wb-export-ext')?.textContent?.trim()).toBe('.png');
    const input = q<HTMLInputElement>('input.wb-export-filename') as HTMLInputElement;
    input.value = 'plan';
    input.dispatchEvent(new Event('input'));
    q<HTMLButtonElement>('.wb-export-download')?.click();
    await flush(0);
    expect(state.exportImage).toHaveBeenCalledWith(FormatType.Png, 'plan', { ...defaultOptions, embedBoardData: true });
  });

  it('sanitises the filename', async () => {
    await create();
    const input = q<HTMLInputElement>('input.wb-export-filename') as HTMLInputElement;
    const download = async (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      q<HTMLButtonElement>('.wb-export-download')?.click();
      await flush(0);
      return state.exportImage.mock.lastCall[1];
    };
    expect(await download('plan.PNG')).toBe('plan');
    expect(await download('a/b\\c:d')).toBe('a-b-c-d');
    expect(await download('  .png ')).toBe('Sprint');
  });

  describe('failures', () => {
    it('announces a failed download, keeps the dialog open and clears on the next option change', async () => {
      state.exportImage.mockResolvedValue(false);
      await create();
      q<HTMLButtonElement>('.wb-export-download')?.click();
      await flush(0);
      expect(q('.wb-export-error')?.textContent).toContain('Export failed');
      expect(q('.wb-export-status')?.getAttribute('aria-live')).toBe('polite');
      expect(host.closedCount).toBe(0);
      radio('Scale', '3×').click();
      await flush(0);
      expect(q('.wb-export-error')).toBeNull();
    });

    it('announces a failed copy and clears on the next attempt', async () => {
      setClipboard({ write: jest.fn(), writeText: jest.fn() });
      (globalThis as { ClipboardItem?: unknown }).ClipboardItem = class {};
      state.copyImage.mockResolvedValue(false);
      await create();
      q<HTMLButtonElement>('.wb-export-copy')?.click();
      await flush(0);
      expect(q('.wb-export-error')?.textContent).toContain("Couldn't copy");
      expect(q('.wb-export-copy')?.textContent).not.toContain('Copied');
      state.copyImage.mockResolvedValue(true);
      q<HTMLButtonElement>('.wb-export-copy')?.click();
      await flush(0);
      expect(q('.wb-export-error')).toBeNull();
    });
  });

  it('does not set the Copied state after destroy', async () => {
    setClipboard({ write: jest.fn(), writeText: jest.fn() });
    (globalThis as { ClipboardItem?: unknown }).ClipboardItem = class {};
    let resolveCopy: (ok: boolean) => void = () => undefined;
    state.copyImage.mockReturnValue(new Promise<boolean>((r) => (resolveCopy = r)));
    await create();
    q<HTMLButtonElement>('.wb-export-copy')?.click();
    fixture.destroy();
    const timersAfterDestroy = jest.getTimerCount();
    resolveCopy(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(jest.getTimerCount()).toBe(timersAfterDestroy);
  });

  it('persists format, scale and background in the export settings', async () => {
    await create();
    radio('Scale', '3×').click();
    radio('Format', 'SVG').click();
    fixture.detectChanges();
    expect(exportSettings()).toEqual({ format: 'svg', scale: 3, background: true, embedBoardData: true });
    fixture.destroy();
    await create();
    expect(radio('Format', 'SVG').getAttribute('aria-checked')).toBe('true');
  });

  describe('Copy', () => {
    const enableImageCopy = () => {
      setClipboard({ write: jest.fn(), writeText: jest.fn() });
      (globalThis as { ClipboardItem?: unknown }).ClipboardItem = class {};
    };

    it('is hidden for PNG when images cannot be copied', async () => {
      await create();
      expect(q('.wb-export-copy')).toBeNull();
    });

    it('copies and shows Copied for 1.5s', async () => {
      enableImageCopy();
      await create();
      q<HTMLButtonElement>('.wb-export-copy')?.click();
      await flush(0);
      expect(state.copyImage).toHaveBeenCalledWith(FormatType.Png, defaultOptions);
      expect(q('.wb-export-copy')?.textContent).toContain('Copied');
      await flush(1500);
      expect(q('.wb-export-copy')?.textContent).not.toContain('Copied');
    });

    it('is available for SVG with writeText only', async () => {
      setClipboard({ writeText: jest.fn() });
      exportSettings.set({ format: 'svg', scale: 2, background: true, embedBoardData: true });
      await create();
      expect(q('.wb-export-copy')).not.toBeNull();
    });
  });
});
