import { Directive, ElementRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { SvgService } from '../svg/svg.service';

@Directive({
  selector: '[globalKeyboard]',
  standalone: true,
})
export class GlobalKeyboardDirective implements OnInit, OnDestroy {
  private configService = inject(ConfigService);
  private svgService = inject(SvgService);
  private elementRef = inject(ElementRef);

  private isHovered = false;
  private lastInteractionTime = 0;
  private readonly INTERACTION_TIMEOUT = 500;

  private static activeDirective: GlobalKeyboardDirective | null = null;

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    element.addEventListener('mouseenter', this.handleMouseEnter);
    element.addEventListener('mouseleave', this.handleMouseLeave);
    element.addEventListener('pointerdown', this.handleInteraction);
    element.addEventListener('pointerup', this.handleInteraction);
  }

  ngOnDestroy(): void {
    const element = this.elementRef.nativeElement;
    element.removeEventListener('mouseenter', this.handleMouseEnter);
    element.removeEventListener('mouseleave', this.handleMouseLeave);
    element.removeEventListener('pointerdown', this.handleInteraction);
    element.removeEventListener('pointerup', this.handleInteraction);

    if (GlobalKeyboardDirective.activeDirective === this) {
      GlobalKeyboardDirective.activeDirective = null;
    }
  }

  private handleMouseEnter = (): void => {
    this.isHovered = true;
    GlobalKeyboardDirective.activeDirective = this;
  };

  private handleMouseLeave = (): void => {
    this.isHovered = false;
  };

  private handleInteraction = (): void => {
    this.lastInteractionTime = Date.now();
    GlobalKeyboardDirective.activeDirective = this;
  };

  private isActiveWhiteboard(): boolean {
    const recentlyInteracted = Date.now() - this.lastInteractionTime < this.INTERACTION_TIMEOUT;
    return this.isHovered || recentlyInteracted || GlobalKeyboardDirective.activeDirective === this;
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if (!this.configService.getConfig().keyboardShortcutsEnabled) {
      return;
    }

    if (!this.isActiveWhiteboard()) {
      return;
    }

    this.svgService.onKeyDown(event);
  }

  @HostListener('window:keyup', ['$event'])
  onGlobalKeyUp(event: KeyboardEvent): void {
    if (!this.configService.getConfig().keyboardShortcutsEnabled) {
      return;
    }

    if (!this.isActiveWhiteboard()) {
      return;
    }

    this.svgService.onKeyUp(event);
  }
}
