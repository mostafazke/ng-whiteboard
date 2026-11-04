import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { BlendMode, WhiteboardLayer } from '../../../../types';
import { IconComponent } from '../../icon/icon.component';

type LayerDeleteMode = 'delete-elements' | 'move-elements';

export type LayerPanelAction =
  | { type: 'select' | 'add' | 'toggle-visible' | 'toggle-lock' | 'duplicate' | 'merge-down'; id?: string }
  | { type: 'rename'; id: string; name: string }
  | { type: 'reorder'; from: number; to: number }
  | { type: 'opacity'; id: string; opacity: number; phase: 'start' | 'change' | 'end' }
  | { type: 'blend'; id: string; blendMode: BlendMode }
  | { type: 'delete'; id: string; mode: LayerDeleteMode };

const LAYER_BLEND_MODES: readonly { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
];

interface DragState {
  from: number;
  to: number;
}

@Component({
  selector: 'ng-layer-panel',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerPanelComponent {
  private readonly endEditOnDestroy = inject(DestroyRef).onDestroy(() => this.endOpacity());

  layers = input<WhiteboardLayer[]>([]);
  activeLayerId = input('');
  showClose = input(false);
  action = output<LayerPanelAction>();
  closed = output<void>();

  protected readonly blendModes = LAYER_BLEND_MODES;
  protected rows = computed(() => [...this.layers()].sort((a, b) => b.zIndex - a.zIndex));
  protected renamingId = signal<string | null>(null);
  protected menuId = signal<string | null>(null);
  protected confirmId = signal<string | null>(null);
  protected drag = signal<DragState | null>(null);

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);
  private opacityEditingId: string | null = null;
  private lastOpacity = 1;

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: Event) {
    if (this.menuId() === null) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.lp-options, .lp-more')) return;
    this.closeMenu(false);
  }

  protected countLabel(layer: WhiteboardLayer): string {
    return layer.elements.length === 0 ? 'Empty' : elementCount(layer);
  }

  protected deleteMessage(layer: WhiteboardLayer): string {
    return `Delete layer and its ${elementCount(layer)}?`;
  }

  protected opacityPercent(layer: WhiteboardLayer): number {
    return Math.round((layer.opacity ?? 1) * 100);
  }

  protected toggle(type: 'toggle-visible' | 'toggle-lock', id: string, event: Event) {
    event.stopPropagation();
    this.action.emit({ type, id });
  }

  protected onRowKeydown(event: KeyboardEvent, layer: WhiteboardLayer, index: number) {
    if (event.target !== event.currentTarget) return;
    if (event.key === ' ') {
      event.preventDefault();
      this.action.emit({ type: 'select', id: layer.id });
    } else if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      this.startRename(layer);
    } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const to = index + (event.key === 'ArrowUp' ? -1 : 1);
      if (to < 0 || to >= this.rows().length) return;
      this.action.emit({ type: 'reorder', from: index, to });
      this.focusAfterRender(`.lp-row[data-id="${layer.id}"]`);
    }
  }

  protected startRename(layer: WhiteboardLayer) {
    this.closeMenu(false);
    this.confirmId.set(null);
    this.renamingId.set(layer.id);
    afterNextRender(
      () => {
        const input = this.host.nativeElement.querySelector<HTMLInputElement>('.lp-name-input');
        input?.focus();
        input?.select();
      },
      { injector: this.injector }
    );
  }

  protected commitRename(layer: WhiteboardLayer, input: HTMLInputElement) {
    if (this.renamingId() !== layer.id) return;
    this.renamingId.set(null);
    const name = input.value.trim();
    if (name && name !== layer.name) this.action.emit({ type: 'rename', id: layer.id, name });
    this.focusAfterRender(`.lp-row[data-id="${layer.id}"]`);
  }

  protected cancelRename(event: Event, layer: WhiteboardLayer) {
    event.preventDefault();
    event.stopPropagation();
    this.renamingId.set(null);
    this.focusAfterRender(`.lp-row[data-id="${layer.id}"]`);
  }

  protected onGripDown(event: PointerEvent, index: number) {
    if (event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.drag.set({ from: index, to: index });
  }

  protected onGripMove(event: PointerEvent) {
    const state = this.drag();
    if (!state) return;
    const to = this.indexAt(event.clientY);
    if (to !== state.to) this.drag.set({ ...state, to });
  }

  protected onGripUp(event: PointerEvent) {
    const state = this.drag();
    if (!state) return;
    this.drag.set(null);
    const to = this.indexAt(event.clientY);
    if (to !== state.from) this.action.emit({ type: 'reorder', from: state.from, to });
  }

  protected cancelDrag() {
    this.drag.set(null);
  }

  private indexAt(clientY: number): number {
    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.lp-item'));
    const index = items.findIndex((item) => clientY < item.getBoundingClientRect().bottom);
    return index === -1 ? items.length - 1 : index;
  }

  protected toggleMenu(layer: WhiteboardLayer, event: Event) {
    event.stopPropagation();
    if (this.menuId() === layer.id) {
      this.closeMenu(true);
      return;
    }
    this.endOpacity();
    this.confirmId.set(null);
    this.renamingId.set(null);
    this.menuId.set(layer.id);
  }

  protected closeMenu(refocus: boolean) {
    const id = this.menuId();
    this.endOpacity();
    this.menuId.set(null);
    if (refocus && id) this.focusAfterRender(`.lp-row[data-id="${id}"] .lp-more`);
  }

  protected onOptionsKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.closeMenu(true);
  }

  protected onActionKeydown(event: KeyboardEvent) {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const buttons = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.lp-action:not(:disabled)')
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    buttons[(current + step + buttons.length) % buttons.length]?.focus();
  }

  protected onOpacityInput(layer: WhiteboardLayer, slider: HTMLInputElement) {
    const opacity = Number(slider.value) / 100;
    if (!this.opacityEditingId) {
      this.opacityEditingId = layer.id;
      this.action.emit({ type: 'opacity', id: layer.id, opacity, phase: 'start' });
    }
    this.action.emit({ type: 'opacity', id: layer.id, opacity, phase: 'change' });
    this.lastOpacity = opacity;
  }

  protected endOpacity() {
    const id = this.opacityEditingId;
    if (!id) return;
    this.opacityEditingId = null;
    this.action.emit({ type: 'opacity', id, opacity: this.lastOpacity, phase: 'end' });
  }

  protected onBlend(layer: WhiteboardLayer, select: HTMLSelectElement) {
    this.action.emit({ type: 'blend', id: layer.id, blendMode: select.value as BlendMode });
  }

  protected runAction(type: 'duplicate' | 'merge-down', layer: WhiteboardLayer) {
    this.closeMenu(true);
    this.action.emit({ type, id: layer.id });
  }

  protected requestDelete(layer: WhiteboardLayer) {
    this.closeMenu(false);
    if (layer.elements.length === 0) {
      this.focusAfterDelete(layer);
      this.action.emit({ type: 'delete', id: layer.id, mode: 'delete-elements' });
      return;
    }
    this.confirmId.set(layer.id);
    this.focusAfterRender('.lp-confirm .lp-confirm-cancel');
  }

  protected confirmDelete(layer: WhiteboardLayer, mode: LayerDeleteMode) {
    this.confirmId.set(null);
    this.focusAfterDelete(layer);
    this.action.emit({ type: 'delete', id: layer.id, mode });
  }

  private focusAfterDelete(layer: WhiteboardLayer) {
    const rows = this.rows();
    const index = rows.findIndex((r) => r.id === layer.id);
    const neighbour = rows[index + 1] ?? rows[index - 1];
    this.focusAfterRender(neighbour ? `.lp-row[data-id="${neighbour.id}"]` : '.lp-add');
  }

  protected optionsId(layer: WhiteboardLayer): string {
    return `lp-options-${layer.id}`;
  }

  protected cancelDelete(layer: WhiteboardLayer) {
    this.confirmId.set(null);
    this.focusAfterRender(`.lp-row[data-id="${layer.id}"]`);
  }

  protected neighbourName(index: number): string {
    const rows = this.rows();
    return (rows[index + 1] ?? rows[index - 1])?.name ?? '';
  }

  private focusAfterRender(selector: string) {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }),
      { injector: this.injector }
    );
  }
}

function elementCount(layer: WhiteboardLayer): string {
  const count = layer.elements.length;
  return count === 1 ? '1 element' : `${count} elements`;
}
