import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'documentation',
    loadComponent: () => import('./documentation/documentation.component').then((m) => m.DocumentationComponent),
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
