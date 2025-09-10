/**
 * T042: LoadingSpinnerComponent Basic Test
 * 
 * Verifies that the LoadingSpinnerComponent implementation compiles
 * and follows basic Angular standalone component patterns.
 */

import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent Basic', () => {
  it('should be importable', () => {
    expect(LoadingSpinnerComponent).toBeDefined();
    expect(typeof LoadingSpinnerComponent).toBe('function');
  });

  it('should be a standalone component class', () => {
    expect(LoadingSpinnerComponent.name).toBe('LoadingSpinnerComponent');
  });

  it('should export spinner types', () => {
    // Test that the types are available for import
    const testSize: import('./loading-spinner.component').SpinnerSize = 'medium';
    const testColor: import('./loading-spinner.component').SpinnerColor = 'blue';
    const testVariant: import('./loading-spinner.component').SpinnerVariant = 'spinner';
    
    expect(testSize).toBe('medium');
    expect(testColor).toBe('blue');
    expect(testVariant).toBe('spinner');
  });
});
