import { IconName } from '../icon/icons';

export interface EditorAction<Id extends string> {
  id: Id;
  label: string;
  icon: IconName;
  requiresSelection?: boolean;
}

export type DocumentActionId = 'new' | 'save' | 'export';
export type ZoomActionId = 'fit' | 'selection' | 'reset';

export const DOCUMENT_ACTIONS: readonly EditorAction<DocumentActionId>[] = [
  { id: 'new', label: 'New', icon: 'new' },
  { id: 'save', label: 'Save', icon: 'save' },
  { id: 'export', label: 'Export', icon: 'download' },
];

export const ZOOM_ACTIONS: readonly EditorAction<ZoomActionId>[] = [
  { id: 'fit', label: 'Zoom to Fit', icon: 'fit' },
  { id: 'selection', label: 'Zoom to Selection', icon: 'selection', requiresSelection: true },
  { id: 'reset', label: 'Reset Zoom', icon: 'reset' },
];
