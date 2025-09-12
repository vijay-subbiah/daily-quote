import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
}

export interface NavigationTiming {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  totalLoadTime: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  url: string;
  navigationTiming: NavigationTiming;
  coreWebVitals: CoreWebVitals;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private coreWebVitals: CoreWebVitals = {};
  private navigationStartTime = 0;

  constructor(private router: Router) {
    this.initializePerformanceObservers();
    this.subscribeToNavigationEvents();
  }

  private initializePerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver is not supported in this environment');
      return;
    }

    try {
      // Observe Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          this.coreWebVitals.lcp = lastEntry.startTime;
          console.log(`🎯 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.coreWebVitals.fid = entry.processingStart - entry.startTime;
          console.log(`⚡ FID: ${this.coreWebVitals.fid.toFixed(2)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.coreWebVitals.cls = clsValue;
        console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.navigationStartTime = entry.startTime;
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

    } catch (error) {
      console.error('Error initializing PerformanceObserver:', error);
    }
  }

  private subscribeToNavigationEvents(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Wait a bit for the page to fully load before capturing metrics
        setTimeout(() => {
          this.logPerformanceMetrics(event.url);
        }, 100);
      });
  }

  private getNavigationTiming(): NavigationTiming {
    if (typeof window === 'undefined' || !window.performance) {
      return {
        navigationStart: 0,
        domContentLoaded: 0,
        loadComplete: 0,
        totalLoadTime: 0
      };
    }

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;
    const domContentLoaded = timing.domContentLoadedEventEnd - navigationStart;
    const loadComplete = timing.loadEventEnd - navigationStart;
    const totalLoadTime = loadComplete;

    return {
      navigationStart,
      domContentLoaded,
      loadComplete,
      totalLoadTime
    };
  }

  private logPerformanceMetrics(url: string): void {
    const navigationTiming = this.getNavigationTiming();
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      url,
      navigationTiming,
      coreWebVitals: { ...this.coreWebVitals }
    };

    console.group(`🚀 Performance Metrics for: ${url}`);
    console.log('📊 Navigation Timing:');
    console.log(`  • DOM Content Loaded: ${navigationTiming.domContentLoaded}ms`);
    console.log(`  • Load Complete: ${navigationTiming.loadComplete}ms`);
    console.log(`  • Total Load Time: ${navigationTiming.totalLoadTime}ms`);
    
    console.log('⭐ Core Web Vitals:');
    if (metrics.coreWebVitals.lcp) {
      console.log(`  • LCP: ${metrics.coreWebVitals.lcp.toFixed(2)}ms ${this.getLCPRating(metrics.coreWebVitals.lcp)}`);
    }
    if (metrics.coreWebVitals.fid) {
      console.log(`  • FID: ${metrics.coreWebVitals.fid.toFixed(2)}ms ${this.getFIDRating(metrics.coreWebVitals.fid)}`);
    }
    if (metrics.coreWebVitals.cls !== undefined) {
      console.log(`  • CLS: ${metrics.coreWebVitals.cls.toFixed(4)} ${this.getCLSRating(metrics.coreWebVitals.cls)}`);
    }
    console.groupEnd();

    // Reset CLS for next navigation
    this.coreWebVitals.cls = 0;
  }

  private getLCPRating(lcp: number): string {
    if (lcp <= 2500) return '✅ Good';
    if (lcp <= 4000) return '⚠️ Needs Improvement';
    return '❌ Poor';
  }

  private getFIDRating(fid: number): string {
    if (fid <= 100) return '✅ Good';
    if (fid <= 300) return '⚠️ Needs Improvement';
    return '❌ Poor';
  }

  private getCLSRating(cls: number): string {
    if (cls <= 0.1) return '✅ Good';
    if (cls <= 0.25) return '⚠️ Needs Improvement';
    return '❌ Poor';
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      url: this.router.url,
      navigationTiming: this.getNavigationTiming(),
      coreWebVitals: { ...this.coreWebVitals }
    };
  }

  /**
   * Manually trigger performance logging
   */
  public logCurrentMetrics(): void {
    this.logPerformanceMetrics(this.router.url);
  }
}