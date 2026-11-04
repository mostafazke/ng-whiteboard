import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, input, Output } from '@angular/core';
import { TOOL_GROUPS, ToolShortcut } from '../../../../input/tool-shortcuts';
import { ToolType } from '../../../../types';
import { IconName } from '../../icon/icons';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ng-toolbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toolbar-floating" role="toolbar" aria-label="Tools" (keydown)="onKeydown($event)">
      <div class="toolbar-group" *ngFor="let group of toolGroups; let last = last; trackBy: trackByGroup">
        <button
          *ngFor="let tool of group; trackBy: trackByTool"
          [class.active]="tool.tool === selectedTool()"
          (click)="onToolSelect(tool.tool)"
          [attr.data-tooltip]="getTooltip(tool)"
          [attr.aria-label]="tool.label"
          [attr.aria-keyshortcuts]="getAriaShortcuts(tool)"
          [attr.aria-pressed]="tool.tool === selectedTool()"
          [attr.tabindex]="tool.tool === tabStop() ? 0 : -1"
          class="icon-btn tool-btn"
          [attr.data-tool]="tool.tool"
        >
          <ng-icon [name]="icons[tool.tool]"></ng-icon>
          <span class="tool-digit" aria-hidden="true">{{ tool.digit }}</span>
        </button>
        <div class="toolbar-separator" *ngIf="!last"></div>
      </div>
    </div>
  `,
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  selectedTool = input<ToolType>(ToolType.Pen);

  @Output() toolSelect = new EventEmitter<ToolType>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly toolGroups = TOOL_GROUPS;

  readonly icons: { readonly [tool: string]: IconName } = {
    [ToolType.Hand]: 'Hand',
    [ToolType.Select]: 'Select',
    [ToolType.Pen]: 'Pen',
    [ToolType.Eraser]: 'Eraser',
    [ToolType.Rectangle]: 'Rectangle',
    [ToolType.Ellipse]: 'Ellipse',
    [ToolType.Line]: 'Line',
    [ToolType.Arrow]: 'Arrow',
    [ToolType.Text]: 'Text',
    [ToolType.Image]: 'Image',
  };

  tabStop(): ToolType {
    const selected = this.selectedTool();
    const all = this.toolGroups.flat();
    return all.some((t) => t.tool === selected) ? selected : all[0].tool;
  }

  onKeydown(event: KeyboardEvent) {
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button.tool-btn'));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % buttons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + buttons.length) % buttons.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = buttons.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    buttons[next].focus();
  }

  onToolSelect(toolId: ToolType) {
    this.toolSelect.emit(toolId);
  }

  getTooltip(tool: ToolShortcut): string {
    return `${tool.label} (${tool.keys[0].toUpperCase()})`;
  }

  getAriaShortcuts(tool: ToolShortcut): string {
    return [...tool.keys.map((k) => k.toUpperCase()), tool.digit].join(' ');
  }

  trackByGroup(index: number): string {
    return `group-${index}`;
  }

  trackByTool(index: number, tool: ToolShortcut): ToolType {
    return tool.tool;
  }
}
