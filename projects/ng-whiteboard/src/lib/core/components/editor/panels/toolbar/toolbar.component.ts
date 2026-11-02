import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, input, Output } from '@angular/core';
import { ToolType } from '../../../../types';
import { IconName } from '../../icon/icons';
import { IconComponent } from '../../icon/icon.component';

interface Tool {
  id: ToolType;
  label: string;
  icon: IconName;
  group?: 'drawing' | 'shapes' | 'utility';
  shortcut?: string;
}

@Component({
  selector: 'ng-toolbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toolbar-floating" role="toolbar" aria-label="Tools" (keydown)="onKeydown($event)">
      <div class="toolbar-group" *ngFor="let group of toolGroups; trackBy: trackByGroup">
        <div class="tool-group-label" *ngIf="group.label">{{ group.label }}</div>
        <button
          *ngFor="let tool of group.tools; trackBy: trackByTool"
          [class.active]="tool.id === selectedTool()"
          (click)="onToolSelect(tool.id)"
          [attr.title]="getTooltip(tool)"
          [attr.aria-label]="tool.label"
          [attr.aria-pressed]="tool.id === selectedTool()"
          [attr.tabindex]="tool.id === tabStop() ? 0 : -1"
          class="icon-btn tool-btn"
          [attr.data-tool]="tool.id"
        >
          <ng-icon [name]="tool.icon"></ng-icon>
        </button>
        <div class="toolbar-separator" *ngIf="group !== toolGroups[toolGroups.length - 1]"></div>
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

  private readonly allTools: Tool[] = [
    { id: ToolType.Hand, label: 'Pan', icon: 'Hand', group: 'utility', shortcut: 'H' },
    { id: ToolType.Select, label: 'Select', icon: 'Select', group: 'utility', shortcut: 'V' },
    { id: ToolType.Pen, label: 'Pen', icon: 'Pen', group: 'drawing', shortcut: 'P' },
    { id: ToolType.Eraser, label: 'Eraser', icon: 'Eraser', group: 'drawing', shortcut: 'E' },
    { id: ToolType.Rectangle, label: 'Rectangle', icon: 'Rectangle', group: 'shapes', shortcut: 'R' },
    { id: ToolType.Ellipse, label: 'Ellipse', icon: 'Ellipse', group: 'shapes', shortcut: 'O' },
    { id: ToolType.Line, label: 'Line', icon: 'Line', group: 'shapes', shortcut: 'L' },
    { id: ToolType.Arrow, label: 'Arrow', icon: 'Arrow', group: 'shapes', shortcut: 'A' },
    { id: ToolType.Text, label: 'Text', icon: 'Text', group: 'utility', shortcut: 'T' },
    { id: ToolType.Image, label: 'Image', icon: 'Image', group: 'utility', shortcut: 'I' },
  ];

  // Primary tools shown in main toolbar
  readonly toolGroups: { label: string; tools: Tool[] }[] = [
    {
      label: '',
      tools: [
        { id: ToolType.Hand, label: 'Pan', icon: 'Hand', group: 'utility', shortcut: 'H' },
        { id: ToolType.Select, label: 'Select', icon: 'Select', group: 'utility', shortcut: 'V' },
        { id: ToolType.Pen, label: 'Pen', icon: 'Pen', group: 'drawing', shortcut: 'P' },
        { id: ToolType.Eraser, label: 'Eraser', icon: 'Eraser', group: 'drawing', shortcut: 'E' },
      ],
    },
    {
      label: '',
      tools: [
        { id: ToolType.Rectangle, label: 'Rectangle', icon: 'Rectangle', group: 'shapes', shortcut: 'R' },
        { id: ToolType.Ellipse, label: 'Ellipse', icon: 'Ellipse', group: 'shapes', shortcut: 'O' },
        { id: ToolType.Line, label: 'Line', icon: 'Line', group: 'shapes', shortcut: 'L' },
        { id: ToolType.Arrow, label: 'Arrow', icon: 'Arrow', group: 'shapes', shortcut: 'A' },
      ],
    },
    {
      label: '',
      tools: [
        { id: ToolType.Text, label: 'Text', icon: 'Text', group: 'utility', shortcut: 'T' },
        { id: ToolType.Image, label: 'Image', icon: 'Image', group: 'utility', shortcut: 'I' },
      ],
    },
  ];

  tabStop(): ToolType {
    const selected = this.selectedTool();
    const all = this.toolGroups.flatMap((g) => g.tools);
    return all.some((t) => t.id === selected) ? selected : all[0].id;
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

  getTooltip(tool: Tool): string {
    return tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label;
  }

  trackByGroup(index: number): string {
    return `group-${index}`;
  }

  trackByTool(index: number, tool: Tool): ToolType {
    return tool.id;
  }
}
