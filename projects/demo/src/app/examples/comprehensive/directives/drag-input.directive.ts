import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[dragInput]',
  standalone: true,
})
export class DragInputDirective {
  @Input() min?: number;
  @Input() max?: number;
  @Input() step = 1;
  @Output() valueChange = new EventEmitter<number>();

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const input = event.target as HTMLInputElement;
    let lastY = 0;
    let value = parseInt(input.value, 10);
    const scale = this.calculateScale();

    const onMouseMove = (e: MouseEvent) => {
      if (lastY === 0) lastY = e.pageY;
      const deltaY = (e.pageY - lastY) * -1;
      lastY = e.pageY;
      value = this.calculateNewValue(value, deltaY, scale);
      this.valueChange.emit(value);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private calculateScale(): number {
    const area = this.min && this.max ? (this.max - this.min) / this.step : 200;
    return (area / 70) * this.step;
  }

  private calculateNewValue(currentValue: number, deltaY: number, scale: number): number {
    let val = Math.floor(currentValue + deltaY * scale);

    if (this.max !== undefined) {
      val = Math.min(val, this.max);
    }
    if (this.min !== undefined) {
      val = Math.max(val, this.min);
    }

    return val;
  }
}
