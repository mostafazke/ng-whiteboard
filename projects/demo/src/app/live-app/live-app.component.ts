import { Component, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';
import { NgWhiteboardService, WhiteboardElement } from 'ng-whiteboard';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-whiteboard-live-app',
  templateUrl: './live-app.component.html',
  styleUrls: ['./live-app.component.scss'],
  providers: [NgWhiteboardService],
})
export class LiveAppComponent implements OnInit {
  data: WhiteboardElement[] = [];
  loading = false;

  ngOnInit(): void {
    const app = initializeApp({
      apiKey: environment.apiKey,
      authDomain: environment.authDomain,
      projectId: environment.projectId,
      storageBucket: environment.storageBucket,
      messagingSenderId: environment.messagingSenderId,
      appId: environment.appId,
      measurementId: environment.measurementId,
      databaseURL: environment.databaseURL,
    });
    const db = getDatabase(app);
    const starCountRef = ref(db, 'data/');
    this.loading = true;
    onValue(starCountRef, (snapshot) => {
      this.loading = false;
      const data = snapshot.val();
      this.data = data || [];
    });
  }

  onDataChange(data: WhiteboardElement[]) {
    if (this.loading) {
      return;
    }

    this.data = data;
    const db = getDatabase();
    set(ref(db, 'data/'), data);
  }
}
