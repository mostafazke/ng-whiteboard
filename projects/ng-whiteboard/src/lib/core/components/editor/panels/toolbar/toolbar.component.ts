import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
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
    <div class="toolbar-floating">
      <div class="toolbar-group" *ngFor="let group of toolGroups; trackBy: trackByGroup">
        <div class="tool-group-label" *ngIf="group.label">{{ group.label }}</div>
        <button
          *ngFor="let tool of group.tools; trackBy: trackByTool"
          [class.active]="tool.id === selectedTool()"
          (click)="onToolSelect(tool.id)"
          [attr.title]="getTooltip(tool)"
          class="icon-btn tool-btn"
          [attr.data-tool]="tool.id"
        >
          <ng-icon [name]="tool.icon"></ng-icon>
        </button>
        <div class="toolbar-separator" *ngIf="group !== toolGroups[toolGroups.length - 1]"></div>
      </div>

      <!-- Extended Tools Menu -->
      <div class="dropdown-wrapper">
        <button class="icon-btn more-tools" (click)="toggleExtendedTools()" [class.active]="showExtended()">
          <ng-icon name="more"></ng-icon>
        </button>

        <div class="extended-tools" *ngIf="showExtended()">
          <div class="extended-section" *ngFor="let section of extendedSections">
            <div class="section-label">{{ section.label }}</div>
            <div class="section-tools">
              <button
                *ngFor="let tool of section.tools"
                (click)="onToolSelect(tool.id)"
                [class.active]="tool.id === selectedTool()"
                class="extended-tool-btn"
                [attr.title]="tool.label"
              >
                <ng-icon [name]="tool.icon"></ng-icon>
                <span>{{ tool.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  selectedTool = input<ToolType>(ToolType.Pen);
  showExtended = input<boolean>(false);

  @Output() toolSelect = new EventEmitter<ToolType>();
  @Output() extendedToggle = new EventEmitter<void>();

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

  // Extended tools for dropdown
  extendedSections: { label: string; tools: Tool[] }[] = [
    {
      label: 'Advanced Drawing',
      tools: [],
    },
    {
      label: 'Annotations',
      tools: [],
    },
  ];

  onToolSelect(toolId: ToolType) {
    this.toolSelect.emit(toolId);
  }

  toggleExtendedTools() {
    this.extendedToggle.emit();
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
