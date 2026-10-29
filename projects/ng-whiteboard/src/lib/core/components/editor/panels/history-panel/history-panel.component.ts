import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ng-history-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="history-panel">
      <button title="Undo (Ctrl+Z)" class="icon-btn" (click)="onUndo()" [disabled]="!canUndo()">
        <ng-icon name="undo"></ng-icon>
      </button>

      <div class="divider"></div>

      <button title="Redo (Ctrl+Y)" class="icon-btn" (click)="onRedo()" [disabled]="!canRedo()">
        <ng-icon name="redo"></ng-icon>
      </button>
    </div>
  `,
  styleUrl: './history-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPanelComponent {
  canUndo = input<boolean>(false);
  canRedo = input<boolean>(false);

  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();

  onUndo() {
    this.undo.emit();
  }

  onRedo() {
    this.redo.emit();
  }
}
