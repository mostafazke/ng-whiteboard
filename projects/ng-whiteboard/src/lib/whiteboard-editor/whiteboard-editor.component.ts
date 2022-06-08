import { AfterViewInit, Component, ContentChild, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ToolsEnum } from '../models/tools.enum';
import { NgWhiteboardComponent } from '../ng-whiteboard.component';

@Component({
  selector: 'ng-whiteboard-editor',
  templateUrl: './whiteboard-editor.component.html',
  styleUrls: ['./whiteboard-editor.component.scss'],
})
export class WhiteboardEditorComponent implements OnInit, AfterViewInit {
  @ContentChild(NgWhiteboardComponent) whiteboardComponent: NgWhiteboardComponent;
  @ViewChild('workarea', { static: false }) private workarea: ElementRef<HTMLElement>;
  @ViewChild('canvas_width', { static: false }) private canvasWidth: ElementRef<HTMLElement>;
  @ViewChild('canvas_height', { static: false }) private canvasHeight: ElementRef<HTMLElement>;

  toolsEnum = ToolsEnum;

  outerWidth = 1200;
  outerHeight = 750;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const dim = {
      w: this.whiteboard.canvasWidth,
      h: this.whiteboard.canvasHeight,
    };
    this.dragInput(this.canvasWidth.nativeElement, (value) => {
      dim.w = value;
      this.updateSize(value, dim.h);
    });
    this.dragInput(this.canvasHeight.nativeElement, (value) => {
      dim.h = value;
      this.updateSize(dim.w, value);
    });
    setTimeout(() => {
      this.calculateSize();
    }, 0);
  }

  get whiteboard() {
    return this.whiteboardComponent;
  }

  setSelectedTool(tool: ToolsEnum) {
    this.whiteboardComponent.selectedTool = tool;
  }

  dragInput(dragger: HTMLElement, cb: (value: number) => void) {
    const input = dragger.querySelector('input') as HTMLInputElement;
    const min = input.min ? parseInt(input.min, 10) : null;
    const max = input.max ? parseInt(input.max, 10) : null;
    const step = parseInt(input.step, 10);
    let area = max - min > 0 ? (max - min) / step : 200;
    let scale = (area / 70) * step;

    dragger.addEventListener('mousedown', (e) => {
      let lastY = 0;
      let value = parseInt(input.value, 10);

      const onMouseMove = (e: MouseEvent) => {
        if (lastY === 0) {
          lastY = e.pageY;
        }
        let deltaY = (e.pageY - lastY) * -1;
        lastY = e.pageY;
        let val = deltaY * scale * 1;
        let fixed = step < 1 ? 1 : 0;
        val.toFixed(fixed);
        val = Math.floor(Number(value) + Number(val));

        if (max !== null) value = Math.min(val, max);
        if (min !== null) value = Math.max(val, min);
        input.value = value.toString();
        cb(value);
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  calculateSize() {
    const workarea = this.workarea.nativeElement;
    const dim = {
      w: this.whiteboard.canvasWidth,
      h: this.whiteboard.canvasHeight,
    };
    let w = workarea.clientWidth;
    let h = workarea.clientHeight;
    const w_orig = w,
      h_orig = h;
    const zoom = this.whiteboard.zoom;

    const multi = 2;
    w = Math.max(w_orig, dim.w * zoom * multi);
    h = Math.max(h_orig, dim.h * zoom * multi);
    const scroll_x = w / 2 - w_orig / 2;
    const scroll_y = h / 2 - h_orig / 2;

    this.outerWidth = w;
    this.outerHeight = h;
    this.updateSize(dim.w, dim.h);

    setTimeout(() => {
      workarea.scrollLeft = scroll_x;
      workarea.scrollTop = scroll_y;
    }, 0);
  }

  updateSize(w: number, h: number) {
    this.whiteboard.canvasWidth = w;
    this.whiteboard.canvasHeight = h;
    const current_zoom = this.whiteboard.zoom;
    const contentW = this.outerWidth;
    const contentH = this.outerHeight;
    let x = contentW / 2 - (w * current_zoom) / 2;
    let y = contentH / 2 - (h * current_zoom) / 2;
    setTimeout(() => {
      this.whiteboard.x = x;
      this.whiteboard.y = y;
    }, 0);
  }

  zoomWheel(e: WheelEvent) {
    if (e.altKey || e.ctrlKey) {
      e.preventDefault();
      const zoom = this.whiteboard.zoom * 100;
      this.setZoom(Math.trunc(zoom - (e.deltaY / 100) * (e.altKey ? 10 : 5)));
    }
  }

  setZoom(new_zoom: number) {
    const old_zoom = this.whiteboard.zoom;
    let zoomlevel = new_zoom / 100;
    if (zoomlevel < 0.001) {
      zoomlevel = 0.1;
    }
    const dim = {
      w: this.whiteboard.canvasWidth,
      h: this.whiteboard.canvasHeight,
    };
    let animatedZoom = null;
    if (typeof animatedZoom !== 'undefined') window.cancelAnimationFrame(animatedZoom);
    // zoom duration 500ms
    let start = Date.now();
    let duration = 500;
    let diff = zoomlevel - old_zoom;
    let animateZoom = () => {
      let progress = Date.now() - start;
      let tick = progress / duration;
      tick = Math.pow(tick - 1, 3) + 1;
      this.whiteboard.zoom = old_zoom + diff * tick;
      this.updateSize(dim.w, dim.h);

      if (tick < 1 && tick > -0.9) {
        animatedZoom = requestAnimationFrame(animateZoom);
      } else {
        this.whiteboard.zoom = zoomlevel;
        this.updateSize(dim.w, dim.h);
      }
    };
    animateZoom();
  }

  setSizeResolution(value: string) {
    var w = this.whiteboard.canvasWidth;
    var h = this.whiteboard.canvasHeight;
    console.log(value);
    var dims: number[] = [];
    dims[0] = parseInt(value.split('x')[0]);
    dims[1] = parseInt(value.split('x')[1]);
    if (value == 'Custom') {
      return;
    } else if (value == 'content') {
      dims[0] = 100;
      dims[1] = 100;
    }
    var diff_w = dims[0] - w;
    var diff_h = dims[1] - h;

    let animatedSize = null;
    if (typeof animatedSize !== 'undefined') window.cancelAnimationFrame(animatedSize);
    let start = Date.now();
    let duration = 500;

    var animateCanvasSize = () => {
      let progress = Date.now() - start;
      let tick = progress / duration;
      tick = Math.pow(tick - 1, 3) + 1;
      w = parseInt((dims[0] - diff_w + tick * diff_w).toFixed(0));
      h = parseInt((dims[1] - diff_h + tick * diff_h).toFixed(0));
      this.updateSize(w, h);
      if (tick < 1 && tick > -0.9) {
        animatedSize = requestAnimationFrame(animateCanvasSize);
      } else {
        this.updateSize(w, h);
      }
    };
    animateCanvasSize();
  }
}
