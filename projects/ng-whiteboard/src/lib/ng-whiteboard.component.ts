import { Component, AfterViewInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { svgAsPngUri } from 'save-svg-as-png';
import { WhiteboardOptions, NgWhiteboardService } from './ng-whiteboard.service';
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ng-whiteboard',
  template: `
    <svg
      #svgContainer
      [style.background-color]="this.backgroundColor || this.whiteboardOptions.backgroundColor"
      (window:resize)="onResize($event)"
    ></svg>
  `,
  styleUrls: ['ng-whiteboard.component.scss']
})
//
//      [style.background-image]="'url(' + this.backgroundImage || this.whiteboardOptions.backgroundImage + ')'"
export class NgWhiteboardComponent implements AfterViewInit, OnChanges {
  @ViewChild('svgContainer', { static: false })
  private svgContainer;
  @Input() whiteboardOptions: WhiteboardOptions = new WhiteboardOptions();
  @Input() color: string;
  @Input() backgroundColor: string;
  @Input() backgroundImage: string;
  @Input() size: string;
  @Input() linejoin: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs';
  @Input() linecap: 'butt' | 'square' | 'round';
  selection = undefined;
  constructor(private whiteboardService: NgWhiteboardService) {}
  // [style.background-image]="'url(' + this.backgroundImage + ')'"
  // [style.background-image]="'url(' + this.whiteboardOptions.backgroundImage + ')'"
  ngAfterViewInit() {
    this.selection = this.init(this.svgContainer.nativeElement);
    this.whiteboardService.eraseSvgMethodCalled$.subscribe(() => {
      this.eraseSvg(this.selection);
    });
    this.whiteboardService.saveSvgMethodCalled$.subscribe(() => {
      this.save(this.svgContainer.nativeElement);
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.backgroundImage) {
      d3.select('.bg-image').attr('xlink:href', this.backgroundImage);
    }
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
          active.attr('d', line);
        })
    );
    svg
      .append('image')
      .attr('class', 'bg-image')
      .attr('width', svg.style('width'))
      .attr('preserveAspectRatio', 'none')
      .attr('height', svg.style('height'));
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
  onResize() {
    // this.createChart();
    d3.select('.bg-image')
      .attr('width', this.selection.style('width'))
      .attr('height', this.selection.style('height'));
  }
}
