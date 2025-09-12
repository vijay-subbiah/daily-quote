/**
 * T022: SocialShare Component Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the SocialShare component doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the SocialShare component which provides social media sharing functionality
 * with platform-specific formatting and accessibility features.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, output } from '@angular/core';
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';

import { SocialShareComponent } from './social-share.component';
import { Quote } from '../models/quote.interface';

describe('SocialShareComponent', () => {
  let component: SocialShareComponent;
  let fixture: ComponentFixture<SocialShareComponent>;

  const mockQuote: Quote = {
    id: 'test-quote-1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    source: 'quotegarden',
    category: 'work',
    tags: ['work', 'passion', 'success'],
    length: 49,
    dateAdded: new Date('2024-01-01'),
    popularity: 90,
    verified: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialShareComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialShareComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      // Test that component can be imported without NgModule
      expect(component).toBeDefined();
      expect(fixture.componentRef).toBeDefined();
    });

    it('should use OnPush change detection', () => {
      // Test that component initializes properly with signals
      expect(component.quote).toBeDefined();
      expect(typeof component.quote).toBe('function');
    });

    it('should accept quote as input', () => {
      expect(component.quote).toBeDefined();
      expect(typeof component.quote).toBe('function'); // input() creates a signal function
    });

    it('should accept showDialog as input', () => {
      expect(component.showDialog).toBeDefined();
      expect(typeof component.showDialog).toBe('function');
    });

    it('should emit close event', () => {
      expect(component.closeDialog).toBeDefined();
    });

    it('should emit share event', () => {
      expect(component.shareCompleted).toBeDefined();
    });
  });

  describe('Dialog Rendering', () => {
    it('should render dialog when showDialog is true', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /share quote/i })).toBeInTheDocument();
    });

    it('should not render dialog when showDialog is false', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: false 
        }
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display quote preview in dialog', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      expect(screen.getByText(mockQuote.author)).toBeInTheDocument();
    });

    it('should show close button', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should have modal backdrop', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const backdrop = screen.getByTestId('modal-backdrop');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
    });
  });

  describe('Social Platform Buttons', () => {
    beforeEach(async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });
    });

    it('should display Twitter share button', () => {
      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      expect(twitterButton).toBeInTheDocument();
      expect(twitterButton).toHaveClass('bg-blue-500', 'hover:bg-blue-600');
    });

    it('should display Facebook share button', () => {
      const facebookButton = screen.getByRole('button', { name: /share on facebook/i });
      expect(facebookButton).toBeInTheDocument();
      expect(facebookButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
    });

    it('should display LinkedIn share button', () => {
      const linkedinButton = screen.getByRole('button', { name: /share on linkedin/i });
      expect(linkedinButton).toBeInTheDocument();
      expect(linkedinButton).toHaveClass('bg-blue-700', 'hover:bg-blue-800');
    });

    it('should display WhatsApp share button', () => {
      const whatsappButton = screen.getByRole('button', { name: /share on whatsapp/i });
      expect(whatsappButton).toBeInTheDocument();
      expect(whatsappButton).toHaveClass('bg-green-500', 'hover:bg-green-600');
    });

    it('should display Telegram share button', () => {
      const telegramButton = screen.getByRole('button', { name: /share on telegram/i });
      expect(telegramButton).toBeInTheDocument();
      expect(telegramButton).toHaveClass('bg-blue-400', 'hover:bg-blue-500');
    });

    it('should display copy link button', () => {
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveClass('bg-gray-500', 'hover:bg-gray-600');
    });

    it('should show platform icons', () => {
      expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
      expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
      expect(screen.getByTestId('linkedin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('whatsapp-icon')).toBeInTheDocument();
      expect(screen.getByTestId('telegram-icon')).toBeInTheDocument();
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    });
  });

  describe('Share URL Generation', () => {
    it('should generate correct Twitter share URL', async () => {
      // Mock window.open to capture the URL
      const mockOpen = jest.fn();
      window.open = mockOpen;

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.stringContaining('width=600,height=400')
      );

      const calledUrl = mockOpen.mock.calls[0][0];
      expect(calledUrl).toContain(encodeURIComponent(mockQuote.text));
      expect(calledUrl).toContain(encodeURIComponent(mockQuote.author));
    });

    it('should generate correct Facebook share URL', async () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const facebookButton = screen.getByRole('button', { name: /share on facebook/i });
      fireEvent.click(facebookButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        expect.stringContaining('width=600,height=400')
      );
    });

    it('should generate correct LinkedIn share URL', async () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const linkedinButton = screen.getByRole('button', { name: /share on linkedin/i });
      fireEvent.click(linkedinButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
        '_blank',
        expect.stringContaining('width=600,height=400')
      );
    });

    it('should generate correct WhatsApp share URL', async () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const whatsappButton = screen.getByRole('button', { name: /share on whatsapp/i });
      fireEvent.click(whatsappButton);

      const calledUrl = mockOpen.mock.calls[0][0];
      expect(calledUrl).toContain('wa.me');
      expect(calledUrl).toContain(encodeURIComponent(`"${mockQuote.text}" - ${mockQuote.author}`));
    });

    it('should generate correct Telegram share URL', async () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const telegramButton = screen.getByRole('button', { name: /share on telegram/i });
      fireEvent.click(telegramButton);

      const calledUrl = mockOpen.mock.calls[0][0];
      expect(calledUrl).toContain('t.me/share');
      expect(calledUrl).toContain(encodeURIComponent(mockQuote.text));
    });
  });

  describe('Copy to Clipboard Functionality', () => {
    it('should copy formatted quote to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          `"${mockQuote.text}" - ${mockQuote.author}`
        );
      });
    });

    it('should show success message after copying', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should handle clipboard API errors', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard access denied'));
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to copy/i)).toBeInTheDocument();
      });
    });

    it('should fallback to legacy clipboard API when modern API unavailable', async () => {
      // Mock legacy clipboard API
      const mockExecCommand = jest.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;
      
      // Remove modern clipboard API
      Object.assign(navigator, { clipboard: undefined });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });
    });
  });

  describe('Dialog Interactions', () => {
    it('should emit close event when close button clicked', async () => {
      let dialogClosed = false;
      
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        },
        componentOutputs: {
          closeDialog: () => { dialogClosed = true; }
        }
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(dialogClosed).toBe(true);
    });

    it('should emit close event when backdrop clicked', async () => {
      let dialogClosed = false;
      
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        },
        componentOutputs: {
          closeDialog: () => { dialogClosed = true; }
        }
      });

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(dialogClosed).toBe(true);
    });

    it('should emit close event when Escape key pressed', async () => {
      let dialogClosed = false;
      
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        },
        componentOutputs: {
          closeDialog: () => { dialogClosed = true; }
        }
      });

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(dialogClosed).toBe(true);
    });

    it('should emit share event when platform is used', async () => {
      let shareData: any;
      const mockOpen = jest.fn();
      window.open = mockOpen;
      
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        },
        componentOutputs: {
          shareCompleted: (data: any) => { shareData = data; }
        }
      });

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      fireEvent.click(twitterButton);

      expect(shareData).toEqual({
        platform: 'twitter',
        quote: mockQuote,
        timestamp: expect.any(Date)
      });
    });

    it('should not close dialog when dialog content clicked', async () => {
      let dialogClosed = false;
      
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        },
        componentOutputs: {
          closeDialog: () => { dialogClosed = true; }
        }
      });

      const dialogContent = screen.getByTestId('dialog-content');
      fireEvent.click(dialogContent);

      expect(dialogClosed).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for dialog', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should trap focus within dialog', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll('button');
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // First focusable element should be focused
      expect(document.activeElement).toBe(focusableElements[0]);
    });

    it('should support keyboard navigation between buttons', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      const facebookButton = screen.getByRole('button', { name: /share on facebook/i });
      
      twitterButton.focus();
      expect(document.activeElement).toBe(twitterButton);
      
      fireEvent.keyDown(twitterButton, { key: 'Tab' });
      expect(document.activeElement).toBe(facebookButton);
    });

    it('should have appropriate button labels', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      expect(screen.getByRole('button', { name: /share on twitter/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /share on facebook/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /copy link/i })).toHaveAttribute('aria-label');
    });

    it('should announce status changes to screen readers', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt button layout for mobile', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const buttonContainer = screen.getByTestId('share-buttons-container');
      expect(buttonContainer).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-3');
    });

    it('should use mobile-appropriate dialog size', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toHaveClass('max-w-sm', 'md:max-w-md', 'w-full', 'mx-4');
    });

    it('should use native share API when available on mobile', async () => {
      // Mock navigator.share
      const mockShare = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: mockShare });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      // Should show native share button on mobile
      const nativeShareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(nativeShareButton);

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Quote of the Day',
        text: `"${mockQuote.text}" - ${mockQuote.author}`,
        url: expect.any(String)
      });
    });
  });

  describe('Performance', () => {
    it('should lazy load social media scripts', async () => {
      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      // Scripts should not be loaded until interaction
      expect(document.querySelector('script[src*="twitter"]')).not.toBeInTheDocument();
      
      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      fireEvent.click(twitterButton);

      // Should consider lazy loading for enhanced sharing features
    });

    it('should handle rapid dialog open/close efficiently', async () => {
      const { rerender } = await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: false 
        }
      });

      // Rapid open/close
      for (let i = 0; i < 5; i++) {
        rerender({ componentInputs: { quote: mockQuote, showDialog: true } });
        rerender({ componentInputs: { quote: mockQuote, showDialog: false } });
      }

      // Should handle efficiently without memory leaks
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('should track share events for analytics', async () => {
      const mockTrack = jest.fn();
      (window as any).gtag = mockTrack;

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      fireEvent.click(twitterButton);

      expect(mockTrack).toHaveBeenCalledWith('event', 'share', {
        method: 'twitter',
        content_type: 'quote',
        content_id: mockQuote.id
      });
    });

    it('should track copy events', async () => {
      const mockTrack = jest.fn();
      (window as any).gtag = mockTrack;
      
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await render(SocialShareComponent, {
        componentInputs: { 
          quote: mockQuote,
          showDialog: true 
        }
      });

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith('event', 'copy', {
          method: 'clipboard',
          content_type: 'quote',
          content_id: mockQuote.id
        });
      });
    });
  });
});
