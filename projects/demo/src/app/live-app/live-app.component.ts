import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';
import { NgWhiteboardService, WhiteboardElement } from 'ng-whiteboard';
import { environment } from '../../environments/environment';
import { BasicComponent } from '../examples/basic/basic.component';

@Component({
  selector: 'app-whiteboard-live-app',
  templateUrl: './live-app.component.html',
  styleUrls: ['./live-app.component.scss'],
  standalone: true,
  imports: [CommonModule, BasicComponent],
  providers: [NgWhiteboardService],
})
export class LiveAppComponent implements OnInit {
  private isSyncing = false;
  private whiteboardService = inject(NgWhiteboardService);
  private readonly boardId = 'whiteboard-app'; // Match the board ID used in BasicComponent

  ngOnInit(): void {
    // Set the active board for the service
    this.whiteboardService.setActiveBoard(this.boardId);

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

    // Listen to Firebase changes and update whiteboard
    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();
      const elements = data || [];

      // Prevent circular updates
      this.isSyncing = true;
      this.whiteboardService.setElements(elements);
      this.isSyncing = false;
    });
  }

  onDataChange(data: WhiteboardElement[]): void {
    // Prevent circular updates from Firebase listener
    if (this.isSyncing) {
      return;
    }

    const db = getDatabase();
    const sanitizedData = this.sanitizeData(data);
    set(ref(db, 'data/'), sanitizedData);
  }

  private sanitizeData(data: WhiteboardElement[]): WhiteboardElement[] {
    return data.map((element) => {
      // Deep clone and sanitize the element
      const sanitized = this.deepSanitize(element) as WhiteboardElement;

      // Check for NaN in numeric properties
      if (isNaN(sanitized.x)) sanitized.x = 0;
      if (isNaN(sanitized.y)) sanitized.y = 0;
      if (isNaN(sanitized.rotation)) sanitized.rotation = 0;
      if (isNaN(sanitized.opacity)) sanitized.opacity = 1;
      if (isNaN(sanitized.zIndex)) sanitized.zIndex = 0;
      if (sanitized.scaleX && isNaN(sanitized.scaleX)) sanitized.scaleX = 1;
      if (sanitized.scaleY && isNaN(sanitized.scaleY)) sanitized.scaleY = 1;

      // Sanitize points array for pen elements
      if ('points' in sanitized && Array.isArray(sanitized.points)) {
        const points = sanitized.points as unknown as number[][];
        sanitized.points = points
          .filter((point) => Array.isArray(point) && point.length >= 2)
          .map((point) => {
            // Ensure only [x, y] tuples and remove any NaN values
            const [x, y] = point;
            return [isNaN(x) ? 0 : x, isNaN(y) ? 0 : y] as [number, number];
          });
      }

      return sanitized;
    });
  }

  private deepSanitize(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Remove functions
    if (typeof obj === 'function') {
      return undefined;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item)).filter((item) => item !== undefined);
    }

    // Handle objects
    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = this.deepSanitize((obj as Record<string, unknown>)[key]);
          // Only include the property if it's not a function
          if (value !== undefined) {
            sanitized[key] = value;
          }
        }
      }
      return sanitized;
    }

    return obj;
  }
}
