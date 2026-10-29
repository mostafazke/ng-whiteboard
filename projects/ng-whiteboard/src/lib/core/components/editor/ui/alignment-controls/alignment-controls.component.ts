import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { WhiteboardElement } from '../../../../types';
import { IconComponent } from '../../icon/icon.component';
import { IconName } from '../../icon/icons';

export type AlignmentType =
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-top'
  | 'align-middle'
  | 'align-bottom'
  | 'distribute-horizontal'
  | 'distribute-vertical';

@Component({
  selector: 'ng-alignment-controls',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="control">
      <label>Alignment</label>
      <div class="alignment-buttons">
        <div class="alignment-group">
          <span class="group-label">Horizontal</span>
          <div class="button-row">
            <button
              *ngFor="let alignment of horizontalAlignments; trackBy: trackByAlignment"
              class="alignment-btn"
              [attr.title]="alignment.label"
              (click)="onAlignment(alignment.type)"
            >
              <ng-icon [name]="alignment.icon"></ng-icon>
            </button>
          </div>
        </div>

        <div class="alignment-group">
          <span class="group-label">Vertical</span>
          <div class="button-row">
            <button
              *ngFor="let alignment of verticalAlignments; trackBy: trackByAlignment"
              class="alignment-btn"
              [attr.title]="alignment.label"
              (click)="onAlignment(alignment.type)"
            >
              <ng-icon [name]="alignment.icon"></ng-icon>
            </button>
          </div>
        </div>

        <div class="alignment-group" *ngIf="canDistribute()">
          <span class="group-label">Distribute</span>
          <div class="button-row">
            <button
              *ngFor="let distribution of distributions; trackBy: trackByAlignment"
              class="alignment-btn"
              [attr.title]="distribution.label"
              (click)="onAlignment(distribution.type)"
            >
              <ng-icon [name]="distribution.icon"></ng-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './alignment-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignmentControlsComponent {
  selectedElements = input<WhiteboardElement[]>([]);

  @Output() alignmentChange = new EventEmitter<AlignmentType>();

  horizontalAlignments = [
    { type: 'align-left' as AlignmentType, label: 'Align Left', icon: 'alignLeft' as IconName },
    { type: 'align-center' as AlignmentType, label: 'Align Center', icon: 'alignCenter' as IconName },
    { type: 'align-right' as AlignmentType, label: 'Align Right', icon: 'alignRight' as IconName },
  ];

  verticalAlignments = [
    { type: 'align-top' as AlignmentType, label: 'Align Top', icon: 'alignTop' as IconName },
    { type: 'align-middle' as AlignmentType, label: 'Align Middle', icon: 'alignMiddle' as IconName },
    { type: 'align-bottom' as AlignmentType, label: 'Align Bottom', icon: 'alignBottom' as IconName },
  ];

  distributions = [
    {
      type: 'distribute-horizontal' as AlignmentType,
      label: 'Distribute Horizontally',
      icon: 'distributeHorizontal' as IconName,
    },
    {
      type: 'distribute-vertical' as AlignmentType,
      label: 'Distribute Vertically',
      icon: 'distributeVertical' as IconName,
    },
  ];

  canDistribute() {
    return this.selectedElements().length >= 3;
  }

  onAlignment(type: AlignmentType) {
    this.alignmentChange.emit(type);
  }

  trackByAlignment(index: number, alignment: { type: AlignmentType; label: string; icon: IconName }): string {
    return alignment.type;
  }
}
