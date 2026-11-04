import { isEditableTarget } from './is-editable-target';

describe('isEditableTarget', () => {
  it('is true for input, textarea and select', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true);
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableTarget(document.createElement('select'))).toBe(true);
  });

  it('is true for contenteditable elements and their descendants', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    const span = document.createElement('span');
    div.appendChild(span);
    expect(isEditableTarget(div)).toBe(true);
    expect(isEditableTarget(span)).toBe(true);
  });

  it('is false for plain elements and null', () => {
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
