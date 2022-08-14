import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./home/home.module').then((m) => m.HomeModule) },
  {
    path: 'documentation',
    loadChildren: () => import('./documentation/documentation.module').then((m) => m.DocumentationModule),
  },
  { path: 'examples', loadChildren: () => import('./examples/examples.module').then((m) => m.ExamplesModule) },
  {
    path: 'quick-start',
    loadChildren: () => import('./quick-start/quick-start.module').then((m) => m.QuickStartModule),
  },
  { path: 'live', loadChildren: () => import('./live-app/live-app.module').then((m) => m.LiveAppModule) },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
