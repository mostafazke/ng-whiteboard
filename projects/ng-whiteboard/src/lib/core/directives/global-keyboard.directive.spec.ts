import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { GlobalKeyboardDirective } from './global-keyboard.directive';
import { ConfigService } from '../config/config.service';
import { SvgService } from '../svg/svg.service';
import { WhiteboardConfig } from '../types';

// Mock component for testing
@Component({
  template: '<svg globalKeyboard></svg>',
  standalone: true,
  imports: [GlobalKeyboardDirective],
})
class TestComponent {}

describe('GlobalKeyboardDirective', () => {
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockSvgService: jest.Mocked<SvgService>;

  beforeEach(async () => {
    jest.useFakeTimers();

    const configSpy = {
      getConfig: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const svgSpy = {
      onKeyDown: jest.fn(),
      onKeyUp: jest.fn(),
    } as unknown as jest.Mocked<SvgService>;

    await TestBed.configureTestingModule({
      imports: [TestComponent, GlobalKeyboardDirective],
      providers: [
        { provide: ConfigService, useValue: configSpy },
        { provide: SvgService, useValue: svgSpy },
      ],
    }).compileComponents();

    mockConfigService = TestBed.inject(ConfigService) as jest.Mocked<ConfigService>;
    mockSvgService = TestBed.inject(SvgService) as jest.Mocked<SvgService>;

    // Setup default config
    mockConfigService.getConfig.mockReturnValue({
      keyboardShortcutsEnabled: true,
    } as WhiteboardConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestComponent);
    expect(fixture).toBeTruthy();
  });

  it('should handle global keydown events when whiteboard is hovered', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const element = fixture.debugElement.children[0].nativeElement;

    // Simulate mouse enter to make this whiteboard active
    element.dispatchEvent(new MouseEvent('mouseenter'));

    const keyEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    directive.onGlobalKeyDown(keyEvent);

    expect(mockSvgService.onKeyDown).toHaveBeenCalledWith(keyEvent);
  });

  it('should not handle keydown events when whiteboard is not active', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement.children[0].injector.get(GlobalKeyboardDirective);

    // Don't simulate any interaction - whiteboard is not active
    const keyEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    directive.onGlobalKeyDown(keyEvent);

    expect(mockSvgService.onKeyDown).not.toHaveBeenCalled();
  });

  it('should handle keydown events after recent interaction', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const element = fixture.debugElement.children[0].nativeElement;

    // Simulate pointer interaction
    element.dispatchEvent(new PointerEvent('pointerdown'));

    const keyEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    directive.onGlobalKeyDown(keyEvent);

    expect(mockSvgService.onKeyDown).toHaveBeenCalledWith(keyEvent);
  });

  it('should not handle keydown events when keyboard shortcuts are disabled', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const element = fixture.debugElement.children[0].nativeElement;

    // Make whiteboard active
    element.dispatchEvent(new MouseEvent('mouseenter'));

    // Disable keyboard shortcuts
    mockConfigService.getConfig.mockReturnValue({
      keyboardShortcutsEnabled: false,
    } as WhiteboardConfig);

    const keyEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    directive.onGlobalKeyDown(keyEvent);

    expect(mockSvgService.onKeyDown).not.toHaveBeenCalled();
  });

  it('should handle global keyup events when whiteboard is active', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const element = fixture.debugElement.children[0].nativeElement;

    // Make whiteboard active
    element.dispatchEvent(new MouseEvent('mouseenter'));

    const keyEvent = new KeyboardEvent('keyup', { key: 'z', ctrlKey: true });
    directive.onGlobalKeyUp(keyEvent);

    expect(mockSvgService.onKeyUp).toHaveBeenCalledWith(keyEvent);
  });

  it('should deactivate when mouse leaves and another whiteboard becomes active', () => {
    const fixture1 = TestBed.createComponent(TestComponent);
    const fixture2 = TestBed.createComponent(TestComponent);
    fixture1.detectChanges();
    fixture2.detectChanges();

    const directive1 = fixture1.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const element1 = fixture1.debugElement.children[0].nativeElement;
    const element2 = fixture2.debugElement.children[0].nativeElement;

    // Make first whiteboard active
    element1.dispatchEvent(new MouseEvent('mouseenter'));

    // Mouse leaves first whiteboard
    element1.dispatchEvent(new MouseEvent('mouseleave'));

    // Make second whiteboard active
    element2.dispatchEvent(new MouseEvent('mouseenter'));

    // Wait for interaction timeout
    jest.advanceTimersByTime(1000);

    // Clear the mock to ensure we're testing fresh calls
    mockSvgService.onKeyDown.mockClear();

    const keyEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    directive1.onGlobalKeyDown(keyEvent);

    // Should not handle because another whiteboard is now active
    expect(mockSvgService.onKeyDown).not.toHaveBeenCalled();
  });

  it('should handle only one whiteboard when multiple exist', () => {
    // Create two whiteboard instances
    const fixture1 = TestBed.createComponent(TestComponent);
    const fixture2 = TestBed.createComponent(TestComponent);
    fixture1.detectChanges();
    fixture2.detectChanges();

    const directive1 = fixture1.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const directive2 = fixture2.debugElement.children[0].injector.get(GlobalKeyboardDirective);
    const element2 = fixture2.debugElement.children[0].nativeElement;

    // Make only the second whiteboard active
    element2.dispatchEvent(new MouseEvent('mouseenter'));

    const keyEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });

    // Both receive the window event, but only directive2 should process it
    mockSvgService.onKeyDown.mockClear();
    directive1.onGlobalKeyDown(keyEvent);
    expect(mockSvgService.onKeyDown).not.toHaveBeenCalled();

    mockSvgService.onKeyDown.mockClear();
    directive2.onGlobalKeyDown(keyEvent);
    expect(mockSvgService.onKeyDown).toHaveBeenCalledWith(keyEvent);
  });
});
