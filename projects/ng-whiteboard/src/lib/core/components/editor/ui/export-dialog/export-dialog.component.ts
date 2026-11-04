import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { ExportOptions, FormatType } from '../../../../types';
import { canCopyImage } from '../../../../utils/dom/clipboard';
import { EditorStateService, EXPORT_PADDING, ExportSettings } from '../../editor-state.service';
import { DEFAULT_BOARD_TITLE } from '../../utils/board-title';
import { SegmentedControlComponent, SegmentedOption } from '../segmented-control/segmented-control.component';

const PREVIEW_DEBOUNCE_MS = 120;
const COPIED_MS = 1500;

function sanitizeFilename(name: string, title: string): string {
  const clean = name
    .trim()
    .replace(/\.(png|svg)$/i, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();
  return clean || title.trim() || DEFAULT_BOARD_TITLE;
}

@Component({
  selector: 'wb-export-dialog',
  standalone: true,
  imports: [SegmentedControlComponent],
  template: `
    <div class="wb-export">
      <div class="wb-export-preview" [class.is-transparent]="!settings().background" [class.is-loading]="loading()">
        @if (previewUrl(); as url) {
          <img class="wb-export-preview-img" [src]="url" alt="Export preview" />
        } @else if (failed()) {
          <p class="wb-export-empty">Nothing to preview</p>
        }
      </div>

      <div class="wb-export-options">
        <wb-segmented-control
          label="Format"
          [options]="formatOptions"
          [value]="settings().format"
          (valueChange)="setFormat($event)"
        />

        @if (settings().format === 'png') {
          <wb-segmented-control
            label="Scale"
            [options]="scaleOptions"
            [value]="'' + settings().scale"
            (valueChange)="setScale($event)"
          />
        }

        <div class="wb-export-row">
          <span class="wb-export-label">Background</span>
          <button
            type="button"
            class="wb-export-switch"
            role="switch"
            aria-label="Background"
            [attr.aria-checked]="settings().background"
            (click)="toggleBackground()"
          ></button>
        </div>

        @if (hasSelection()) {
          <div class="wb-export-row">
            <span class="wb-export-label">Only selected</span>
            <button
              type="button"
              class="wb-export-switch"
              role="switch"
              aria-label="Only selected"
              [attr.aria-checked]="onlySelected()"
              (click)="toggleOnlySelected()"
            ></button>
          </div>
        }

        <label class="wb-export-field">
          <span class="wb-export-label">File name</span>
          <span class="wb-export-filebox">
            <input
              class="wb-export-filename"
              type="text"
              autocomplete="off"
              spellcheck="false"
              [value]="filename()"
              (input)="filename.set($any($event.target).value)"
            />
            <span class="wb-export-ext">.{{ settings().format }}</span>
          </span>
        </label>
      </div>
    </div>

    <div class="wb-export-footer">
      <span class="wb-export-status" aria-live="polite">
        @if (error(); as message) {
          <span class="wb-export-error">{{ message }}</span>
        }
      </span>
      @if (copyAvailable()) {
        <button type="button" class="wb-export-btn wb-export-copy" (click)="copy()">
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      }
      <button type="button" class="wb-export-btn wb-export-download" (click)="download()">Download</button>
    </div>
  `,
  styleUrl: './export-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ExportDialogComponent {
  private readonly state = inject(EditorStateService);

  hasSelection = input(false);
  title = input('');
  closed = output<void>();

  protected readonly formatOptions: SegmentedOption[] = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
  ];
  protected readonly scaleOptions: SegmentedOption[] = [
    { value: '1', label: '1×' },
    { value: '2', label: '2×' },
    { value: '3', label: '3×' },
  ];

  protected readonly settings = this.state.exportSettings;
  protected readonly onlySelected = linkedSignal(() => this.hasSelection());
  protected readonly filename = linkedSignal(() => this.title() || DEFAULT_BOARD_TITLE);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly copied = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly format = computed(() => (this.settings().format === 'svg' ? FormatType.Svg : FormatType.Png));
  private readonly previewKey = computed(
    () => `${this.format()}|${this.settings().background}|${this.hasSelection() && this.onlySelected()}`
  );
  private readonly options = computed<ExportOptions>(() => ({
    scale: this.settings().scale,
    background: this.settings().background,
    padding: EXPORT_PADDING,
    onlySelected: this.hasSelection() && this.onlySelected(),
  }));

  protected readonly copyAvailable = computed(() =>
    this.settings().format === 'svg' ? !!navigator.clipboard?.writeText : canCopyImage()
  );

  private renderToken = 0;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  private firstRender = true;
  private destroyed = false;

  constructor() {
    effect((onCleanup) => {
      this.previewKey();
      const format = untracked(() => this.format());
      const options = { ...untracked(() => this.options()), scale: 1 };
      const delay = this.firstRender ? 0 : PREVIEW_DEBOUNCE_MS;
      this.firstRender = false;
      const timer = setTimeout(() => untracked(() => this.renderPreview(format, options)), delay);
      onCleanup(() => clearTimeout(timer));
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.renderToken++;
      clearTimeout(this.copiedTimer);
    });
  }

  protected setFormat(value: string): void {
    this.error.set(null);
    this.settings.update((s) => ({ ...s, format: value === 'svg' ? 'svg' : 'png' }));
  }

  protected setScale(value: string): void {
    this.error.set(null);
    const scale = Number(value) as ExportSettings['scale'];
    this.settings.update((s) => ({ ...s, scale }));
  }

  protected toggleBackground(): void {
    this.error.set(null);
    this.settings.update((s) => ({ ...s, background: !s.background }));
  }

  protected toggleOnlySelected(): void {
    this.error.set(null);
    this.onlySelected.update((value) => !value);
  }

  protected async download(): Promise<void> {
    this.error.set(null);
    const ok = await this.state.exportImage(
      this.format(),
      sanitizeFilename(this.filename(), this.title()),
      this.options()
    );
    if (this.destroyed) return;
    if (ok) this.closed.emit();
    else this.error.set('Export failed');
  }

  protected async copy(): Promise<void> {
    this.error.set(null);
    const ok = await this.state.copyImage(this.format(), this.options());
    if (this.destroyed) return;
    if (!ok) {
      this.error.set("Couldn't copy");
      return;
    }
    this.copied.set(true);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), COPIED_MS);
  }

  private async renderPreview(format: FormatType.Png | FormatType.Svg, options: ExportOptions): Promise<void> {
    const token = ++this.renderToken;
    this.loading.set(true);
    try {
      const { dataUrl } = await this.state.renderExport(format, options);
      if (token !== this.renderToken) return;
      this.previewUrl.set(dataUrl);
      this.failed.set(false);
    } catch {
      if (token !== this.renderToken) return;
      this.previewUrl.set(null);
      this.failed.set(true);
    } finally {
      if (token === this.renderToken) this.loading.set(false);
    }
  }
}
