import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LiveAppComponent } from './live-app.component';

const routes: Routes = [{ path: '', component: LiveAppComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LiveAppRoutingModule { }
