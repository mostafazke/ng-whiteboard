import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'documentation',
    loadComponent: () => import('./documentation/documentation.component').then((m) => m.DocumentationComponent),
    children: [
      {
        path: '',
        redirectTo: 'getting-started',
        pathMatch: 'full',
      },
      {
        path: 'getting-started',
        loadComponent: () =>
          import('./documentation/pages/getting-started/getting-started.component').then(
            (m) => m.GettingStartedComponent
          ),
      },
      {
        path: 'api-reference',
        loadComponent: () =>
          import('./documentation/pages/api-reference/api-reference.component').then((m) => m.ApiReferenceComponent),
      },
      {
        path: 'keyboard-shortcuts',
        loadComponent: () =>
          import('./documentation/pages/keyboard-shortcuts/keyboard-shortcuts.component').then(
            (m) => m.KeyboardShortcutsComponent
          ),
      },
    ],
  },
  {
    path: 'examples',
    loadComponent: () => import('./examples/examples.component').then((m) => m.ExamplesComponent),
  },
  {
    path: 'quick-start',
    loadComponent: () => import('./quick-start/quick-start.component').then((m) => m.QuickStartComponent),
  },
  {
    path: 'live',
    loadComponent: () => import('./live-app/live-app.component').then((m) => m.LiveAppComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
