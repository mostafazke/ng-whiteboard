import { NgWhiteboardService } from './ng-whiteboard.service';
import { NgWhiteboardComponent } from './ng-whiteboard.component';
import { autoSpy } from 'autoSpy';

describe('NgWhiteboardComponent', () => {
  it('when ngAfterViewInit is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    c.ngAfterViewInit();
    // assert
    // expect(c).toEqual
  });

  it('when ngOnDestroy is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    c.ngOnDestroy();
    // assert
    // expect(c).toEqual
  });
});

function setup() {
  const whiteboardService = autoSpy(NgWhiteboardService);
  const builder = {
    whiteboardService,
    default() {
      return builder;
    },
    build() {
      return new NgWhiteboardComponent(whiteboardService);
    },
  };

  return builder;
}
