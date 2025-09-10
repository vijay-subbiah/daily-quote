import { Component } from '@angular/core';
import { QuoteOfTheDayComponent } from './components/quote-of-the-day.component';

@Component({
  selector: 'app-root',
  imports: [QuoteOfTheDayComponent],
  template: '<app-quote-of-the-day></app-quote-of-the-day>',
  styleUrl: './app.scss'
})
export class App {}
