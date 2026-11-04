import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { WhiteboardElement } from '../../../../types';
import { IconComponent } from '../../icon/icon.component';
import { IconName } from '../../icon/icons';
import { AlignmentType } from '../../utils/alignment';

interface AlignmentOption {
  type: AlignmentType;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'ng-alignment-controls',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="alignment-buttons">
      <div class="alignment-group">
        <span class="group-label">Horizontal</span>
        <div class="button-row">
          @for (alignment of horizontalAlignments; track alignment.type) {
            <button
              class="alignment-btn"
              [attr.title]="alignment.label"
              [attr.aria-label]="alignment.label"
              (click)="alignmentChange.emit(alignment.type)"
            >
              <ng-icon [name]="alignment.icon"></ng-icon>
            </button>
          }
        </div>
      </div>

      <div class="alignment-group">
        <span class="group-label">Vertical</span>
        <div class="button-row">
          @for (alignment of verticalAlignments; track alignment.type) {
            <button
              class="alignment-btn"
              [attr.title]="alignment.label"
              [attr.aria-label]="alignment.label"
              (click)="alignmentChange.emit(alignment.type)"
            >
              <ng-icon [name]="alignment.icon"></ng-icon>
            </button>
          }
        </div>
      </div>

      @if (canDistribute()) {
        <div class="alignment-group">
          <span class="group-label">Distribute</span>
          <div class="button-row">
            @for (distribution of distributions; track distribution.type) {
              <button
                class="alignment-btn"
                [attr.title]="distribution.label"
                [attr.aria-label]="distribution.label"
                (click)="alignmentChange.emit(distribution.type)"
              >
                <ng-icon [name]="distribution.icon"></ng-icon>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './alignment-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignmentControlsComponent {
  selectedElements = input<WhiteboardElement[]>([]);

  @Output() alignmentChange = new EventEmitter<AlignmentType>();

  readonly horizontalAlignments: AlignmentOption[] = [
    { type: 'align-left', label: 'Align Left', icon: 'alignLeft' },
    { type: 'align-center', label: 'Align Center', icon: 'alignCenter' },
    { type: 'align-right', label: 'Align Right', icon: 'alignRight' },
  ];

  readonly verticalAlignments: AlignmentOption[] = [
    { type: 'align-top', label: 'Align Top', icon: 'alignTop' },
    { type: 'align-middle', label: 'Align Middle', icon: 'alignMiddle' },
    { type: 'align-bottom', label: 'Align Bottom', icon: 'alignBottom' },
  ];

  readonly distributions: AlignmentOption[] = [
    { type: 'distribute-horizontal', label: 'Distribute Horizontally', icon: 'distributeHorizontal' },
    { type: 'distribute-vertical', label: 'Distribute Vertically', icon: 'distributeVertical' },
  ];

  canDistribute() {
    return this.selectedElements().length >= 3;
  }
}
