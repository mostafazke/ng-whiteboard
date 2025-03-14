import { WhiteboardConfig } from '../core/types';
import { NgWhiteboardComponent } from '../ng-whiteboard.component';

export function InputConfig<K extends keyof WhiteboardConfig>() {
  return function (target: NgWhiteboardComponent, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return this.getConfigValue(propertyKey);
      },
      set: function (value: WhiteboardConfig[K]) {
        this.setConfigValue(propertyKey, value);
      },
      configurable: true,
    });
  };
}
