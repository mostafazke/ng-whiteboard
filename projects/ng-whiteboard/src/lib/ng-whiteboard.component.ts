import {
  Component,
  AfterViewInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  OnDestroy
} from '@angular/core';
import * as d3 from 'd3';
import { svgAsPngUri } from 'save-svg-as-png';
import { WhiteboardOptions, NgWhiteboardService } from './ng-whiteboard.service';
import { Subscription } from 'rxjs';
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ng-whiteboard',
  template: `
    <svg
      #svgContainer
      [style.background-color]="this.backgroundColor || this.whiteboardOptions.backgroundColor"
      (window:resize)="onResize()"
    ></svg>
  `,
  styleUrls: ['ng-whiteboard.component.scss']
})
//
//      [style.background-image]="'url(' + this.backgroundImage || this.whiteboardOptions.backgroundImage + ')'"
export class NgWhiteboardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('svgContainer', { static: false }) private svgContainer: ElementRef<SVGElement>;
  @Input() whiteboardOptions: WhiteboardOptions = new WhiteboardOptions();
  @Input() color: string;
  @Input() backgroundColor: string;
  @Input() backgroundImage: string;
  @Input() size: string;
  @Input() linejoin: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs';
  @Input() linecap: 'butt' | 'square' | 'round';
  private selection = undefined;

  private subscriptionList: Subscription[] = [];
  private undoStack: any[] = [];
  private redoStack: any[] = [];

  constructor(private whiteboardService: NgWhiteboardService) {}

  ngAfterViewInit() {
    this.subscriptionList.push(
      this.whiteboardService.eraseSvgMethodCalled$.subscribe(() => this.eraseSvg(this.selection))
    );

    this.subscriptionList.push(
      this.whiteboardService.saveSvgMethodCalled$.subscribe(() => this.save(this.svgContainer.nativeElement))
    );
    this.subscriptionList.push(this.whiteboardService.undoSvgMethodCalled$.subscribe(() => this.undoSvg()));
    this.subscriptionList.push(this.whiteboardService.redoSvgMethodCalled$.subscribe(() => this.redoSvg()));

    this.selection = this.init(this.svgContainer.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.selection) {
      return;
    }
    if (changes.backgroundImage) {
      this.selection
        .append('image')
        // .attr('class', 'bg-image')
        // .attr('max-width', svg.style('width'))
        .attr('height', this.selection.style('height'))
        .attr('preserveAspectRatio', 'none')
        .attr('xlink:href', this.backgroundImage);
    }
  }
  ngOnDestroy(): void {
    this.subscriptionList.forEach(subscription => this._unsubscribe(subscription));
  }
  init(selector) {
    const line = d3.line().curve(d3.curveBasis);
    const svg = d3.select(selector).call(
      d3
        .drag()
        .container(selector)
        .subject(() => {
          const p = [d3.event.x, d3.event.y];
          return [p, p];
        })
        .on('start', () => {
          const d = d3.event.subject;
          const active = svg
            .append('path')
            .datum(d)
            .attr('class', 'line')
            .attr(
              'style',
              `
           fill: none;
           stroke: ${this.color || this.whiteboardOptions.color};
           stroke-width: ${this.size || this.whiteboardOptions.size};
           stroke-linejoin: ${this.linejoin || this.whiteboardOptions.linejoin};
           stroke-linecap: ${this.linecap || this.whiteboardOptions.linecap};
           `
            );
          d3.event.on('drag', function() {
            active.datum().push(d3.mouse(this));
            active.attr('d', line);
          });
          d3.event.on('end', () => {
            // active.attr('d', line);
            if (this.undoStack.length < 1) {
              this.redoStack = [];
            }
            this.undoStack.push(active);
          });
        })
    );
    return svg;
  }

  eraseSvg(svg) {
    svg.selectAll('.line').remove();
  }

  save(el) {
    svgAsPngUri(el, {}, uri => {
      if (navigator.msSaveBlob) {
        const filename = 'new white-board';
        navigator.msSaveBlob(uri, filename);
      } else {
        const link = document.createElement('a');

        link.href = uri;

        link.setAttribute('visibility', 'hidden');
        link.download = 'new white-board';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }

  undoSvg() {
    if (!this.undoStack.length) {
      return;
    }
    this.redoStack.push(this.undoStack.pop());
    this.eraseSvg(this.selection);

    this.undoStack.forEach(path => {
      this.drawSvg(this.selection, path);
    });
  }

  redoSvg() {
    if (!this.redoStack.length) {
      return;
    }
    this.undoStack.push(this.redoStack.pop());
    this.eraseSvg(this.selection);
    this.undoStack.forEach(path => {
      this.drawSvg(this.selection, path);
    });
  }

  drawSvg(svg, path) {
    svg
      .append('path')
      .datum(path.datum())
      .attr('class', 'line')
      .attr(
        'style',
        `
   fill: none;
   stroke: ${path.style('stroke')};
   stroke-width: ${path.style('stroke-width')};
   stroke-linejoin: ${path.style('stroke-linejoin')};
   stroke-linecap: ${path.style(' stroke-linecap')};
   `
      )
      .attr('d', path.attr('d'));
  }

  onResize() {
    // this.createChart();
    // d3.select('.bg-image')
    //   .attr('width', this.selection.style('width'))
    //   .attr('height', this.selection.style('height'));
  }

  private _unsubscribe(subscription: Subscription): void {
    if (subscription) {
      subscription.unsubscribe();
    }
  }
}
