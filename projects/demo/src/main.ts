import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  // waiting for angular to load bootstrapping and then only loading service worker
  .then(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`/ngsw-worker.js`);
      console.log(`Registered as service worker`);
    }
  })
  .catch(err => console.log(err));
