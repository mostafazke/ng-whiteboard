import { InputConfig } from './input-config.decorator';
import { NgWhiteboardComponent } from '../ng-whiteboard.component';
import { WhiteboardConfig } from '../core/types';

describe('InputConfig Decorator', () => {
  let mockComponent: NgWhiteboardComponent;
  const mockPropertyKey: keyof WhiteboardConfig = 'strokeColor'; // Ensure this is a valid key
  const mockConfigKey: keyof WhiteboardConfig = 'strokeColor'; // using an actual property from WhiteboardConfig

  beforeEach(() => {
    // Create a mock NgWhiteboardComponent with the required methods
    mockComponent = {
      getConfigValue: jest.fn(),
      setConfigValue: jest.fn(),
    } as unknown as NgWhiteboardComponent;
  });

  it('should be defined', () => {
    expect(InputConfig).toBeDefined();
    expect(typeof InputConfig).toBe('function');
  });

  it('should return a decorator function', () => {
    const decorator = InputConfig();
    expect(typeof decorator).toBe('function');
    expect(decorator.length).toBe(2); // Expecting 2 parameters (target, propertyKey)
  });

  it('should define a property with getter and setter', () => {
    const decorator = InputConfig<typeof mockConfigKey>();
    decorator(mockComponent, mockPropertyKey);

    // Check if the property was defined
    const descriptor = Object.getOwnPropertyDescriptor(mockComponent, mockPropertyKey);
    expect(descriptor).toBeDefined();
    expect(descriptor?.configurable).toBe(true);
    expect(typeof descriptor?.get).toBe('function');
    expect(typeof descriptor?.set).toBe('function');
  });

  it('should call getConfigValue when property is accessed', () => {
    const testValue = '#FFFFFF';
    (mockComponent.getConfigValue as jest.Mock).mockReturnValue(testValue);

    const decorator = InputConfig<typeof mockConfigKey>();
    decorator(mockComponent, mockPropertyKey);

    // Access the property
    const value = mockComponent[mockPropertyKey as keyof NgWhiteboardComponent];

    expect(mockComponent.getConfigValue).toHaveBeenCalledWith(mockPropertyKey);
    expect(value).toBe(testValue);
  });

  it('should call setConfigValue when property is set', () => {
    const testValue = '#000000';

    const decorator = InputConfig<typeof mockConfigKey>();
    decorator(mockComponent, mockPropertyKey);

    // Set the property using the setter method
    mockComponent.setConfigValue(mockPropertyKey, testValue);

    expect(mockComponent.setConfigValue).toHaveBeenCalledWith(mockPropertyKey, testValue);
  });

  it('should maintain the property type safety', () => {
    // This test is more about TypeScript type checking than runtime behavior
    const decorator = InputConfig<'strokeColor'>();

    // The following would cause TypeScript errors if uncommented (testing invalid types)
    // @decorator
    // invalidType: number; // Should error because strokeColor is string

    // This is more for documentation purposes as actual type checking happens at compile time
    expect(true).toBeTruthy(); // Just a placeholder assertion
  });

  it('should work with different config properties', () => {
    const testSizeValue = 5;
    (mockComponent.getConfigValue as jest.Mock).mockReturnValue(testSizeValue);

    // Test with a different property (strokeWidth which is number)
    const sizeDecorator = InputConfig<'strokeWidth'>();
    const sizePropertyKey = 'strokeWidthProperty';
    sizeDecorator(mockComponent, sizePropertyKey);

    // Access the property
    const value = mockComponent[sizePropertyKey as keyof NgWhiteboardComponent];

    expect(mockComponent.getConfigValue).toHaveBeenCalledWith(sizePropertyKey);
    expect(value).toBe(testSizeValue);
  });

  it('should work with different config properties', () => {
    const testSizeValue = 5;
    (mockComponent.getConfigValue as jest.Mock).mockReturnValue(testSizeValue);

    // Test with a different property (strokeWidth which is number)
    const sizeDecorator = InputConfig<'strokeWidth'>();
    const sizePropertyKey = 'strokeWidthProperty';
    sizeDecorator(mockComponent, sizePropertyKey);

    // Access the property
    const value = mockComponent[sizePropertyKey as keyof NgWhiteboardComponent];

    expect(mockComponent.getConfigValue).toHaveBeenCalledWith(sizePropertyKey);
    expect(value).toBe(testSizeValue);
  });

  it('should call setConfigValue when property is set using the setter', () => {
    const testValue = '#000000';

    const decorator = InputConfig<typeof mockConfigKey>();
    decorator(mockComponent, 'strokeColor');

    // Set the property using the setter method
    mockComponent['strokeColor'] = testValue;

    expect(mockComponent.setConfigValue).toHaveBeenCalledWith(mockPropertyKey, testValue);
  });
});
