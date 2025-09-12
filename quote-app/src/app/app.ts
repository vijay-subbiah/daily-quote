import { Component, inject } from '@angular/core';
import { QuoteOfTheDayComponent } from './components/quote-of-the-day.component';
import { PerformanceMonitorService } from './services/performance-monitor.service';

@Component({
  selector: 'app-root',
  imports: [QuoteOfTheDayComponent],
  template: '<app-quote-of-the-day></app-quote-of-the-day>',
  styleUrl: './app.scss'
})
export class App {
  // Inject the performance monitor service to initialize it
  private performanceMonitor = inject(PerformanceMonitorService);
}
