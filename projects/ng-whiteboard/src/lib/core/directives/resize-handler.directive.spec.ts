import { ElementRef } from '@angular/core';
import { ResizeHandlerDirective } from './resize-handler.directive';
import { ApiService } from '../api/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { WhiteboardConfig } from '../types';

describe('ResizeHandlerDirective', () => {
  let directive: ResizeHandlerDirective;
  let mockElementRef: ElementRef;
  let mockApiService: jest.Mocked<ApiService>;
  let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>;
  let resizeCallback: (entries: ResizeObserverEntry[]) => void;

  beforeEach(() => {
    jest.useFakeTimers();

    const element = document.createElement('div');
    mockElementRef = new ElementRef(element);

    mockApiService = {
      getConfig: jest.fn(),
      fullScreen: jest.fn(),
      centerCanvas: jest.fn(),
    } as unknown as jest.Mocked<ApiService>;

    mockChangeDetectorRef = {
      detectChanges: jest.fn(),
    } as unknown as jest.Mocked<ChangeDetectorRef>;

    directive = new ResizeHandlerDirective(mockElementRef, mockApiService, mockChangeDetectorRef);

    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should call fullScreen if fullScreen is true', () => {
    // Arrange
    mockApiService.getConfig.mockReturnValue({ fullScreen: true, center: false } as WhiteboardConfig);

    directive.ngOnInit();
    // Act
    resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);
    jest.runAllTimers();

    // Assert
    expect(mockApiService.fullScreen).toHaveBeenCalled();
    expect(mockApiService.centerCanvas).not.toHaveBeenCalled();
    expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
  });

  it('should call centerCanvas if center is true and fullScreen is false', () => {
    // Arrange
    mockApiService.getConfig.mockReturnValue({ fullScreen: false, center: true } as WhiteboardConfig);

    directive.ngOnInit();
    // Act
    resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);
    jest.runAllTimers();

    // Assert
    expect(mockApiService.centerCanvas).toHaveBeenCalled();
    expect(mockApiService.fullScreen).not.toHaveBeenCalled();
    expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
  });

  it('should not call any canvas methods if neither fullScreen nor center is true', () => {
    // Arrange
    mockApiService.getConfig.mockReturnValue({ fullScreen: false, center: false } as WhiteboardConfig);

    directive.ngOnInit();
    // Act
    resizeCallback([{ target: mockElementRef.nativeElement } as ResizeObserverEntry]);
    jest.runAllTimers();

    // Assert
    expect(mockApiService.fullScreen).not.toHaveBeenCalled();
    expect(mockApiService.centerCanvas).not.toHaveBeenCalled();
    expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
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
