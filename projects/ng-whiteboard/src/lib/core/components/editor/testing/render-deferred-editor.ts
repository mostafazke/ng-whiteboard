import { ComponentFixture, DeferBlockState } from '@angular/core/testing';

/**
 * Finish the `@defer`red editor of an `<ng-whiteboard>` fixture: load and render each defer block,
 * then settle the editor's first measure/layout pass.
 */
export async function renderDeferredEditor(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  for (const block of await fixture.getDeferBlocks()) {
    await block.render(DeferBlockState.Complete);
  }
  await fixture.whenStable();
  fixture.detectChanges();
}
