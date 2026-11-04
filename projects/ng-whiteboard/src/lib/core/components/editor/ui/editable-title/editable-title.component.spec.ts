import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditableTitleComponent } from './editable-title.component';

describe('EditableTitleComponent', () => {
  let fixture: ComponentFixture<EditableTitleComponent>;
  let changed: jest.Mock;
  const el = (): HTMLElement => fixture.nativeElement;
  const button = () => el().querySelector('button.title-button') as HTMLButtonElement;
  const input = () => el().querySelector('input.title-input') as HTMLInputElement | null;
  const type = (value: string) => {
    const field = input() as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  };
  const key = (name: string) =>
    input()?.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditableTitleComponent);
    fixture.componentRef.setInput('value', 'My board');
    changed = jest.fn();
    fixture.componentInstance.valueChange.subscribe(changed);
    fixture.detectChanges();
  });

  it('renders a focusable Rename board button showing the title with a tooltip', () => {
    expect(button().getAttribute('aria-label')).toBe('Rename board');
    expect(button().tabIndex).toBe(0);
    expect(button().textContent).toContain('My board');
    expect(button().getAttribute('title')).toBe('My board');
  });

  it('shows no unsaved dot by default', () => {
    expect(el().querySelector('.title-unsaved')).toBeNull();
  });

  it('shows the unsaved dot and names the file and state in the tooltip and label', () => {
    fixture.componentRef.setInput('unsaved', true);
    fixture.componentRef.setInput('fileName', 'plan.json');
    fixture.detectChanges();
    expect(el().querySelector('.title-unsaved')).not.toBeNull();
    expect(button().getAttribute('title')).toBe('My board · plan.json · Unsaved changes');
    expect(button().getAttribute('aria-label')).toBe('Rename board, unsaved changes');
  });

  it('Enter commits the typed title', () => {
    button().click();
    fixture.detectChanges();
    type('Renamed');
    key('Enter');
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith('Renamed');
    expect(input()).toBeNull();
  });

  it('Escape cancels without emitting', () => {
    button().click();
    fixture.detectChanges();
    type('Nope');
    key('Escape');
    fixture.detectChanges();
    expect(changed).not.toHaveBeenCalled();
    expect(input()).toBeNull();
    expect(button().textContent).toContain('My board');
  });

  it('an empty title commits Whiteboard', () => {
    button().click();
    fixture.detectChanges();
    type('   ');
    key('Enter');
    expect(changed).toHaveBeenCalledWith('Whiteboard');
  });

  it('blur commits once, and a following blur does not repeat it', () => {
    button().click();
    fixture.detectChanges();
    type('Blurred');
    const field = input() as HTMLInputElement;
    field.dispatchEvent(new Event('blur'));
    field.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledWith('Blurred');
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('Escape does not reach parents', () => {
    button().click();
    fixture.detectChanges();
    const reached = jest.fn();
    el().addEventListener('keydown', reached);
    key('Escape');
    expect(reached).not.toHaveBeenCalled();
  });
});
