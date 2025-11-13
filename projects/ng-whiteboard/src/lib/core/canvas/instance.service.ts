import { Injectable, Signal, signal } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private readonly instances = new Map<string, ApiService>();

  private readonly _activeId = signal<string | null>(null);

  readonly activeId: Signal<string | null> = this._activeId.asReadonly();

  private readonly _registryVersion = signal(0);

  readonly registryVersion: Signal<number> = this._registryVersion.asReadonly();

  register(id: string, instance: ApiService): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Whiteboard instance ID cannot be empty.');
    }

    if (!(instance instanceof ApiService)) {
      throw new Error('Instance must be an ApiService instance.');
    }

    this.instances.set(id, instance);
    this._registryVersion.update((v) => v + 1);
  }

  unregister(id: string): boolean {
    const result = this.instances.delete(id);

    if (result) {
      if (this._activeId() === id) {
        this._activeId.set(null);
      }
      this._registryVersion.update((v) => v + 1);
    }

    return result;
  }

  getInstance(id: string): ApiService | undefined {
    return this.instances.get(id);
  }

  hasInstance(id: string): boolean {
    return this.instances.has(id);
  }

  getAllInstanceIds(): ReadonlyArray<string> {
    return Array.from(this.instances.keys());
  }

  getInstanceCount(): number {
    return this.instances.size;
  }

  setActive(id: string): void {
    if (!this.hasInstance(id)) {
      throw new Error(`Whiteboard with ID "${id}" not found in registry. Cannot set as active.`);
    }
    this._activeId.set(id);
  }

  clearActive(): void {
    this._activeId.set(null);
  }

  getActiveInstance(): ApiService | undefined {
    const id = this._activeId();
    return id ? this.instances.get(id) : undefined;
  }

  clearAll(): void {
    this.instances.clear();
    this._activeId.set(null);
    this._registryVersion.update((v) => v + 1);
  }
}
