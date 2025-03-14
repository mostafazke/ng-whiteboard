import { ElementRef } from '@angular/core';
import { ResizeHandlerDirective } from './resize-handler.directive';
import { DataService } from '../data/data.service';
import { ChangeDetectorRef } from '@angular/core';
import { WhiteboardConfig } from '../types';

describe('ResizeHandlerDirective', () => {
  let directive: ResizeHandlerDirective;
  let mockElementRef: ElementRef;
  let mockDataService: jest.Mocked<DataService>;
  let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>;
  let resizeCallback: (entries: ResizeObserverEntry[]) => void;

  beforeEach(() => {
    const element = document.createElement('div');
    mockElementRef = new ElementRef(element);

    mockDataService = {
      getConfig: jest.fn(),
      fullScreen: jest.fn(),
      centerCanvas: jest.fn(),
    } as unknown as jest.Mocked<DataService>;

    mockChangeDetectorRef = {
      detectChanges: jest.fn(),
    } as unknown as jest.Mocked<ChangeDetectorRef>;

    directive = new ResizeHandlerDirective(mockElementRef, mockDataService, mockChangeDetectorRef);

    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should call fullScreen if fullScreen is true', () => {
    // Arrange
    mockDataService.getConfig.mockReturnValue({ fullScreen: true, center: false } as WhiteboardConfig);

    directive.ngOnInit();
    // Act
    resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);

    // Assert
    expect(mockDataService.fullScreen).toHaveBeenCalled();
    expect(mockDataService.centerCanvas).not.toHaveBeenCalled();
    expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
  });

  it('should call centerCanvas if center is true and fullScreen is false', () => {
    // Arrange
    mockDataService.getConfig.mockReturnValue({ fullScreen: false, center: true } as WhiteboardConfig);

    directive.ngOnInit();
    // Act
    resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);

    // Assert
    expect(mockDataService.centerCanvas).toHaveBeenCalled();
    expect(mockDataService.fullScreen).not.toHaveBeenCalled();
    expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
  });

  it('should not call any canvas methods if neither fullScreen nor center is true', () => {
    // Arrange
    mockDataService.getConfig.mockReturnValue({ fullScreen: false, center: false } as WhiteboardConfig);

    directive.ngOnInit();
    // Act
    resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);

    // Assert
    expect(mockDataService.fullScreen).not.toHaveBeenCalled();
    expect(mockDataService.centerCanvas).not.toHaveBeenCalled();
  });

  it('should disconnect ResizeObserver on destroy', () => {
    // Arrange
    const disconnectMock = jest.fn();
    (global.ResizeObserver as jest.Mock).mockImplementationOnce(() => ({
      observe: jest.fn(),
      disconnect: disconnectMock,
    }));

    directive.ngOnInit();

    // Act
    directive.ngOnDestroy();

    // Assert
    expect(disconnectMock).toHaveBeenCalled();
  });
});
