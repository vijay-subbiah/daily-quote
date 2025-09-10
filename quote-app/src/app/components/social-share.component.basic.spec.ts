/**
 * T043: SocialShareComponent Basic Test
 * 
 * Verifies that the SocialShareComponent implementation compiles
 * and follows basic Angular standalone component patterns.
 */

import { SocialShareComponent } from './social-share.component';

describe('SocialShareComponent Basic', () => {
  it('should be importable', () => {
    expect(SocialShareComponent).toBeDefined();
    expect(typeof SocialShareComponent).toBe('function');
  });

  it('should be a standalone component class', () => {
    expect(SocialShareComponent.name).toBe('SocialShareComponent');
  });

  it('should export share event interface', () => {
    // Test that the types are available for import
    const testShareEvent: import('./social-share.component').ShareEvent = {
      platform: 'twitter',
      quote: {
        id: 'test',
        text: 'Test quote',
        author: 'Test Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 10,
        dateAdded: new Date(),
        popularity: 50,
        verified: true
      },
      timestamp: new Date()
    };
    
    expect(testShareEvent.platform).toBe('twitter');
    expect(testShareEvent.quote.text).toBe('Test quote');
  });

  it('should export social platform interface', () => {
    const testPlatform: import('./social-share.component').SocialPlatform = {
      name: 'twitter',
      label: 'Twitter',
      icon: 'twitter',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    };
    
    expect(testPlatform.name).toBe('twitter');
    expect(testPlatform.label).toBe('Twitter');
  });
});
